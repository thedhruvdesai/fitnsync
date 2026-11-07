import { Markdown } from "@/components/Markdown";
import { Paywall } from "@/components/Paywall";
import { COACH_NAME, MONTHLY_CHECKINS } from "@/lib/coach";
import { requireProfile } from "@/lib/session";
import { hasTier } from "@/lib/tiers";
import { AskCoach } from "./AskCoach";
import { liteFeedback } from "@/lib/coach-lite";
import { addDays, summarizeWeek } from "@/lib/report";
import { userToday } from "@/lib/tz.server";
import type { DailyLog, Profile } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";

/** Coach Lite: instant feedback on the last 7 days, for every plan. */
async function CoachLite({ profile, supabase, elite }: { profile: Profile; supabase: SupabaseClient; elite: boolean }) {
  const plan = profile.plan;
  if (!plan) return null;
  const today = await userToday(profile.timezone);
  const start = addDays(today, -6);
  const { data } = await supabase.from("daily_logs").select("*").gte("log_date", start).lte("log_date", today);
  const s = summarizeWeek((data ?? []) as DailyLog[], plan.targets, start, plan.training.sessions.length);
  const f = liteFeedback(s, plan.targets, profile.full_name ?? "", plan.targets.sleep_h ?? 8);
  return (
    <section className="card relative overflow-hidden">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blood/15 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Coach Lite · last 7 days</p>
          <h2 className="h-display mt-1 text-2xl">{f.headline}</h2>
        </div>
        {s.daysLogged > 0 && (
          <div className="shrink-0 text-right">
            <div className="h-display text-3xl text-blood-400">{f.score}</div>
            <div className="text-[10px] uppercase tracking-widest text-bone-mute">score</div>
          </div>
        )}
      </div>
      {f.working.length > 0 && (
        <div className="relative mt-4">
          <div className="label">What&apos;s working</div>
          <ul className="space-y-1.5 text-sm text-bone-dim">
            {f.working.map((w) => <li key={w} className="flex gap-2"><span className="text-emerald-400">✓</span>{w}</li>)}
          </ul>
        </div>
      )}
      {f.fixes.length > 0 && (
        <div className="relative mt-4">
          <div className="label">Fix this week</div>
          <ol className="space-y-2.5 text-sm">
            {f.fixes.map((x, i) => (
              <li key={x.action} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blood/20 text-xs font-semibold text-blood-400">{i + 1}</span>
                <span><strong className="text-bone">{x.action}.</strong> <span className="text-bone-dim">{x.why}</span></span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {!elite && <p className="relative mt-4 text-xs text-bone-mute">Instant tips from your logs. For a full written review every Monday and answers to your own questions, <Link href="/app/billing?plan=elite" className="text-blood-400 underline underline-offset-4">try Elite</Link>.</p>}
    </section>
  );
}

export default async function CoachPage() {
  const { profile, supabase } = await requireProfile();
  if (!hasTier(profile.tier, "elite"))
    return (
      <div className="space-y-6">
        <h1 className="h-display text-4xl">Coach</h1>
        <CoachLite profile={profile} supabase={supabase} elite={false} />
        <Paywall need="elite" title="A coach that reads every log and tells you exactly what to change.">
          {COACH_NAME} is an AI coach trained to review your food, training, sleep and notes like an experienced pro, every week and whenever you ask.
        </Paywall>
      </div>
    );

  const { data: feedback } = await supabase.from("coach_feedback").select("*").order("created_at", { ascending: false }).limit(20);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const used = (feedback ?? []).filter((f) => f.kind === "on_demand" && new Date(f.created_at) >= monthStart).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">{COACH_NAME} · AI</p>
        <h1 className="h-display mt-1 text-4xl md:text-5xl">Your coach</h1>
        <p className="mt-2 max-w-xl text-sm text-bone-dim">A full review lands every Monday. Ask for a check-in anytime. Your coach reads your logs, notes and targets before replying.</p>
      </div>
      <CoachLite profile={profile} supabase={supabase} elite />
      <AskCoach remaining={Math.max(0, MONTHLY_CHECKINS - used)} />
      {(feedback ?? []).length === 0 && <div className="card text-center text-bone-dim">Your first weekly review arrives next Monday. Log daily and add notes so it&apos;s as specific as possible.</div>}
      {(feedback ?? []).map((f) => (
        <article key={f.id} className="card">
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-bone-mute">
            <span>{f.kind === "weekly" ? "Weekly review" : "Check-in"}</span>
            <span>{new Date(f.created_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
          </div>
          <Markdown text={f.content} />
        </article>
      ))}
      <p className="text-xs text-bone-mute">{COACH_NAME} is an AI. It gives general fitness and nutrition guidance, not medical advice. See a GP or physio for pain, injury or health conditions.</p>
    </div>
  );
}
