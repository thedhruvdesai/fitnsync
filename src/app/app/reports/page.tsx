import Link from "next/link";
import { Paywall } from "@/components/Paywall";
import { addDays, isoDate, summarizeWeek, weekStart } from "@/lib/report";
import { requireProfile } from "@/lib/session";
import { hasTier } from "@/lib/tiers";
import type { DailyLog } from "@/lib/types";
import { PrintButton } from "./PrintButton";

const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });

export default async function ReportsPage(props: { searchParams: Promise<{ w?: string }> }) {
  const searchParams = await props.searchParams;
  const { profile, supabase } = await requireProfile();
  if (!hasTier(profile.tier, "pro"))
    return (
      <div className="space-y-6">
        <h1 className="h-display text-4xl">Reports</h1>
        <Paywall need="pro" title="Weekly reports that show exactly what's working.">
          Adherence scores, trends and a PDF you can keep, plus a report in your inbox every Monday.
        </Paywall>
      </div>
    );

  const thisWeek = weekStart(isoDate(new Date()));
  const start = searchParams.w && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.w) ? weekStart(searchParams.w) : thisWeek;
  const { data } = await supabase.from("daily_logs").select("*").gte("log_date", start).lte("log_date", addDays(start, 6));
  const plan = profile.plan!;
  const s = summarizeWeek((data ?? []) as DailyLog[], plan.targets, start, plan.training.sessions.length);
  const t = plan.targets;

  const verdict = s.score >= 80 ? "Excellent week. Keep this rhythm." : s.score >= 60 ? "Solid week. A couple of small fixes will speed results." : s.score >= 35 ? "Mixed week. Focus on the basics: protein and showing up." : "Light week of data. Log daily so your report can help.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Weekly report</p>
          <h1 className="h-display mt-1 text-4xl md:text-5xl print-dark">{fmt(s.start)} – {fmt(s.end)}</h1>
        </div>
        <div className="no-print flex gap-2">
          <Link className="chip" href={`/app/reports?w=${addDays(start, -7)}`}>← Prev</Link>
          {start < thisWeek && <Link className="chip" href={`/app/reports?w=${addDays(start, 7)}`}>Next →</Link>}
          <PrintButton />
        </div>
      </div>

      <section className="card flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div className="h-display text-7xl text-blood">{s.score}</div>
        <div>
          <div className="text-xs uppercase tracking-widest text-bone-mute">Consistency score</div>
          <p className="mt-1 text-lg">{verdict}</p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Avg calories", `${s.avgKcal.toLocaleString()}`, `target ${t.kcal.toLocaleString()}`],
          ["Avg protein", `${s.avgProtein} g`, `target ${t.protein_g} g`],
          ["Workouts", `${s.workouts}/${s.plannedWorkouts}`, "sessions done"],
          ["Weight", s.weightChange == null ? "—" : `${s.weightChange > 0 ? "+" : ""}${s.weightChange} kg`, s.endWeight ? `now ${s.endWeight} kg` : "log weekly"],
          ["Calorie adherence", `${s.kcalAdherence}%`, "days within ±10%"],
          ["Protein adherence", `${s.proteinAdherence}%`, "days ≥ 90%"],
          ["Avg water", `${(s.avgWater / 1000).toFixed(1)} L`, `target ${(t.water_ml / 1000).toFixed(1)} L`],
          ["Avg sleep", s.avgSleep ? `${s.avgSleep} h` : "—", "target 8 h"],
        ].map(([k, v, sub]) => (
          <div key={k} className="card !p-4">
            <div className="text-xs uppercase tracking-widest text-bone-mute">{k}</div>
            <div className="h-display mt-1 text-2xl">{v}</div>
            <div className="text-xs text-bone-mute">{sub}</div>
          </div>
        ))}
      </div>

      <section className="card overflow-x-auto">
        <h2 className="h-display text-xl">Day by day</h2>
        <table className="mt-3 w-full min-w-[480px] text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-bone-mute">
            <tr><th className="py-2">Day</th><th>Calories</th><th>Protein</th><th>Water</th><th>Trained</th><th>Weight</th></tr>
          </thead>
          <tbody>
            {s.days.map((d) => (
              <tr key={d.date} className="border-t border-white/5">
                <td className="py-2.5">{new Date(d.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric" })}</td>
                <td className={d.kcal && Math.abs(d.kcal - t.kcal) <= t.kcal * 0.1 ? "text-bone" : "text-bone-dim"}>{d.kcal || "—"}</td>
                <td className={d.protein >= t.protein_g * 0.9 ? "text-bone" : "text-bone-dim"}>{d.protein ? `${d.protein} g` : "—"}</td>
                <td className="text-bone-dim">{d.water ? `${(d.water / 1000).toFixed(1)} L` : "—"}</td>
                <td>{d.workouts ? <span className="text-blood">●</span> : <span className="text-bone-mute">·</span>}</td>
                <td className="text-bone-dim">{d.weight ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-bone-mute">General fitness guidance only, not medical advice.</p>
    </div>
  );
}
