import { Markdown } from "@/components/Markdown";
import { Paywall } from "@/components/Paywall";
import { COACH_NAME, MONTHLY_CHECKINS } from "@/lib/coach";
import { requireProfile } from "@/lib/session";
import { hasTier } from "@/lib/tiers";
import { AskCoach } from "./AskCoach";

export default async function CoachPage() {
  const { profile, supabase } = await requireProfile();
  if (!hasTier(profile.tier, "elite"))
    return (
      <div className="space-y-6">
        <h1 className="h-display text-4xl">Coach</h1>
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
