"use client";
import { findExercise } from "@/lib/library";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QUICK_FOODS } from "@/lib/foods";
import { addDays, dayTotals, isoDate } from "@/lib/report";
import { AiFoodLogger, type AiItem, type Slot, type StartMode } from "@/components/AiFoodLogger";
import { ExerciseSheet, ExerciseThumb, type SetRow } from "@/components/ExerciseSheet";
import { Ring } from "@/components/Ring";
import { LogCalendar } from "@/components/LogCalendar";
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
  const [sheet, setSheet] = useState<number | null>(null);
  const [scan, setScan] = useState<StartMode | null>(null);
  const [cal, setCal] = useState(false);
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
  const extra = log.meals.reduce((a, m) => ({ fibre: a.fibre + (m.fibre ?? 0), sugar: a.sugar + (m.sugar ?? 0), sodium: a.sodium + (m.sodium ?? 0) }), { fibre: 0, sugar: 0, sodium: 0 });
  const hasExtra = log.meals.some((m) => m.sodium != null || m.fibre != null);
  const logScanned = (items: AiItem[], slot: Slot, source: "ai" | "manual") =>
    persist({
      ...log,
      meals: [
        ...log.meals,
        ...items.map((it) => ({
          id: uid(),
          name: it.portion ? `${it.name} (${it.portion})` : it.name,
          slot,
          source,
          kcal: it.kcal,
          protein: it.protein,
          carbs: it.carbs,
          fat: it.fat,
          fibre: it.fibre,
          sugar: it.sugar,
          sat_fat: it.sat_fat,
          sodium: it.sodium,
        })),
      ],
    });
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
          <button onClick={() => setCal(true)} className="group text-left" aria-label="Open calendar">
            <h1 className="h-display mt-1 text-3xl sm:text-4xl md:text-5xl">
              {new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}
              <span className="ml-2 align-middle text-base text-bone-mute transition group-hover:text-blood">▾</span>
            </h1>
          </button>
          {!isToday && <button className="mt-1 text-xs text-blood underline underline-offset-4" onClick={() => setDate(isoDate(new Date()))}>Back to today</button>}
        </div>
        <div className="flex items-center gap-2">
          <button className="chip" onClick={() => setCal(true)} aria-label="Calendar">📅</button>
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

      {hasExtra && (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="card !p-3"><div className="text-xs text-bone-mute">Fibre</div><div className="mt-0.5 font-semibold">{Math.round(extra.fibre)} / {t.fibre_g} g</div></div>
          <div className="card !p-3"><div className="text-xs text-bone-mute">Sugars</div><div className="mt-0.5 font-semibold">{Math.round(extra.sugar)} g</div></div>
          <div className="card !p-3"><div className="text-xs text-bone-mute">Sodium</div><div className={`mt-0.5 font-semibold ${extra.sodium > 2000 ? "text-amber-300" : ""}`}>{Math.round(extra.sodium)} / 2000 mg</div></div>
        </div>
      )}

      {cal && (
        <LogCalendar
          supabase={supabase}
          selected={date}
          kcalTarget={t.kcal}
          proteinTarget={t.protein_g}
          onClose={() => setCal(false)}
          onOpen={(d) => {
            setDate(d);
            setCal(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* scan CTA */}
      <section className="glow-border relative overflow-hidden rounded-3xl bg-gradient-to-br from-blood/25 via-ink-2 to-ink-2 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blood">✨ AI food scan</div>
        <h2 className="h-display mt-1 text-2xl">What did you eat?</h2>
        <p className="mt-1 text-sm text-bone-dim">Snap your plate. Get calories, protein, carbs, fat, fibre, sugar and sodium in seconds.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="btn-red col-span-3 !py-3.5 text-base" onClick={() => setScan("camera")}>📷 Scan food</button>
          <button className="chip !py-2.5 text-xs" onClick={() => setScan("gallery")}>🖼️ Upload</button>
          <button className="chip !py-2.5 text-xs" onClick={() => setScan("text")}>⌨️ Type it</button>
          <button className="chip !py-2.5 text-xs" onClick={() => setScan("manual")}>✍️ Manual</button>
        </div>
      </section>

      {scan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Log food">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setScan(null)} />
          <div className="sheet-in relative max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-ink-2 pb-[env(safe-area-inset-bottom)] md:rounded-[28px]">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-ink-2/95 px-5 pb-2 pt-4 backdrop-blur">
              <span className="text-sm text-bone-dim">Logging to {isToday ? "today" : new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
              <button onClick={() => setScan(null)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-bone-dim" aria-label="Close">✕</button>
            </div>
            <div className="px-1 pb-4">
              <AiFoodLogger
                start={scan}
                dayLabel={isToday ? "today" : "this day"}
                guide={{ kcal: t.kcal, protein: t.protein_g, carbs: t.carbs_g, fat: t.fat_g, fibre: t.fibre_g }}
                onAdd={logScanned}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* meals */}
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="h-display text-2xl">Food</h2>
            <button className="btn-red !px-4 !py-2" onClick={() => setAdding(!adding)}>{adding ? "Close" : "+ Add food"}</button>
          </div>

          {adding && (
            <div className="mt-4 space-y-4 rounded-xl bg-ink-3 p-4">
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-red !py-2.5 text-sm" onClick={() => setScan("camera")}>📷 Scan food</button>
                <button className="btn-ghost !py-2.5 text-sm" onClick={() => setScan("manual")}>✍️ Enter manually</button>
              </div>
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
            {log.meals.length === 0 && <li className="py-6 text-center text-sm text-bone-mute">Nothing logged yet. Tap 📷 Scan food above.</li>}
            {log.meals.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-bone-mute">
                    {["breakfast", "lunch", "dinner", "snack"].includes(m.slot) && <span className="capitalize text-bone-dim">{m.slot} · </span>}
                    {m.kcal} kcal · {m.protein} g P · {m.carbs} g C · {m.fat} g F{m.sodium != null ? ` · ${m.sodium} mg Na` : ""}
                  </div>
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
              <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-bone-dim">{session.title} · {session.focus} · ~{session.minutes} min</p>
                <button className="btn-red !px-4 !py-2" onClick={() => setSheet(Math.max(0, session.exercises.findIndex((e) => !log.workouts.some((w) => w.name === e.name))))}>
                  ▶ {log.workouts.some((w) => session.exercises.some((e) => e.name === w.name)) ? "Continue" : "Start"} workout
                </button>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-blood to-blood-400 transition-all duration-700" style={{ width: `${(session.exercises.filter((e) => log.workouts.some((w) => w.name === e.name)).length / session.exercises.length) * 100}%` }} />
              </div>
              <ul className="mt-4 space-y-2">
                {session.exercises.map((e, i) => {
                  const done = !!log.workouts.find((w) => w.name === e.name);
                  const logged = log.workouts.find((w) => w.name === e.name);
                  return (
                    <li key={e.name} className={`flex items-center gap-3 rounded-2xl border p-2 pr-3 transition ${done ? "border-blood/60 bg-blood/10" : "border-white/10 hover:border-white/25"}`}>
                      <button onClick={() => setSheet(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Open ${e.name}`}>
                        <ExerciseThumb name={e.name} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{e.name}</span>
                          <span className="block text-xs text-bone-mute">
                            {e.sets} × {e.reps} · rest {e.rest}
                            {logged?.weight ? ` · ${logged.weight} kg` : ""}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-blood-400">Tap for demo & tracker →</span>
                        </span>
                      </button>
                      <button onClick={() => toggleExercise(e.name, e.sets)} aria-label={done ? `Undo ${e.name}` : `Mark ${e.name} done`} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs transition active:scale-90 ${done ? "border-blood bg-blood text-white" : "border-white/20"}`}>{done ? "✓" : ""}</button>
                    </li>
                  );
                })}
              </ul>
              {sheet != null && (
                <ExerciseSheet
                  exercises={session.exercises}
                  index={sheet}
                  onIndex={setSheet}
                  onClose={() => setSheet(null)}
                  mode="log"
                  done={new Set(log.workouts.map((w) => w.name))}
                  onComplete={(ex, sets: SetRow[]) => {
                    const weights = sets.map((r) => Number(r.weight)).filter((n) => n > 0);
                    const reps = sets.map((r) => Number(r.reps)).filter((n) => n > 0);
                    const set_list = sets.filter((r) => r.done && Number(r.reps) > 0).map((r) => ({ w: Number(r.weight) || 0, r: Number(r.reps) }));
                    const entry = { id: uid(), name: ex.name, ex: findExercise(ex.name)?.id, set_list, sets: sets.filter((r) => r.done).length, reps: reps.length ? Math.max(...reps) : undefined, weight: weights.length ? Math.max(...weights) : undefined };
                    persist({ ...log, workouts: [...log.workouts.filter((w) => w.name !== ex.name), entry] });
                  }}
                  onUndo={(ex) => persist({ ...log, workouts: log.workouts.filter((w) => w.name !== ex.name) })}
                />
              )}
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
