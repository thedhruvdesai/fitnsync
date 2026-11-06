import type { Plan, Targets } from "./types";

export interface WeighIn {
  date: string;
  kg: number;
}

export interface Adjustment {
  status: "not_enough_data" | "on_track" | "adjust" | "recently_adjusted";
  actualPerWeek?: number;
  targetPerWeek: number;
  delta?: number;
  newKcal?: number;
  weighIns: number;
  message: string;
}

const DAY = 86_400_000;

/** Least-squares slope of weight over time, in kg per week. */
function slopePerWeek(pts: WeighIn[]) {
  const t0 = Date.parse(pts[0].date);
  const xs = pts.map((p) => (Date.parse(p.date) - t0) / DAY);
  const ys = pts.map((p) => p.kg);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    den += (x - mx) ** 2;
  });
  return den ? (num / den) * 7 : 0;
}

/**
 * Compare the real weight trend (last ~3 weeks) with the plan's target rate and suggest a calorie change.
 * ~7,700 kcal per kg of body weight; changes are capped at ±250 kcal a week and never go below BMR.
 */
export function weeklyAdjustment(plan: Plan, weighIns: WeighIn[], today: string): Adjustment {
  const t = plan.targets;
  const target = t.weekly_change_kg ?? 0;
  const last = plan.adjustments?.[plan.adjustments.length - 1];
  const pts = [...new Map(weighIns.filter((w) => w.kg > 0).map((w) => [w.date, w])).values()].sort((a, b) => a.date.localeCompare(b.date));
  const span = pts.length ? (Date.parse(pts[pts.length - 1].date) - Date.parse(pts[0].date)) / DAY : 0;

  if (pts.length < 4 || span < 10)
    return { status: "not_enough_data", targetPerWeek: target, weighIns: pts.length, message: `Weigh in at least 4 times across 10+ days and we'll tune your calories automatically.` };

  const actual = Math.round(slopePerWeek(pts) * 100) / 100;
  if (last && Date.parse(today) - Date.parse(last.date) < 7 * DAY)
    return { status: "recently_adjusted", actualPerWeek: actual, targetPerWeek: target, weighIns: pts.length, message: `Calories were adjusted on ${last.date}. Next check in a week.` };

  const diff = actual - target; // positive = gaining faster / losing slower than planned
  if (Math.abs(diff) < 0.15)
    return { status: "on_track", actualPerWeek: actual, targetPerWeek: target, weighIns: pts.length, message: "Your weight is moving at the planned rate. Keep going." };

  let delta = -Math.round(((diff * 7700) / 7) / 50) * 50;
  delta = Math.max(-250, Math.min(250, delta));
  const floor = Math.max(1200, Math.round(t.bmr));
  const newKcal = Math.max(floor, t.kcal + delta);
  delta = newKcal - t.kcal;
  if (delta === 0)
    return { status: "on_track", actualPerWeek: actual, targetPerWeek: target, weighIns: pts.length, message: "You're at the lowest safe calorie target. Focus on steps, sleep and consistency." };

  const fmt = (v: number) => `${v > 0 ? "+" : ""}${v} kg/week`;
  return {
    status: "adjust",
    actualPerWeek: actual,
    targetPerWeek: target,
    delta,
    newKcal,
    weighIns: pts.length,
    message: `Your trend is ${fmt(actual)} vs a target of ${fmt(target)}. ${delta < 0 ? "Lower" : "Raise"} calories by ${Math.abs(delta)} to get back on track.`,
  };
}

/** Apply a calorie change mostly through carbs (protein stays fixed), with a fat floor. */
export function applyKcal(t: Targets, newKcal: number): Targets {
  const delta = newKcal - t.kcal;
  let carbs = t.carbs_g + delta / 4;
  let fat = t.fat_g;
  if (carbs < 60) {
    fat = Math.max(35, fat + ((carbs - 60) * 4) / 9);
    carbs = 60;
  }
  return { ...t, kcal: newKcal, carbs_g: Math.round(carbs), fat_g: Math.round(fat) };
}
