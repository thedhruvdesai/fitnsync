"use client";
import { findExercise } from "@/lib/library";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QUICK_FOODS } from "@/lib/foods";
import { addDays, dayTotals, isoDate } from "@/lib/report";
import dynamic from "next/dynamic";
import type { AiItem, Slot, StartMode } from "@/components/AiFoodLogger";
import { QuickFoods, Star, useFavorites, type FoodItem, type MyMeal } from "@/components/QuickFoods";
import { GettingStarted } from "@/components/GettingStarted";
import { ExerciseThumb } from "@/components/ExerciseDemo";
import type { LastSession, SetRow } from "@/components/ExerciseSheet";
import { ExercisePicker } from "@/components/ExercisePicker";
import { AdaptiveCard } from "@/components/AdaptiveCard";
import { ConvertedInput, kgTo, toKg, useUnits } from "@/lib/units";
import { Ring } from "@/components/Ring";
import Link from "next/link";
import type { DailyLog, LoggedMeal, LoggedWorkout, Plan } from "@/lib/types";

// Heavy pop-ups load on first open, keeping the Today screen light.
const SheetLoading = () => <div className="grid h-60 place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-blood" /></div>;
const AiFoodLogger = dynamic(() => import("@/components/AiFoodLogger").then((m) => m.AiFoodLogger), { ssr: false, loading: SheetLoading });
const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner").then((m) => m.BarcodeScanner), { ssr: false, loading: SheetLoading });
const MealBuilder = dynamic(() => import("@/components/MealBuilder").then((m) => m.MealBuilder), { ssr: false });
const ExerciseSheet = dynamic(() => import("@/components/ExerciseSheet").then((m) => m.ExerciseSheet), { ssr: false });

