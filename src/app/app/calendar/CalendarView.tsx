"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { addDays, dayTotals, isoDate } from "@/lib/report";
import type { DailyLog } from "@/lib/types";
import { kgTo, useUnits } from "@/lib/units";

type Lite = Pick<DailyLog, "log_date" | "meals" | "workouts" | "water_ml" | "weight_kg">;
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function status(kcal: number, target: number) {
  if (kcal <= 0) return null;
  const r = kcal / target;
  if (r >= 0.9 && r <= 1.1) return "on";
  if (r >= 0.75 && r <= 1.25) return "close";
  return "off";
}
const CELL = {
  on: "border-emerald-400/40 bg-emerald-400/10",
  close: "border-amber-400/40 bg-amber-400/10",
  off: "border-blood/50 bg-blood/10",
};
const TXT = { on: "text-emerald-300", close: "text-amber-300", off: "text-blood-400" };

const ym = (d: string) => d.slice(0, 7);
const shift = (m: string, n: number) => {
  const d = new Date(m + "T00:00:00");
  d.setMonth(d.getMonth() + n, 1);
  return isoDate(d);
};

export function CalendarView({ month, today, initial, logs, kcalTarget, proteinTarget }: { month: string; today: string; initial?: string; logs: Lite[]; kcalTarget: number; proteinTarget: number }) {
  const router = useRouter();
  const [u] = useUnits();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back();
    else router.push("/app");
  };
  const map = useMemo(() => new Map(logs.map((l) => [l.log_date, l])), [logs]);
  const inMonth = (d?: string) => !!d && ym(d) === ym(month);
  const [pick, setPick] = useState(inMonth(initial) ? initial! : inMonth(today) ? today : month);

  const cells = useMemo(() => {
    const first = new Date(month + "T00:00:00");
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const list: (string | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => addDays(month, i))];
    while (list.length % 7) list.push(null);
    return list;
  }, [month]);

  const logged = (l?: Lite) => !!l && ((l.meals?.length ?? 0) > 0 || (l.workouts?.length ?? 0) > 0);
  const past = cells.filter((d): d is string => !!d && d <= today);
  const stats = {
    logged: past.filter((d) => logged(map.get(d))).length,
    missed: past.filter((d) => !logged(map.get(d))).length,
    train: past.filter((d) => (map.get(d)?.workouts?.length ?? 0) > 0).length,
    on: past.filter((d) => status(dayTotals(map.get(d) ?? { meals: [] }).kcal, kcalTarget) === "on").length,
  };

  const label = new Date(month + "T00:00:00").toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  const canNext = shift(month, 1) <= today;
  const day = map.get(pick);
  const dt = day ? dayTotals(day) : null;

  return (
    <div className="space-y-5">
      <button onClick={goBack} className="-mb-2 flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-bone-dim transition hover:border-white/30 hover:text-bone">
        ← Back
      </button>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1 className="h-display mt-1 text-3xl sm:text-4xl md:text-5xl">{label}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/app/calendar?m=${ym(shift(month, -1))}`} className="chip" aria-label="Previous month">←</Link>
          {canNext ? <Link href={`/app/calendar?m=${ym(shift(month, 1))}`} className="chip" aria-label="Next month">→</Link> : <span className="chip opacity-30">→</span>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          [stats.logged, "logged", "text-bone"],
          [stats.missed, "missed", "text-bone-mute"],
          [stats.train, "workouts", "text-bone"],
          [stats.on, "on target", "text-emerald-300"],
        ].map(([v, k, c]) => (
          <div key={k as string} className="card !p-3">
            <div className={`h-display text-2xl ${c}`}>{v}</div>
            <div className="text-[11px] text-bone-mute">{k}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="card !p-2 sm:!p-4">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {WEEK.map((w) => <div key={w} className="pb-1 text-center text-[10px] uppercase tracking-wider text-bone-mute sm:text-xs">{w}</div>)}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const l = map.get(d);
              const k = Math.round(l ? dayTotals(l).kcal : 0);
              const st = status(k, kcalTarget);
              const trained = (l?.workouts?.length ?? 0) > 0;
              const future = d > today;
              const missed = !future && !logged(l);
              const sel = d === pick;
              return (
                <button
                  key={d}
                  disabled={future}
                  onClick={() => setPick(d)}
                  className={`relative flex min-h-[64px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[92px] sm:p-2
                    ${st ? CELL[st] : missed ? "border-dashed border-white/10" : "border-white/5"}
                    ${sel ? "!border-bone ring-2 ring-bone/70" : ""}
                    ${future ? "opacity-30" : "hover:border-white/30"}`}
                >
                  <span className={`text-xs font-semibold sm:text-sm ${d === today ? "grid h-5 w-5 place-items-center rounded-full bg-blood text-white sm:h-6 sm:w-6" : ""}`}>{Number(d.slice(8))}</span>
                  {k > 0 && <span className={`mt-auto text-[10px] font-semibold tabular-nums sm:text-sm ${st ? TXT[st] : ""}`}>{k}<span className="hidden font-normal text-bone-mute sm:inline"> kcal</span></span>}
                  {missed && <span className="mt-auto text-[9px] text-bone-mute sm:text-xs">—</span>}
                  {trained && <span className="absolute right-1 top-1 text-[10px] sm:right-2 sm:top-2 sm:text-sm" aria-label="workout">🏋️</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-bone-mute">
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-emerald-400/60" />On target (±10%)</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-amber-400/60" />Close</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-blood/70" />Off target</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded border border-dashed border-white/40" />Not logged</span>
            <span>🏋️ Trained</span>
          </div>
        </section>

        <section className="card h-fit lg:sticky lg:top-6">
          <div className="flex items-baseline justify-between">
            <h2 className="h-display text-2xl">{new Date(pick + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}</h2>
            {pick === today && <span className="text-xs text-blood-400">Today</span>}
          </div>
          {!logged(day) && !day?.water_ml && day?.weight_kg == null ? (
            <p className="mt-3 text-sm text-bone-mute">{pick > today ? "This day hasn't happened yet." : "Nothing logged on this day."}</p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-white/[0.04] p-3"><div className="text-xs text-bone-mute">Calories</div><div className="font-semibold">{Math.round(dt!.kcal)} <span className="font-normal text-bone-mute">/ {kcalTarget}</span></div></div>
                <div className="rounded-xl bg-white/[0.04] p-3"><div className="text-xs text-bone-mute">Protein</div><div className="font-semibold">{Math.round(dt!.protein)} g <span className="font-normal text-bone-mute">/ {proteinTarget}</span></div></div>
                <div className="rounded-xl bg-white/[0.04] p-3"><div className="text-xs text-bone-mute">Water</div><div className="font-semibold">{((day?.water_ml ?? 0) / 1000).toFixed(1)} L</div></div>
                <div className="rounded-xl bg-white/[0.04] p-3"><div className="text-xs text-bone-mute">Weight</div><div className="font-semibold">{day?.weight_kg != null ? `${kgTo(day.weight_kg, u.w)} ${u.w}` : "—"}</div></div>
              </div>
              {!!day?.meals?.length && (
                <div className="mt-5">
                  <div className="label">Food · {day.meals.length}</div>
                  <ul className="divide-y divide-white/5 text-sm">
                    {day.meals.map((m) => (
                      <li key={m.id} className="flex justify-between gap-3 py-2">
                        <span className="min-w-0">
                          <span className="block truncate">{m.name}</span>
                          <span className="block text-xs capitalize text-bone-mute">{["breakfast", "lunch", "dinner", "snack"].includes(m.slot) ? `${m.slot} · ` : ""}{m.protein} g P · {m.carbs} g C · {m.fat} g F</span>
                        </span>
                        <span className="shrink-0 tabular-nums">{m.kcal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!!day?.workouts?.length && (
                <div className="mt-5">
                  <div className="label">Training · {day.workouts.length}</div>
                  <ul className="divide-y divide-white/5 text-sm">
                    {day.workouts.map((w) => (
                      <li key={w.id} className="flex justify-between gap-3 py-2">
                        <span className="truncate">{w.name}</span>
                        <span className="shrink-0 text-xs text-bone-mute">{w.set_list?.length ? w.set_list.map((s) => `${s.w ? kgTo(s.w, u.w) : "BW"}×${s.r}`).join(" · ") : w.sets ? `${w.sets} sets` : w.minutes ? `${w.minutes} min` : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {pick <= today && (
            <Link href={`/app?date=${pick}`} className="btn-red mt-5 w-full !py-3">
              {logged(day) ? "Open & edit this day" : "Log food or training for this day"} →
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
