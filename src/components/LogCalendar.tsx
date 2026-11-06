"use client";
import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, dayTotals, isoDate } from "@/lib/report";
import type { DailyLog } from "@/lib/types";

type Lite = Pick<DailyLog, "log_date" | "meals" | "workouts" | "water_ml" | "weight_kg">;

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const monthStart = (d: string) => d.slice(0, 8) + "01";
const shiftMonth = (m: string, n: number) => {
  const d = new Date(m + "T00:00:00");
  d.setMonth(d.getMonth() + n, 1);
  return isoDate(d);
};

/** Status of a logged day vs calorie target: on track (±10%), close (±25%), off. */
function status(kcal: number, target: number) {
  if (kcal <= 0) return null;
  const r = kcal / target;
  if (r >= 0.9 && r <= 1.1) return "on";
  if (r >= 0.75 && r <= 1.25) return "close";
  return "off";
}
const DOT = { on: "bg-emerald-400", close: "bg-amber-400", off: "bg-blood" };

export function LogCalendar({
  supabase,
  selected,
  kcalTarget,
  proteinTarget,
  onOpen,
  onClose,
}: {
  supabase: SupabaseClient;
  selected: string;
  kcalTarget: number;
  proteinTarget: number;
  onOpen: (date: string) => void;
  onClose: () => void;
}) {
  const today = isoDate(new Date());
  const [month, setMonth] = useState(monthStart(selected));
  const [pick, setPick] = useState(selected);
  const [logs, setLogs] = useState<Map<string, Lite>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const end = addDays(shiftMonth(month, 1), -1);
    supabase
      .from("daily_logs")
      .select("log_date, meals, workouts, water_ml, weight_kg")
      .gte("log_date", month)
      .lte("log_date", end)
      .then(({ data }) => {
        if (!live) return;
        setLogs(new Map(((data ?? []) as Lite[]).map((l) => [l.log_date, l])));
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [month, supabase]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const cells = useMemo(() => {
    const first = new Date(month + "T00:00:00");
    const lead = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => addDays(month, i))];
  }, [month]);

  const stats = useMemo(() => {
    let food = 0, train = 0, on = 0;
    for (const l of logs.values()) {
      const k = dayTotals(l).kcal;
      if (l.meals?.length) food++;
      if (l.workouts?.length) train++;
      if (status(k, kcalTarget) === "on") on++;
    }
    return { food, train, on };
  }, [logs, kcalTarget]);

  const day = logs.get(pick);
  const dt = day ? dayTotals(day) : null;
  const label = new Date(month + "T00:00:00").toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  const canNext = shiftMonth(month, 1) <= today;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Log calendar">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-in relative max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-ink-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 md:rounded-[28px]">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Your log</span>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-bone-dim" aria-label="Close">✕</button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button className="chip" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">←</button>
          <h2 className="h-display text-2xl">{label}</h2>
          <button className="chip" disabled={!canNext} onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">→</button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white/[0.04] py-2"><div className="h-display text-lg">{stats.food}</div><div className="text-bone-mute">days food logged</div></div>
          <div className="rounded-xl bg-white/[0.04] py-2"><div className="h-display text-lg">{stats.train}</div><div className="text-bone-mute">workouts</div></div>
          <div className="rounded-xl bg-white/[0.04] py-2"><div className="h-display text-lg">{stats.on}</div><div className="text-bone-mute">on-target days</div></div>
        </div>

        <div className={`mt-4 grid grid-cols-7 gap-1 text-center transition-opacity ${loading ? "opacity-40" : ""}`}>
          {WEEK.map((w, i) => <div key={i} className="pb-1 text-[11px] text-bone-mute">{w}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const l = logs.get(d);
            const k = l ? dayTotals(l).kcal : 0;
            const st = status(k, kcalTarget);
            const trained = !!l?.workouts?.length;
            const future = d > today;
            const isPick = d === pick;
            return (
              <button
                key={d}
                disabled={future}
                onClick={() => setPick(d)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ${isPick ? "bg-bone text-ink" : d === today ? "border border-blood/60" : "hover:bg-white/5"} ${future ? "opacity-25" : ""} ${l && !isPick ? "bg-white/[0.04]" : ""}`}
                aria-label={`${d}${l ? ", logged" : ""}`}
              >
                <span className={isPick ? "font-semibold" : ""}>{Number(d.slice(8))}</span>
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {st && <span className={`h-1.5 w-1.5 rounded-full ${DOT[st]}`} />}
                  {trained && <span className={`h-1.5 w-1.5 rounded-sm ${isPick ? "bg-ink" : "bg-bone"}`} />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-bone-mute">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />On target</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />Close</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-blood" />Off target</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-bone" />Workout</span>
        </div>

        {/* selected day */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-ink p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="h-display text-xl">{new Date(pick + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}</h3>
            {pick === today && <span className="text-xs text-blood">Today</span>}
          </div>
          {!day || (!day.meals?.length && !day.workouts?.length && !day.water_ml && day.weight_kg == null) ? (
            <p className="mt-2 text-sm text-bone-mute">Nothing logged on this day.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                <div><div className="font-semibold text-bone">{Math.round(dt!.kcal)}</div><div className="text-bone-mute">/ {kcalTarget} kcal</div></div>
                <div><div className="font-semibold text-bone">{Math.round(dt!.protein)} g</div><div className="text-bone-mute">/ {proteinTarget} g P</div></div>
                <div><div className="font-semibold text-bone">{((day.water_ml ?? 0) / 1000).toFixed(1)} L</div><div className="text-bone-mute">water</div></div>
                <div><div className="font-semibold text-bone">{day.weight_kg ?? "—"}</div><div className="text-bone-mute">kg</div></div>
              </div>
              {!!day.meals?.length && (
                <div className="mt-4">
                  <div className="label">Food · {day.meals.length}</div>
                  <ul className="space-y-1 text-sm">
                    {day.meals.map((m) => (
                      <li key={m.id} className="flex justify-between gap-3">
                        <span className="truncate text-bone-dim">{["breakfast", "lunch", "dinner", "snack"].includes(m.slot) && <span className="capitalize text-bone-mute">{m.slot} · </span>}{m.name}</span>
                        <span className="shrink-0 tabular-nums">{m.kcal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!!day.workouts?.length && (
                <div className="mt-4">
                  <div className="label">Training · {day.workouts.length}</div>
                  <ul className="space-y-1 text-sm">
                    {day.workouts.map((w) => (
                      <li key={w.id} className="flex justify-between gap-3">
                        <span className="truncate text-bone-dim">{w.name}</span>
                        <span className="shrink-0 text-bone-mute">
                          {w.set_list?.length ? w.set_list.map((s) => `${s.w || "BW"}×${s.r}`).join(" · ") : w.sets ? `${w.sets} sets` : w.minutes ? `${w.minutes} min` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <button className="btn-red mt-4 w-full !py-3" onClick={() => onOpen(pick)}>
            {day ? "Open this day" : "Log something for this day"} →
          </button>
        </div>
      </div>
    </div>
  );
}
