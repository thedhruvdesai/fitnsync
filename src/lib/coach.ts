import { dateInTz } from "./tz";
import { generate } from "./llm";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, isoDate, summarizeWeek, weekStart, type WeekSummary } from "./report";
import type { DailyLog, Profile } from "./types";

export const COACH_NAME = "Liftkai Coach";
export const MONTHLY_CHECKINS = 8;

const SYSTEM = `You are ${COACH_NAME}, the AI performance coach inside the Liftkai app. Write like a seasoned strength & nutrition coach with 15+ years of experience coaching everyday people, athletes and shift workers: direct, warm, specific, zero fluff. You've seen every excuse and every plateau, and you explain the "why" in one line, then give the "what to do".

Voice:
- Talk to the client by first name, in second person, like a coach who knows their file.
- Quote their real numbers (averages, adherence %, weight change, sessions done) and compare against their targets.
- Praise what's genuinely working before fixing anything. Never generic praise.
- Give at most 3 fixes, each with a concrete action they can do this week (a specific food swap, time, rep target or habit).
- Australian English spelling. No emojis. No hype.
- Never pretend to be a human or claim personal experiences; you're an AI coach, but you don't need to keep reminding them.

Format (Markdown, 300–450 words):
## <one-line headline verdict for the week>
**What's working**: 2–3 bullets
**Fix this week**: up to 3 numbered items, each bold action + one-line reason
**Plan tweaks**: any change to calories, protein, training volume, cardio or sleep (or "No changes: stay the course.")
**One question for you**: one short question that helps you coach them better next week

Safety rules (non-negotiable):
- General fitness and nutrition guidance only. Do not diagnose, and do not give medical, injury-treatment or medication advice. For pain, injury, dizziness, chest pain or medical conditions, tell them to see a GP or physio.
- Never recommend fewer calories than their current target floor, extreme fasting, purging, or weight loss faster than 1% of body weight per week.
- If notes suggest disordered eating, very low intake, or distress, drop the performance talk: be kind, suggest easing targets, and encourage them to speak with their GP or the Butterfly Foundation (1800 33 4673).
- If there is little or no data, say so briefly and focus the feedback on building the logging habit.`;

function describe(profile: Profile, s: WeekSummary, prev: WeekSummary | null, logs: DailyLog[]) {
  const t = profile.plan!.targets;
  const notes = logs
    .filter((l) => l.notes?.trim() || l.energy)
    .map((l) => `- ${l.log_date}: ${l.energy ? `energy ${l.energy}/5. ` : ""}${l.notes?.trim() ?? ""}`)
    .join("\n");
  const sessions = logs.map((l) => `- ${l.log_date}: ${(l.workouts ?? []).map((w) => w.name).join(", ") || "none"}`).join("\n");
  return `CLIENT FILE
Name: ${profile.full_name || "client"} | Sex: ${profile.sex} | Born: ${profile.birth_year} | Height: ${profile.height_cm} cm | Start weight: ${profile.weight_kg} kg | Goal weight: ${profile.goal_weight_kg} kg
Goal: ${profile.goal} | Activity: ${profile.activity} | Experience: ${profile.experience} | Diet: ${profile.diet} | Equipment: ${profile.equipment} | Training days planned: ${profile.training_days}
Constraints they told us: ${profile.constraints || "none"}
Dislikes: ${profile.dislikes || "none"}

TARGETS: ${t.kcal} kcal, ${t.protein_g} g protein, ${t.carbs_g} g carbs, ${t.fat_g} g fat, ${t.water_ml} ml water, ${t.steps} steps, ${t.sleep_h} h sleep. Maintenance ≈ ${t.tdee} kcal.
Program: ${profile.plan!.training.split}

THIS WEEK (${s.start} to ${s.end})
Days logged: ${s.daysLogged}/7 | Avg kcal (logged food days): ${s.avgKcal} | Avg protein: ${s.avgProtein} g | Avg water: ${s.avgWater} ml | Avg sleep: ${s.avgSleep ?? "not logged"} h
Workouts: ${s.workouts}/${s.plannedWorkouts} | Calorie adherence: ${s.kcalAdherence}% | Protein adherence: ${s.proteinAdherence}%
Weight: ${s.startWeight ?? "?"} → ${s.endWeight ?? "?"} kg (change ${s.weightChange ?? "n/a"}) | Consistency score: ${s.score}/100
Daily: ${s.days.map((d) => `${d.date.slice(5)} ${d.kcal}kcal/${d.protein}gP/${d.workouts ? "trained" : "rest"}${d.weight ? `/${d.weight}kg` : ""}`).join("; ")}

Sessions logged:
${sessions || "none"}

Client notes:
${notes || "none"}

LAST WEEK: ${prev ? `score ${prev.score}, avg ${prev.avgKcal} kcal, ${prev.avgProtein} g protein, workouts ${prev.workouts}/${prev.plannedWorkouts}, weight change ${prev.weightChange ?? "n/a"}` : "no data"}`;
}

export async function generateFeedback(admin: SupabaseClient, profile: Profile, kind: "weekly" | "on_demand", question?: string) {
  const today = dateInTz(profile.timezone);
  // weekly review covers the week just finished; on-demand covers the last 7 days
  const start = kind === "weekly" ? addDays(weekStart(today), -7) : addDays(today, -6);
  const { data } = await admin.from("daily_logs").select("*").eq("user_id", profile.id).gte("log_date", addDays(start, -7)).lte("log_date", addDays(start, 6)).order("log_date");
  const logs = (data ?? []) as DailyLog[];
  const thisWeek = logs.filter((l) => l.log_date >= start);
  const lastWeek = logs.filter((l) => l.log_date < start);
  const planned = profile.plan!.training.sessions.length;
  const s = summarizeWeek(thisWeek, profile.plan!.targets, start, planned);
  const prev = lastWeek.length ? summarizeWeek(lastWeek, profile.plan!.targets, addDays(start, -7), planned) : null;

  const user =
    describe(profile, s, prev, thisWeek) +
    (question?.trim() ? `\n\nTHE CLIENT IS ASKING YOU DIRECTLY: "${question.trim().slice(0, 600)}"\nAnswer this first under a "## Your question" heading, then give the weekly-style feedback more briefly.` : "");

  const content = await generate({ system: SYSTEM, text: user, maxTokens: 1400 });

  await admin.from("coach_feedback").insert({ user_id: profile.id, week_start: start, kind, content });
  return { content, summary: s };
}
