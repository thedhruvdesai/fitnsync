"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QUICK_FOODS } from "@/lib/foods";
import { addDays, dayTotals, isoDate } from "@/lib/report";
import { AiFoodLogger } from "@/components/AiFoodLogger";
import { Ring } from "@/components/Ring";
import type { DailyLog, LoggedMeal, LoggedWorkout, Plan } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 10);
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const empty = (d: string): DailyLog => ({ log_date: d, meals: [], workouts: [], water_ml: 0, weight_kg: null, sleep_hours: null, energy: null, notes: null });

export default function TodayView({ plan, name, userId, locked }: { plan: Plan; name: string; userId: string; locked: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [date, setDate] = useState(isoDate(new Date()));
  const [log, setLog] = useState<DailyLog>(empty(date));
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [adding, setAdding] = useState(false);
  const [other, setOther] = useState("");
  const [custom, setCustom] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const t = plan.targets;

  const dow = DOW[new Date(date + "T00:00:00").getDay()];
  const plannedDay = plan.meals.find((d) => d.day === dow);
  const session = plan.training.sessions.find((s) => s.day === dow);

  useEffect(() => {
    let live = true;
    setLoading(true);
    supabase
      .from("daily_logs")
      .select("*")
      .eq("log_date", date)
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return;
        setLog(data ? { ...empty(date), ...data } : empty(date));
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [date, supabase]);

  const persist = useCallback(
    (next: DailyLog) => {
      setLog(next);
      setSaved("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await supabase.from("daily_logs").upsert(
          { user_id: userId, log_date: next.log_date, meals: next.meals, workouts: next.workouts, water_ml: next.water_ml, weight_kg: next.weight_kg, sleep_hours: next.sleep_hours, energy: next.energy, notes: next.notes, updated_at: new Date().toISOString() },
          { onConflict: "user_id,log_date" }
        );
        setSaved("saved");
      }, 500);
    },
    [supabase, userId]
  );

  const totals = dayTotals(log);
  const addMeal = (m: Omit<LoggedMeal, "id">) => persist({ ...log, meals: [...log.meals, { ...m, id: uid() }] });
  const removeMeal = (id: string) => persist({ ...log, meals: log.meals.filter((m) => m.id !== id) });
  const toggleExercise = (name: string, sets: number) => {
    const has = log.workouts.find((w) => w.name === name);
    const workouts: LoggedWorkout[] = has ? log.workouts.filter((w) => w.name !== name) : [...log.workouts, { id: uid(), name, sets }];
    persist({ ...log, workouts });
  };

  const isToday = date === isoDate(new Date());
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{isToday ? `${greet}, ${name || "there"}` : "Logging a past day"}</p>
          <h1 className="h-display mt-1 text-4xl md:text-5xl">
            {new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="chip" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">←</button>
          <button className="chip" disabled={isToday} onClick={() => setDate(addDays(date, 1))} aria-label="Next day">→</button>
        </div>
      </div>
      <p className="-mt-3 h-4 text-xs text-bone-mute">{loading ? "Loading…" : saved === "saving" ? "Saving…" : saved === "saved" ? "All changes saved" : ""}</p>

      {/* rings */}
      <div className="card grid grid-cols-3 gap-2 !py-6">
        <Ring value={totals.kcal} max={t.kcal} label="Calories" unit="kcal" />
        <Ring value={totals.protein} max={t.protein_g} label="Protein" unit="g" />
        <Ring value={log.water_ml / 1000} max={t.water_ml / 1000} label="Water" unit="L" />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="card !p-4">
          <div className="text-bone-mute">Carbs</div>
          <div className="mt-1 font-semibold">{Math.round(totals.carbs)} / {t.carbs_g} g</div>
        </div>
        <div className="card !p-4">
          <div className="text-bone-mute">Fat</div>
          <div className="mt-1 font-semibold">{Math.round(totals.fat)} / {t.fat_g} g</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* meals */}
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="h-display text-2xl">Food</h2>
            <button className="btn-red !px-4 !py-2" onClick={() => setAdding(!adding)}>{adding ? "Close" : "📷 + Add food"}</button>
          </div>

          {adding && (
            <div className="mt-4 space-y-4 rounded-xl bg-ink-3 p-4">
              <AiFoodLogger
                onAdd={(items) =>
                  persist({
                    ...log,
                    meals: [
                      ...log.meals,
                      ...items.map((it) => ({ id: uid(), name: it.portion ? `${it.name} (${it.portion})` : it.name, slot: "ai", kcal: it.kcal, protein: it.protein, carbs: it.carbs, fat: it.fat })),
                    ],
                  })
                }
              />
              {plannedDay && !locked && (
                <div>
                  <div className="label">From today&apos;s plan</div>
                  <div className="flex flex-wrap gap-2">
                    {plannedDay.meals.map((m, k) => (
                      <button key={k} className="chip" onClick={() => addMeal({ name: m.name, slot: m.slot, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat })}>
                        {m.name} · {m.kcal}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="label">Quick add</div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_FOODS.map((q) => (
                    <button key={q.name} className="chip !px-3 !py-1.5 text-xs" onClick={() => addMeal({ ...q, slot: "snack" })}>{q.name}</button>
                  ))}
                </div>
              </div>
              <form
                className="grid grid-cols-5 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!custom.name) return;
                  addMeal({ name: custom.name, slot: "custom", kcal: +custom.kcal || 0, protein: +custom.protein || 0, carbs: +custom.carbs || 0, fat: +custom.fat || 0 });
                  setCustom({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
                }}
              >
                <input className="input col-span-5 !py-2" placeholder="Custom food" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
                {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
                  <input key={k} className="input !px-2 !py-2 text-sm" inputMode="decimal" placeholder={k === "kcal" ? "kcal" : `${k[0].toUpperCase()} g`} value={custom[k]} onChange={(e) => setCustom({ ...custom, [k]: e.target.value })} />
                ))}
                <button className="btn-ghost !px-2 !py-2">Add</button>
              </form>
            </div>
          )}

          <ul className="mt-4 divide-y divide-white/5">
            {log.meals.length === 0 && <li className="py-6 text-center text-sm text-bone-mute">Nothing logged yet.</li>}
            {log.meals.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-bone-mute">{m.kcal} kcal · {m.protein} g P · {m.carbs} g C · {m.fat} g F</div>
                </div>
                <button className="text-bone-mute hover:text-blood" onClick={() => removeMeal(m.id)} aria-label="Remove">✕</button>
              </li>
            ))}
          </ul>
        </section>

        {/* training */}
        <section className="card">
          <h2 className="h-display text-2xl">Training</h2>
          {locked ? (
            <p className="mt-3 text-sm text-bone-dim">Your personalised program unlocks with Starter. You can still log a session below.</p>
          ) : session ? (
            <>
              <p className="mt-1 text-sm text-bone-dim">{session.title} · {session.focus} · ~{session.minutes} min</p>
              <ul className="mt-4 space-y-2">
                {session.exercises.map((e) => {
                  const done = !!log.workouts.find((w) => w.name === e.name);
                  return (
                    <li key={e.name}>
                      <button onClick={() => toggleExercise(e.name, e.sets)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${done ? "border-blood/60 bg-blood/10" : "border-white/10 hover:border-white/25"}`}>
                        <span>
                          <span className="font-medium">{e.name}</span>
                          <span className="block text-xs text-bone-mute">{e.sets} × {e.reps} · rest {e.rest}</span>
                        </span>
                        <span className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${done ? "border-blood bg-blood text-white" : "border-white/20"}`}>{done ? "✓" : ""}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-sm text-bone-dim">Rest day. Aim for {t.steps.toLocaleString()} steps and some mobility work.</p>
          )}
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!other.trim()) return;
              persist({ ...log, workouts: [...log.workouts, { id: uid(), name: other.trim() }] });
              setOther("");
            }}
          >
            <input className="input !py-2" placeholder="Other activity, e.g. 30 min run" value={other} onChange={(e) => setOther(e.target.value)} />
            <button className="btn-ghost !py-2">Log</button>
          </form>
          {log.workouts.filter((w) => !session?.exercises.some((e) => e.name === w.name)).map((w) => (
            <div key={w.id} className="mt-2 flex justify-between text-sm text-bone-dim">
              <span>{w.name}</span>
              <button onClick={() => persist({ ...log, workouts: log.workouts.filter((x) => x.id !== w.id) })}>✕</button>
            </div>
          ))}
        </section>
      </div>

      {/* habits */}
      <section className="card">
        <h2 className="h-display text-2xl">Check-in</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-4">
          <div>
            <div className="label">Water</div>
            <div className="flex items-center gap-2">
              <button className="chip" onClick={() => persist({ ...log, water_ml: Math.max(0, log.water_ml - 250) })}>−</button>
              <div className="flex-1 text-center font-semibold">{(log.water_ml / 1000).toFixed(2)} L</div>
              <button className="chip chip-on" onClick={() => persist({ ...log, water_ml: log.water_ml + 250 })}>+250</button>
            </div>
          </div>
          <div>
            <div className="label">Morning weight kg</div>
            <input className="input !py-2" inputMode="decimal" value={log.weight_kg ?? ""} onChange={(e) => persist({ ...log, weight_kg: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <div className="label">Sleep hours</div>
            <input className="input !py-2" inputMode="decimal" value={log.sleep_hours ?? ""} onChange={(e) => persist({ ...log, sleep_hours: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <div className="label">Energy</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={`chip flex-1 !px-0 !py-2 ${log.energy === n ? "chip-on" : ""}`} onClick={() => persist({ ...log, energy: n })}>{n}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className="label">Notes for your coach</div>
          <textarea className="input min-h-[80px]" placeholder="How did today feel? Cravings, soreness, stress…" value={log.notes ?? ""} onChange={(e) => persist({ ...log, notes: e.target.value })} />
        </div>
      </section>
    </div>
  );
}
