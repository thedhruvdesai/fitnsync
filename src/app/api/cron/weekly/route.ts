import { NextResponse } from "next/server";
import { Resend } from "resend";
import { generateFeedback } from "@/lib/coach";
import { weeklyEmailHtml } from "@/lib/email";
import { addDays, isoDate, summarizeWeek, weekStart } from "@/lib/report";
import { siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/server";
import type { DailyLog, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Sends last week's summary to every onboarded user (depth depends on tier) and
 * generates the Elite coach review. Safe to call repeatedly: it processes users in
 * small batches within a time budget and skips anyone already emailed this week.
 * Call it until the response says { done: true }.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const t0 = Date.now();
  const BUDGET_MS = 20_000;
  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const thisMonday = weekStart(isoDate(new Date()));
  const start = addDays(thisMonday, -7); // the week that just finished
  const tag = thisMonday; // one email per user per Monday

  const { data: sent } = await admin.from("email_log").select("user_id").eq("week_start", tag);
  const done = new Set((sent ?? []).map((r) => r.user_id));
  const { data: users } = await admin.from("profiles").select("*").eq("onboarded", true).eq("weekly_email", true);
  const queue = ((users ?? []) as Profile[]).filter((u) => !done.has(u.id) && u.email && u.plan);

  let processed = 0;
  const errors: string[] = [];
  for (const u of queue) {
    if (Date.now() - t0 > BUDGET_MS) break;
    try {
      const { data: logs } = await admin.from("daily_logs").select("*").eq("user_id", u.id).gte("log_date", start).lte("log_date", addDays(start, 6));
      const s = summarizeWeek((logs ?? []) as DailyLog[], u.plan!.targets, start, u.plan!.training.sessions.length);

      let coach: string | undefined;
      if (u.tier === "elite" && process.env.ANTHROPIC_API_KEY) {
        coach = (await generateFeedback(admin, u, "weekly")).content;
      }

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Fit&Sync <onboarding@resend.dev>",
        to: u.email!,
        subject: coach ? `Your coach review is in · score ${s.score}/100` : `Your week on Fit&Sync · score ${s.score}/100`,
        html: weeklyEmailHtml({ name: u.full_name ?? "", tier: u.tier, s, t: u.plan!.targets, site: siteUrl(), coach }),
      });
      await admin.from("email_log").insert({ user_id: u.id, week_start: tag });
      processed++;
    } catch (e) {
      errors.push(`${u.id}: ${(e as Error).message}`);
      await admin.from("email_log").insert({ user_id: u.id, week_start: tag }); // don't retry-loop a broken user
    }
  }

  const remaining = queue.length - processed - errors.length;
  return NextResponse.json({ done: remaining <= 0, processed, remaining, errors });
}
