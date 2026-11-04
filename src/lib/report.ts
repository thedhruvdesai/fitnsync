import type { DailyLog, Targets } from "./types";

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

/** Monday of the week containing `iso` */
export function weekStart(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return isoDate(d);
}

export function dayTotals(log: Pick<DailyLog, "meals">) {
  return (log.meals ?? []).reduce(
    (s, m) => ({
      kcal: s.kcal + (Number(m.kcal) || 0),
      protein: s.protein + (Number(m.protein) || 0),
      carbs: s.carbs + (Number(m.carbs) || 0),
      fat: s.fat + (Number(m.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export interface WeekSummary {
  start: string;
  end: string;
  daysLogged: number;
  avgKcal: number;
  avgProtein: number;
  avgWater: number;
  avgSleep: number | null;
  workouts: number;
  plannedWorkouts: number;
  kcalAdherence: number; // % days within ±10% of target
  proteinAdherence: number; // % days ≥ 90% of protein target
  startWeight: number | null;
  endWeight: number | null;
  weightChange: number | null;
  score: number; // 0–100 overall consistency
  days: { date: string; kcal: number; protein: number; water: number; workouts: number; weight: number | null }[];
}

export function summarizeWeek(logs: DailyLog[], targets: Targets, start: string, plannedWorkouts: number): WeekSummary {
  const byDate = new Map(logs.map((l) => [l.log_date, l]));
  const days = Array.from({ length: 7 }, (_, k) => {
    const date = addDays(start, k);
    const l = byDate.get(date);
    const t = l ? dayTotals(l) : { kcal: 0, protein: 0 };
    return {
      date,
      kcal: Math.round(t.kcal),
      protein: Math.round(t.protein),
      water: l?.water_ml ?? 0,
      workouts: l?.workouts?.length ? 1 : 0,
      weight: l?.weight_kg ?? null,
      logged: !!l && ((l.meals?.length ?? 0) > 0 || (l.workouts?.length ?? 0) > 0 || (l.water_ml ?? 0) > 0),
      sleep: l?.sleep_hours ?? null,
    };
  });

  const logged = days.filter((d) => d.logged);
  const foodDays = logged.filter((d) => d.kcal > 0);
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0);
  const weights = days.filter((d) => d.weight != null).map((d) => d.weight as number);
  const sleeps = days.filter((d) => d.sleep != null).map((d) => d.sleep as number);

  const kcalAdherence = foodDays.length ? Math.round((foodDays.filter((d) => Math.abs(d.kcal - targets.kcal) <= targets.kcal * 0.1).length / 7) * 100) : 0;
  const proteinAdherence = foodDays.length ? Math.round((foodDays.filter((d) => d.protein >= targets.protein_g * 0.9).length / 7) * 100) : 0;
  const workouts = days.reduce((s, d) => s + d.workouts, 0);
  const trainingPct = plannedWorkouts ? Math.min(100, Math.round((workouts / plannedWorkouts) * 100)) : 100;
  const waterPct = Math.min(100, Math.round((avg(days.map((d) => d.water)) / targets.water_ml) * 100));
  const loggingPct = Math.round((logged.length / 7) * 100);

  const score = Math.round(kcalAdherence * 0.25 + proteinAdherence * 0.25 + trainingPct * 0.25 + waterPct * 0.1 + loggingPct * 0.15);

  return {
    start,
    end: addDays(start, 6),
    daysLogged: logged.length,
    avgKcal: avg(foodDays.map((d) => d.kcal)),
    avgProtein: avg(foodDays.map((d) => d.protein)),
    avgWater: avg(days.map((d) => d.water)),
    avgSleep: sleeps.length ? Math.round((sleeps.reduce((s, x) => s + x, 0) / sleeps.length) * 10) / 10 : null,
    workouts,
    plannedWorkouts,
    kcalAdherence,
    proteinAdherence,
    startWeight: weights[0] ?? null,
    endWeight: weights.length ? weights[weights.length - 1] : null,
    weightChange: weights.length >= 2 ? Math.round((weights[weights.length - 1] - weights[0]) * 10) / 10 : null,
    score,
    days: days.map(({ date, kcal, protein, water, workouts, weight }) => ({ date, kcal, protein, water, workouts, weight })),
  };
}
