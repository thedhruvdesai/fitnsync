import { userToday } from "@/lib/tz.server";
import Link from "next/link";
import { Bars } from "@/components/Charts";
import { W, WeightChart } from "@/components/Units";
import { Paywall } from "@/components/Paywall";
import { addDays, dayTotals, isoDate } from "@/lib/report";
import { requireProfile } from "@/lib/session";
import { hasTier } from "@/lib/tiers";
import type { DailyLog } from "@/lib/types";

export default async function ProgressPage() {
  const { profile, supabase } = await requireProfile();
  if (!hasTier(profile.tier, "starter"))
    return (
      <div className="space-y-6">
        <h1 className="h-display text-4xl">Progress</h1>
        <Link href="/app/body" className="card flex items-center justify-between !p-4 transition hover:border-white/25"><span><span className="block font-medium">📸 Body check-in</span><span className="block text-xs text-bone-mute">Progress photos, waist, chest, arms and body fat</span></span><span className="text-bone-mute">→</span></Link>
        <Paywall need="starter" title="See your weight trend, streaks and adherence." />
      </div>
    );

  const t = profile.plan!.targets;
  const today = await userToday(profile.timezone);
  const from = addDays(today, -29);
  const { data } = await supabase.from("daily_logs").select("*").gte("log_date", from).lte("log_date", today).order("log_date");
  const logs = (data ?? []) as DailyLog[];
  const map = new Map(logs.map((l) => [l.log_date, l]));
  const days = Array.from({ length: 30 }, (_, i) => addDays(from, i));
  const short = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });

  const weights = days.map((d) => ({ label: short(d), value: map.get(d)?.weight_kg ?? null }));
  const kcal = days.slice(-14).map((d) => ({ label: new Date(d + "T00:00:00").getDate().toString(), value: Math.round(map.has(d) ? dayTotals(map.get(d)!).kcal : 0) }));
  const protein = days.slice(-14).map((d) => ({ label: new Date(d + "T00:00:00").getDate().toString(), value: Math.round(map.has(d) ? dayTotals(map.get(d)!).protein : 0) }));

  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const l = map.get(days[i]);
    if (l && ((l.meals?.length ?? 0) > 0 || (l.workouts?.length ?? 0) > 0)) streak++;
    else if (i !== days.length - 1) break;
  }
  const sessions = logs.filter((l) => (l.workouts?.length ?? 0) > 0).length;
  const ws = weights.filter((w) => w.value != null).map((w) => w.value as number);
  const change = ws.length >= 2 ? Math.round((ws[ws.length - 1] - ws[0]) * 10) / 10 : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Last 30 days</p>
        <h1 className="h-display mt-1 text-4xl md:text-5xl">Progress</h1>
      </div>
      <Link href="/app/body" className="card flex items-center justify-between !p-4 transition hover:border-white/25"><span><span className="block font-medium">📸 Body check-in</span><span className="block text-xs text-bone-mute">Progress photos, waist, chest, arms and body fat</span></span><span className="text-bone-mute">→</span></Link>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([["Streak", `${streak} days`], ["Sessions", `${sessions}`], ["Weight change", change == null ? "—" : <W kg={change} signed />], ["Days logged", `${logs.length}/30`]] as [string, React.ReactNode][]).map(([k, v]) => (
          <div key={k} className="card !p-4">
            <div className="text-xs uppercase tracking-widest text-bone-mute">{k}</div>
            <div className="h-display mt-1 text-2xl">{v}</div>
          </div>
        ))}
      </div>
      <section className="card">
        <h2 className="h-display text-xl">Body weight</h2>
        <div className="mt-3"><WeightChart points={weights} goalKg={profile.goal_weight_kg ?? undefined} /></div>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="h-display text-xl">Calories · 14 days</h2>
          <div className="mt-3"><Bars data={kcal} target={t.kcal} /></div>
        </section>
        <section className="card">
          <h2 className="h-display text-xl">Protein · 14 days</h2>
          <div className="mt-3"><Bars data={protein} target={t.protein_g} unit=" g" /></div>
        </section>
      </div>
    </div>
  );
}