const backupKey = (user: string, d: string) => `fs_log_${user}_${d}`;
function writeBackup(user: string, l: DailyLog) {
  try {
    localStorage.setItem(backupKey(user, l.log_date), JSON.stringify({ at: Date.now(), log: l }));
  } catch {
    /* storage full or private mode */
  }
}
function readBackup(user: string, d: string): { at: number; log: DailyLog } | null {
  try {
    const v = JSON.parse(localStorage.getItem(backupKey(user, d)) ?? "null");
    return v?.log ? v : null;
  } catch {
    return null;
  }
}
function clearBackup(user: string, d: string) {
  try {
    localStorage.removeItem(backupKey(user, d));
  } catch {
    /* ignore */
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const empty = (d: string): DailyLog => ({ log_date: d, meals: [], workouts: [], water_ml: 0, weight_kg: null, sleep_hours: null, energy: null, notes: null });

export default function TodayView({ plan: initialPlan, name, userId, locked, initialDate, today: serverToday }: { plan: Plan; name: string; userId: string; locked: boolean; initialDate?: string; today: string }) {
  const [plan, setPlan] = useState(initialPlan);
  const [units] = useUnits();
  const [swapAt, setSwapAt] = useState<number | null>(null);
  const [history, setHistory] = useState<Map<string, LastSession>>(new Map());
  const supabase = useMemo(() => createClient(), []);
  // "today" comes from the server in the user's time zone, then follows this device's clock (e.g. past midnight)
  const [today, setToday] = useState(serverToday);
  const [date, setDate] = useState(initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) && initialDate <= serverToday ? initialDate : serverToday);
  useEffect(() => {
    const sync = () => {
      const local = isoDate(new Date());
      setToday((prev) => {
        if (prev !== local) setDate((d) => (d === prev ? local : d));
        return local;
      });
    };
    sync();
    const id = setInterval(sync, 60_000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  const [log, setLog] = useState<DailyLog>(empty(date));
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [adding, setAdding] = useState(false);
  const [other, setOther] = useState("");
  const [sheet, setSheet] = useState<number | null>(null);
  const [scan, setScan] = useState<StartMode | "barcode" | null>(null);
  const [custom, setCustom] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const t = plan.targets;

  // previous sessions per exercise, for "last time" in the workout sheet
  useEffect(() => {
    let live = true;
    supabase
      .from("daily_logs")
      .select("log_date, workouts")
      .lt("log_date", date)
      .gte("log_date", addDays(date, -120))
      .order("log_date", { ascending: false })
      .then(({ data }) => {
        if (!live) return;
        const m = new Map<string, LastSession>();
        for (const r of (data ?? []) as { log_date: string; workouts: LoggedWorkout[] }[])
          for (const w of r.workouts ?? []) {
            const sets = w.set_list?.length ? w.set_list : w.reps ? Array.from({ length: w.sets ?? 1 }, () => ({ w: w.weight ?? 0, r: w.reps! })) : [];
            if (!sets.length) continue;
            for (const k of [w.ex, w.name.toLowerCase()]) if (k && !m.has(k)) m.set(k, { date: r.log_date, sets });
          }
        setHistory(m);
      });
    return () => {
      live = false;
    };
  }, [supabase, date]);
  const lastFor = (n: string) => history.get(findExercise(n)?.id ?? "") ?? history.get(n.toLowerCase());

  async function swapExercise(i: number, newName: string) {
    if (!session) return;
    const sIdx = plan.training.sessions.indexOf(session);
    const sessions = plan.training.sessions.map((s, k) => (k === sIdx ? { ...s, exercises: s.exercises.map((e, j) => (j === i ? { ...e, name: newName } : e)) } : s));
    const next = { ...plan, training: { ...plan.training, sessions } };
    setPlan(next);
    await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "training", sessions }) });
  }

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
        const server: DailyLog = data ? { ...empty(date), ...data } : empty(date);
        // an unsaved change from last time (app closed offline / mid-save) wins if it's newer
        const backup = readBackup(userId, date);
        const serverAt = data?.updated_at ? Date.parse(data.updated_at) : 0;
        if (backup && backup.at > serverAt) {
          setLog(backup.log);
          pending.current = backup.log;
          save();
        } else {
          if (backup) clearBackup(userId, date);
          setLog(server);
        }
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [date, supabase]);

  // ---- saving: quick debounce, local backup until confirmed, retry on failure, flush when leaving ----
  const pending = useRef<DailyLog | null>(null);
  const token = useRef<string | null>(null);
  const retry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => (token.current = data.session?.access_token ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => (token.current = sess?.access_token ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const rowOf = useCallback(
    (l: DailyLog) => ({ user_id: userId, log_date: l.log_date, meals: l.meals, workouts: l.workouts, water_ml: l.water_ml, weight_kg: l.weight_kg, sleep_hours: Number.isFinite(l.sleep_hours as number) ? l.sleep_hours : null, energy: l.energy, notes: l.notes, updated_at: new Date().toISOString() }),
    [userId]
  );

  const save = useCallback(async () => {
    const l = pending.current;
    if (!l) return;
    clearTimeout(timer.current);
    clearTimeout(retry.current);
    const { error } = await supabase.from("daily_logs").upsert(rowOf(l), { onConflict: "user_id,log_date" });
    if (error) {
      setSaved("error");
      retry.current = setTimeout(() => save(), 5000);
      return;
    }
    if (pending.current === l) {
      pending.current = null;
      clearBackup(userId, l.log_date);
    }
    setSaved("saved");
  }, [supabase, rowOf, userId]);

  /** Last-chance save when the app is closed or hidden: a keepalive request survives the page going away. */
  const flushOnLeave = useCallback(() => {
    const l = pending.current;
    if (!l || !token.current) return;
    try {
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/daily_logs?on_conflict=user_id,log_date`, {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token.current}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(rowOf(l)),
      });
    } catch {
      /* the local backup will be re-sent next time */
    }
  }, [rowOf]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flushOnLeave();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushOnLeave);
    window.addEventListener("online", save);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushOnLeave);
      window.removeEventListener("online", save);
      save(); // leaving Today (e.g. another tab): save straight away
    };
  }, [flushOnLeave, save]);

  const persist = useCallback(
    (next: DailyLog) => {
      setLog(next);
      pending.current = next;
      writeBackup(userId, next);
      setSaved("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(save, 300);
    },
    [save, userId]
  );

  const fav = useFavorites(supabase);
  const [builder, setBuilder] = useState<Partial<MyMeal> | null>(null);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const nowSlot = (): Slot => {
    const h = new Date().getHours();
    return h < 10 ? "breakfast" : h < 15 ? "lunch" : h >= 17 && h < 22 ? "dinner" : "snack";
  };
  const addItems = (items: FoodItem[], slot: Slot = nowSlot(), source = "quick") =>
    persist({ ...log, meals: [...log.meals, ...items.map((it) => ({ ...it, id: uid(), slot, source }))] });
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

  const isToday = date === today;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{isToday ? `${greet}, ${name.trim().split(/\s+/)[0] || "there"}` : "Logging a past day"}</p>
          <Link href={`/app/calendar?m=${date.slice(0, 7)}&d=${date}`} className="group block text-left" aria-label="Open calendar">
            <h1 className="h-display mt-1 whitespace-nowrap text-[clamp(1.4rem,7.5vw,1.75rem)] leading-tight sm:text-4xl md:text-5xl">
              <span className="sm:hidden">{new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
              <span className="hidden sm:inline">{new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}</span>
              <span className="ml-2 align-middle text-base text-bone-mute transition group-hover:text-blood-400">▾</span>
            </h1>
          </Link>
          {!isToday && <button className="mt-1 text-xs text-blood-400 underline underline-offset-4" onClick={() => setDate(today)}>Back to today</button>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link href={`/app/calendar?m=${date.slice(0, 7)}&d=${date}`} className="chip hidden !h-10 !w-10 place-items-center !p-0 min-[360px]:inline-grid" aria-label="Calendar">📅</Link>
          <button className="chip inline-grid !h-10 !w-10 place-items-center !p-0" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">←</button>
          <button className="chip inline-grid !h-10 !w-10 place-items-center !p-0" disabled={isToday} onClick={() => setDate(addDays(date, 1))} aria-label="Next day">→</button>
        </div>
      </div>
      <p className="-mt-3 h-4 text-xs text-bone-mute">{loading ? "Loading…" : saved === "saving" ? "Saving…" : saved === "saved" ? "All changes saved" : saved === "error" ? "Offline? Changes kept on this phone and will save automatically." : ""}</p>

      {/* rings */}
      <div className="card grid grid-cols-3 gap-2 !px-3 !py-6 sm:!px-6">
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

      <GettingStarted supabase={supabase} onDemo={() => setScan("demo")} onScan={() => setScan("camera")} />
      {isToday && !locked && <AdaptiveCard onApplied={(p) => setPlan(p)} />}

      {builder && (
        <MealBuilder initial={builder} suggestions={[...fav.foods, ...recentFoods]} onClose={() => setBuilder(null)} onSave={(m, prev) => fav.saveItem(m, prev)} />
      )}

      {/* scan CTA */}
      <section className="glow-border relative overflow-hidden rounded-3xl bg-gradient-to-br from-blood/25 via-ink-2 to-ink-2 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blood-400">✨ AI food scan</div>
        <h2 className="h-display mt-1 text-2xl">What did you eat?</h2>
        <p className="mt-1 text-sm text-bone-dim">Snap your plate. Get calories, protein, carbs, fat, fibre, sugar and sodium in seconds.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="btn-red col-span-2 !py-3.5 text-base" onClick={() => setScan("camera")}>📷 Scan food</button>
          <button className="chip whitespace-nowrap !px-3 !py-3.5 text-sm" onClick={() => setScan("barcode")}>▥ Barcode</button>
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
              {scan === "barcode" ? (
                <BarcodeScanner dayLabel={isToday ? "today" : "this day"} onAdd={(item, slot) => addItems([item], slot, "barcode")} onFallback={(m) => setScan(m)} />
              ) : (
              <AiFoodLogger
                key={scan}
                start={scan}
                dayLabel={isToday ? "today" : "this day"}
                guide={{ kcal: t.kcal, protein: t.protein_g, carbs: t.carbs_g, fat: t.fat_g, fibre: t.fibre_g }}
                onAdd={logScanned}
              />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* meals */}
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="h-display text-2xl">Food</h2>
            <button className="btn-red !px-4 !py-2" onClick={() => setAdding(!adding)}>{adding ? "Close" : "+ More"}</button>
          </div>

          <div className="mt-4">
            <QuickFoods supabase={supabase} date={date} fav={fav} onAdd={(items) => addItems(items)} onBuildMeal={(m) => setBuilder(m ?? {})} onRecent={setRecentFoods} />
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
                <input className="input col-span-5 !py-2" aria-label="Custom food name" placeholder="Custom food" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
                {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
                  <input key={k} aria-label={k === "kcal" ? "Calories" : `${k} grams`} className="input !px-2 !py-2 text-sm" inputMode="decimal" placeholder={k === "kcal" ? "kcal" : `${k[0].toUpperCase()} g`} value={custom[k]} onChange={(e) => setCustom({ ...custom, [k]: e.target.value })} />
                ))}
                <button className="btn-ghost !px-2 !py-2">Add</button>
              </form>
            </div>
          )}

          {(["breakfast", "lunch", "dinner", "snack"] as const).some((sl) => log.meals.filter((m) => m.slot === sl).length >= 2) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(["breakfast", "lunch", "dinner", "snack"] as const)
                .filter((sl) => log.meals.filter((m) => m.slot === sl).length >= 2)
                .map((sl) => (
                  <button
                    key={sl}
                    className="chip !py-1.5 text-xs"
                    onClick={() => setBuilder({ name: `My ${sl}`, servings: 1, ingredients: log.meals.filter((m) => m.slot === sl).map((m) => fav.pickItem(m)) })}
                  >
                    🍱 Save {sl} as a meal
                  </button>
                ))}
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
                <div className="flex items-center">
                  <Star on={fav.isFav(m.name)} onClick={() => fav.toggle(fav.pickItem(m))} />
                  <button className="grid h-8 w-8 place-items-center text-bone-mute hover:text-blood-400" onClick={() => removeMeal(m.id)} aria-label="Remove">✕</button>
                </div>
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
                            {logged?.weight ? ` · ${kgTo(logged.weight, units.w)} ${units.w}` : lastFor(e.name) ? ` · last ${Math.max(...lastFor(e.name)!.sets.map((x) => x.w)) ? `${kgTo(Math.max(...lastFor(e.name)!.sets.map((x) => x.w)), units.w)} ${units.w}` : "BW"}` : ""}
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
                  last={lastFor}
                  onSwap={(i) => setSwapAt(i)}
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
              {swapAt != null && session.exercises[swapAt] && (
                <ExercisePicker
                  title={`Swap ${session.exercises[swapAt].name}`}
                  initialGroup={findExercise(session.exercises[swapAt].name)?.group}
                  exclude={session.exercises.map((e) => e.name)}
                  onClose={() => setSwapAt(null)}
                  onPick={(e) => {
                    swapExercise(swapAt, e.name);
                    setSwapAt(null);
                  }}
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
            <input className="input !py-2" aria-label="Other activity" placeholder="Other activity, e.g. 30 min run" value={other} onChange={(e) => setOther(e.target.value)} />
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
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div>
            <div className="label">Water</div>
            <div className="flex items-center gap-2">
              <button className="chip" onClick={() => persist({ ...log, water_ml: Math.max(0, log.water_ml - 250) })}>−</button>
              <div className="flex-1 text-center font-semibold">{(log.water_ml / 1000).toFixed(2)} L</div>
              <button className="chip chip-on" onClick={() => persist({ ...log, water_ml: log.water_ml + 250 })}>+250</button>
            </div>
          </div>
          <div>
            <div className="label flex justify-between">Morning weight ({units.w}) <Link href="/app/body" className="normal-case tracking-normal text-blood-400">📸 Body</Link></div>
            <ConvertedInput
              key={`${date}-${units.w}-${loading}`}
              className="input !py-2"
              value={log.weight_kg}
              unitKey={units.w}
              show={(v) => kgTo(v, units.w)}
              store={(v) => toKg(v, units.w)}
              onChange={(v) => persist({ ...log, weight_kg: v ?? null })}
              ariaLabel={`Morning weight in ${units.w}`}
            />
          </div>
          <div>
            <div className="label">Sleep hours</div>
            <SleepInput key={`${date}-${loading}`} value={log.sleep_hours} onChange={(v) => persist({ ...log, sleep_hours: v })} />
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
          <textarea className="input min-h-[80px]" aria-label="Notes for your coach" placeholder="How did today feel? Cravings, soreness, stress…" value={log.notes ?? ""} onChange={(e) => persist({ ...log, notes: e.target.value })} />
        </div>
      </section>
    </div>
  );
}

/** Reads "7", "7.5", "7,5", "7:30", "7h 30m", "7h", "30m". Returns null if empty or not understood. */
function parseSleep(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(",", ".");
  if (!s) return null;
  let h: number;
  const clock = s.match(/^(\d{1,2})\s*[:.]\s*(\d{2})$/);
  const hm = s.match(/^(?:(\d+(?:\.\d+)?)\s*h(?:rs?|ours?)?)?\s*(?:(\d+)\s*m(?:in)?s?)?$/);
  if (clock && s.includes(":")) h = Number(clock[1]) + Number(clock[2]) / 60;
  else if (/^\d*\.?\d+$|^\d+\.$/.test(s)) h = Number(s);
  else if (hm && (hm[1] || hm[2])) h = Number(hm[1] ?? 0) + Number(hm[2] ?? 0) / 60;
  else return null;
  if (!Number.isFinite(h) || h < 0 || h > 24) return null;
  return Math.round(h * 4) / 4;
}

function fmtSleep(v: number | null | undefined) {
  return v != null && Number.isFinite(v) ? String(v) : "";
}

function SleepInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(fmtSleep(value));
  const [bad, setBad] = useState(false);
  const step = (d: number) => {
    const base = value != null && Number.isFinite(value) ? value : 7;
    const next = Math.min(24, Math.max(0, base + d));
    setText(String(next));
    setBad(false);
    onChange(next);
  };
  return (
    <div>
      <div className="flex gap-1">
        <button type="button" className="chip !px-3 !py-2" aria-label="Half an hour less sleep" onClick={() => step(-0.5)}>−</button>
        <input
          className={`input !py-2 text-center ${bad ? "!border-blood-400" : ""}`}
          aria-label="Sleep hours"
          aria-invalid={bad}
          inputMode="decimal"
          placeholder="e.g. 7.5"
          value={text}
          onChange={(e) => {
            const t = e.target.value;
            setText(t);
            if (!t.trim()) { setBad(false); onChange(null); return; }
            const v = parseSleep(t);
            if (v == null) { setBad(true); return; }
            setBad(false);
            onChange(v);
          }}
          onBlur={() => { if (!bad) setText(fmtSleep(value)); }}
        />
        <button type="button" className="chip !px-3 !py-2" aria-label="Half an hour more sleep" onClick={() => step(0.5)}>+</button>
      </div>
      {bad && <p className="mt-1 text-xs text-blood-400">Enter hours like 7.5 or 7:30 (0–24).</p>}
    </div>
  );
}
