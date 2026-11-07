import type { Targets } from "./types";
import type { WeekSummary } from "./report";

export interface LiteFeedback {
  headline: string;
  working: string[];
  fixes: { action: string; why: string }[];
  score: number;
}

/**
 * Coach Lite: instant, rule-based feedback on the last 7 days. No AI call, so it's free to run,
 * works for every plan and appears the moment someone opens the Coach page.
 */
export function liteFeedback(s: WeekSummary, t: Targets, name: string, sleepTarget = 8): LiteFeedback {
  const first = name.trim().split(/\s+/)[0] || "there";
  const working: string[] = [];
  const fixes: { action: string; why: string; weight: number }[] = [];

  if (s.daysLogged === 0) {
    return {
      headline: `${first}, let's get your first week on the board.`,
      working: [],
      fixes: [
        { action: "Log one meal today with Scan food", why: "One photo is enough to start. Feedback gets specific once there's data." },
        { action: "Tick off one workout this week", why: "Even a 20-minute session gives us something to build on." },
        { action: "Add your morning weight twice this week", why: "Two weigh-ins show the trend, so your calories can be adjusted." },
      ],
      score: 0,
    };
  }

  // what's working
  if (s.daysLogged >= 5) working.push(`You logged ${s.daysLogged} of 7 days. That habit drives every result.`);
  if (s.proteinAdherence >= 70) working.push(`Protein on target ${Math.round((s.proteinAdherence / 100) * 7)} days, averaging ${s.avgProtein} g.`);
  if (s.kcalAdherence >= 60) working.push(`Calories within 10% of ${t.kcal.toLocaleString()} on most days.`);
  if (s.plannedWorkouts && s.workouts >= s.plannedWorkouts) working.push(`All ${s.workouts} planned sessions done.`);
  else if (s.workouts >= 2) working.push(`${s.workouts} training sessions completed.`);
  if (s.avgWater >= t.water_ml * 0.9) working.push(`Water averaging ${(s.avgWater / 1000).toFixed(1)} L.`);
  if (s.avgSleep != null && s.avgSleep >= sleepTarget - 0.5) working.push(`Sleep averaging ${s.avgSleep} h.`);

  // fixes, most important first
  if (s.daysLogged < 4) fixes.push({ weight: 10, action: `Log at least 5 days this week (you logged ${s.daysLogged})`, why: "Gaps hide what's really happening. Copy yesterday's food makes it quick." });
  if (s.avgProtein && s.avgProtein < t.protein_g * 0.9) {
    const gap = Math.round(t.protein_g - s.avgProtein);
    fixes.push({ weight: 9, action: `Add about ${gap} g protein a day`, why: gap > 30 ? "A protein shake plus Greek yoghurt or paneer covers most of it." : "One extra serve of eggs, dal, tofu, chicken or yoghurt covers it." });
  }
  if (s.avgKcal && s.avgKcal > t.kcal * 1.1) fixes.push({ weight: 8, action: `Trim about ${Math.round(s.avgKcal - t.kcal)} kcal a day`, why: `You averaged ${s.avgKcal.toLocaleString()} vs ${t.kcal.toLocaleString()}. Start with drinks, oils and snacks.` });
  if (s.avgKcal && s.avgKcal < t.kcal * 0.8) fixes.push({ weight: 8, action: "Eat closer to your calorie target", why: `You averaged ${s.avgKcal.toLocaleString()} vs ${t.kcal.toLocaleString()}. Eating too little stalls energy and training.` });
  if (s.plannedWorkouts && s.workouts < s.plannedWorkouts) fixes.push({ weight: 7, action: `Book ${s.plannedWorkouts - s.workouts} more session${s.plannedWorkouts - s.workouts > 1 ? "s" : ""} into your week`, why: `${s.workouts} of ${s.plannedWorkouts} done. Put them in your calendar like appointments.` });
  if (s.avgWater < t.water_ml * 0.75) fixes.push({ weight: 5, action: `Drink about ${((t.water_ml - s.avgWater) / 1000).toFixed(1)} L more a day`, why: "Keep a bottle in sight and tap +250 each time you refill." });
  if (s.avgSleep != null && s.avgSleep < sleepTarget - 1) fixes.push({ weight: 6, action: `Aim for ${sleepTarget} h of sleep (you averaged ${s.avgSleep} h)`, why: "Short sleep raises hunger and lowers training performance." });
  if (s.weightChange == null) fixes.push({ weight: 3, action: "Weigh in at least twice this week", why: "Same time, after the toilet, before food, so the trend is accurate." });

  fixes.sort((a, b) => b.weight - a.weight);
  const score = s.score;
  const headline =
    score >= 80 ? `Strong week, ${first}. Keep this rhythm.` :
    score >= 60 ? `Solid base, ${first}. A couple of tweaks will move the needle.` :
    score >= 35 ? `Some good signs, ${first}. Let's tighten the basics.` :
    `Fresh start this week, ${first}. Small wins first.`;

  return { headline, working: working.slice(0, 3), fixes: fixes.slice(0, 3).map(({ action, why }) => ({ action, why })), score };
}
