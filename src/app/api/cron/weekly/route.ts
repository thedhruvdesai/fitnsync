import { NextResponse } from "next/server";
import { Resend } from "resend";
import { generateFeedback } from "@/lib/coach";
import { weeklyEmailHtml } from "@/lib/email";
import { aiConfigured } from "@/lib/llm";
import { addDays, summarizeWeek, weekStart } from "@/lib/report";
import { clockInTz, dateInTz } from "@/lib/tz";
import { siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/server";
import type { DailyLog, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Sends last week's summary to every onboarded user (depth depends on tier) and
 * generates the Elite coach review. Each user gets it on THEIR Monday from 7am local time,
 * so this runs hourly across Sunday–Monday UTC. Safe to call repeatedly: it processes users in
 * small batches within a time budget and skips anyone already emailed for that Monday.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const t0 = Date.now();
  const BUDGET_MS = 20_000;
  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const now = new Date();
  const local = (u: Profile) => {
    const today = dateInTz(u.timezone, now);
    const { hour, weekday } = clockInTz(u.timezone, now);
    return { monday: weekStart(today), due: weekday === 1 && hour >= 7 };
  };

  const { data: users } = await admin.from("profiles").select("*").eq("onboarded", true).eq("weekly_email", true);
  const due = ((users ?? []) as Profile[]).filter((u) => u.email && u.plan && local(u).due);
  const mondays = [...new Set(due.map((u) => local(u).monday))];
  const { data: sent } = mondays.length ? await admin.from("email_log").select("user_id, week_start").in("week_start", mondays) : { data: [] };
  const done = new Set((sent ?? []).map((r) => `${r.user_id}:${r.week_start}`));
  const queue = due.filter((u) => !done.has(`${u.id}:${local(u).monday}`));

  let processed = 0;
  const errors: string[] = [];
  for (const u of queue) {
    if (Date.now() - t0 > BUDGET_MS) break;
    const tag = local(u).monday; // one email per user per local Monday
    const start = addDays(tag, -7); // the week that just finished
    try {
      const { data: logs } = await admin.from("daily_logs").select("*").eq("user_id", u.id).gte("log_date", start).lte("log_date", addDays(start, 6));
      const s = summarizeWeek((logs ?? []) as DailyLog[], u.plan!.targets, start, u.plan!.training.sessions.length);

      let coach: string | undefined;
      if (u.tier === "elite" && aiConfigured()) {
        coach = (await generateFeedback(admin, u, "weekly")).content;
      }

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Liftkai <onboarding@resend.dev>",
        to: u.email!,
        subject: coach ? `Your coach review is in · score ${s.score}/100` : `Your week on Liftkai · score ${s.score}/100`,
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
