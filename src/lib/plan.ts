import { mealsFor, type MealTemplate } from "./foods";
import type { Equipment, Exercise, Experience, Goal, Intake, Plan, PlannedDay, PlannedMeal, Session, Targets } from "./types";

const ACTIVITY_FACTOR = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 } as const;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const r5 = (n: number) => Math.round(n / 5) * 5;

/* ---------------------------------------------------------------- targets */
export function computeTargets(i: Intake): Targets {
  const age = new Date().getFullYear() - i.birth_year;
  const bmr = 10 * i.weight_kg + 6.25 * i.height_cm - 5 * age + (i.sex === "male" ? 5 : -161); // Mifflin-St Jeor
  const tdee = bmr * ACTIVITY_FACTOR[i.activity];

  const goalAdj: Record<Goal, number> = { lose_fat: -0.2, build_muscle: 0.1, recomp: -0.05, performance: 0.05, general_health: 0 };
  let kcal = tdee * (1 + goalAdj[i.goal]);
  const floor = i.sex === "male" ? 1500 : 1200; // never prescribe below a safe floor
  kcal = Math.max(floor, kcal);

  const proteinPerKg: Record<Goal, number> = { lose_fat: 2.0, build_muscle: 1.8, recomp: 2.0, performance: 1.7, general_health: 1.4 };
  // use goal weight for protein if much heavier than goal (avoids silly numbers)
  const refWeight = i.weight_kg > i.goal_weight_kg * 1.15 ? i.goal_weight_kg : i.weight_kg;
  const protein_g = r5(Math.min(refWeight * proteinPerKg[i.goal], (kcal * 0.35) / 4));
  const fat_g = r5(Math.max(0.7 * i.weight_kg, (kcal * 0.25) / 9));
  const carbs_g = r5(Math.max(80, (kcal - protein_g * 4 - fat_g * 9) / 4));
  kcal = Math.round((protein_g * 4 + carbs_g * 4 + fat_g * 9) / 10) * 10;

  const weekly_change_kg = Math.round((((kcal - tdee) * 7) / 7700) * 100) / 100;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal,
    protein_g,
    carbs_g,
    fat_g,
    fibre_g: i.sex === "male" ? 35 : 28,
    water_ml: Math.round((i.weight_kg * 35 + i.training_days * 70) / 250) * 250,
    steps: i.goal === "lose_fat" ? 10000 : 8000,
    sleep_h: 8,
    weekly_change_kg,
  };
}

/* ---------------------------------------------------------------- meals */
function slotsFor(mealsPerDay: number): PlannedMeal["slot"][] {
  if (mealsPerDay <= 2) return ["lunch", "dinner"];
  if (mealsPerDay === 3) return ["breakfast", "lunch", "dinner"];
  if (mealsPerDay === 4) return ["breakfast", "lunch", "snack", "dinner"];
  return ["breakfast", "snack", "lunch", "snack", "dinner"];
}

function scaleMeal(m: MealTemplate, targetKcal: number): PlannedMeal {
  const f = Math.min(1.8, Math.max(0.6, targetKcal / m.kcal));
  const portion = Math.round(f * 4) / 4; // quarter steps
  const label = portion === 1 ? "" : ` · ${portion}× portion`;
  return {
    slot: m.slot,
    name: m.name + label,
    items: m.items,
    kcal: Math.round(m.kcal * portion),
    protein: Math.round(m.protein * portion),
    carbs: Math.round(m.carbs * portion),
    fat: Math.round(m.fat * portion),
  };
}

export function buildMealPlan(i: Intake, t: Targets): PlannedDay[] {
  const pool = mealsFor(i.diet, i.dislikes || "");
  const slots = slotsFor(i.meals_per_day);
  const share: Record<string, number> = { breakfast: 0.27, lunch: 0.33, dinner: 0.3, snack: 0.1 };
  const totalShare = slots.reduce((s, x) => s + share[x], 0);

  return DAYS.map((day, d) => {
    const meals = slots.map((slot, k) => {
      let options = pool.filter((m) => m.slot === slot);
      if (!options.length) options = pool.filter((m) => m.slot !== "snack");
      if (!options.length) options = pool; // extremely restrictive dislikes
      // prefer higher-protein options; rotate through the week
      options = [...options].sort((a, b) => b.protein / b.kcal - a.protein / a.kcal);
      const pick = options[(d * 3 + k * 2) % options.length];
      return scaleMeal(pick, (t.kcal * share[slot]) / totalShare);
    });
    // Protein top-up: if whole foods fall short, add a shake and trim the other meals to keep calories on target
    const shake: PlannedMeal = i.diet === "vegan"
      ? { slot: "snack", name: "Protein top-up (pea protein)", items: ["1 scoop pea/plant protein in water or soy milk"], kcal: 130, protein: 25, carbs: 4, fat: 2 }
      : { slot: "snack", name: "Protein top-up (whey)", items: ["1 scoop whey in water or milk"], kcal: 120, protein: 24, carbs: 3, fat: 1 };
    for (let n = 0; n < 2 && meals.reduce((s, m) => s + m.protein, 0) < t.protein_g * 0.85; n++) {
      meals.push({ ...shake });
      const others = meals.filter((m) => !m.name.startsWith("Protein top-up"));
      const room = t.kcal - meals.filter((m) => m.name.startsWith("Protein top-up")).reduce((s, m) => s + m.kcal, 0);
      const cur = others.reduce((s, m) => s + m.kcal, 0);
      const f = Math.max(0.75, Math.min(1, room / cur));
      others.forEach((m) => {
        m.kcal = Math.round(m.kcal * f);
        m.protein = Math.round(m.protein * f);
        m.carbs = Math.round(m.carbs * f);
        m.fat = Math.round(m.fat * f);
      });
    }
    return {
      day,
      meals,
      totals: {
        kcal: meals.reduce((s, m) => s + m.kcal, 0),
        protein: meals.reduce((s, m) => s + m.protein, 0),
      },
    };
  });
}

/* ---------------------------------------------------------------- training */
type Pattern = "squat" | "hinge" | "hpush" | "vpush" | "hpull" | "vpull" | "lunge" | "core" | "arms" | "calves";

const LIB: Record<Equipment, Record<Pattern, string[]>> = {
  gym: {
    squat: ["Back squat", "Leg press", "Hack squat"],
    hinge: ["Romanian deadlift", "Trap-bar deadlift", "Hip thrust"],
    hpush: ["Barbell bench press", "Incline dumbbell press", "Machine chest press"],
    vpush: ["Seated dumbbell shoulder press", "Overhead press", "Machine shoulder press"],
    hpull: ["Chest-supported row", "Seated cable row", "One-arm dumbbell row"],
    vpull: ["Lat pulldown", "Pull-ups (assisted if needed)", "Neutral-grip pulldown"],
    lunge: ["Walking lunges", "Bulgarian split squat", "Leg extension"],
    core: ["Cable crunch", "Hanging knee raise", "Pallof press"],
    arms: ["Cable curl / rope pushdown superset", "EZ-bar curl", "Overhead triceps extension"],
    calves: ["Standing calf raise", "Seated calf raise", "Leg-press calf raise"],
  },
  home: {
    squat: ["Goblet squat (dumbbell)", "Dumbbell front squat", "Tempo goblet squat"],
    hinge: ["Dumbbell Romanian deadlift", "Single-leg RDL", "Dumbbell hip thrust"],
    hpush: ["Dumbbell floor press", "Push-ups (weighted if easy)", "Incline dumbbell press on bench"],
    vpush: ["Dumbbell shoulder press", "Arnold press", "Pike push-ups"],
    hpull: ["One-arm dumbbell row", "Band row", "Chest-supported dumbbell row"],
    vpull: ["Band lat pulldown", "Door-frame pull-ups", "Dumbbell pullover"],
    lunge: ["Reverse lunges (dumbbell)", "Bulgarian split squat", "Step-ups"],
    core: ["Dead bug", "Plank", "Side plank"],
    arms: ["Dumbbell curl", "Hammer curl", "Dumbbell skull crusher"],
    calves: ["Single-leg calf raise", "Calf raise on step", "Tempo calf raise"],
  },
  none: {
    squat: ["Bodyweight squat (slow tempo)", "Jump squat", "Cossack squat"],
    hinge: ["Glute bridge", "Single-leg glute bridge", "Hip hinge good-morning"],
    hpush: ["Push-ups", "Incline push-ups", "Diamond push-ups"],
    vpush: ["Pike push-ups", "Elevated pike push-ups", "Shoulder taps"],
    hpull: ["Table/towel rows", "Doorway rows", "Superman pulls"],
    vpull: ["Doorway pull-aparts", "Prone Y-T-W raises", "Towel lat pulls"],
    lunge: ["Reverse lunges", "Split squats", "Step-ups on stairs"],
    core: ["Dead bug", "Plank", "Hollow hold"],
    arms: ["Chair dips", "Close-grip push-ups", "Towel isometric curls"],
    calves: ["Single-leg calf raise", "Calf raise on step", "Pogo hops"],
  },
};

const SESSIONS: Record<string, { title: string; focus: string; patterns: Pattern[] }> = {
  full_a: { title: "Full Body A", focus: "Squat, push, pull", patterns: ["squat", "hpush", "hpull", "lunge", "core"] },
  full_b: { title: "Full Body B", focus: "Hinge, press, pull", patterns: ["hinge", "vpush", "vpull", "lunge", "core"] },
  full_c: { title: "Full Body C", focus: "Mixed strength", patterns: ["squat", "hpush", "vpull", "hinge", "arms"] },
  upper_a: { title: "Upper A", focus: "Chest & back strength", patterns: ["hpush", "hpull", "vpush", "vpull", "arms"] },
  upper_b: { title: "Upper B", focus: "Shoulders, back, arms", patterns: ["vpush", "vpull", "hpush", "hpull", "arms"] },
  lower_a: { title: "Lower A", focus: "Quads & glutes", patterns: ["squat", "hinge", "lunge", "calves", "core"] },
  lower_b: { title: "Lower B", focus: "Posterior chain", patterns: ["hinge", "squat", "lunge", "calves", "core"] },
  push: { title: "Push", focus: "Chest, shoulders, triceps", patterns: ["hpush", "vpush", "hpush", "arms", "core"] },
  pull: { title: "Pull", focus: "Back & biceps", patterns: ["vpull", "hpull", "hpull", "arms", "core"] },
  legs: { title: "Legs", focus: "Quads, hamstrings, glutes", patterns: ["squat", "hinge", "lunge", "calves", "core"] },
};

const SPLITS: Record<number, { name: string; days: (keyof typeof SESSIONS)[]; on: number[] }> = {
  2: { name: "2-day Full Body", days: ["full_a", "full_b"], on: [0, 3] },
  3: { name: "3-day Full Body", days: ["full_a", "full_b", "full_c"], on: [0, 2, 4] },
  4: { name: "4-day Upper / Lower", days: ["upper_a", "lower_a", "upper_b", "lower_b"], on: [0, 1, 3, 4] },
  5: { name: "5-day Upper / Lower + PPL", days: ["upper_a", "lower_a", "push", "pull", "legs"], on: [0, 1, 3, 4, 5] },
  6: { name: "6-day Push / Pull / Legs", days: ["push", "pull", "legs", "push", "pull", "legs"], on: [0, 1, 2, 3, 4, 5] },
};

function scheme(exp: Experience, goal: Goal, idx: number): { sets: number; reps: string; rest: string } {
  const sets = exp === "beginner" ? 3 : exp === "intermediate" ? (idx < 2 ? 4 : 3) : 4;
  if (idx < 2) return { sets, reps: goal === "performance" ? "4–6" : "6–8", rest: "2–3 min" };
  if (goal === "lose_fat") return { sets: Math.max(2, sets - 1), reps: "10–15", rest: "60–75 s" };
  return { sets: 3, reps: "8–12", rest: "90 s" };
}

export function buildTraining(i: Intake) {
  const days = Math.min(6, Math.max(2, i.training_days));
  const split = SPLITS[days];
  const lib = LIB[i.equipment];
  const seen: Record<string, number> = {};

  const sessions: Session[] = split.days.map((key, n) => {
    const s = SESSIONS[key];
    seen[key] = (seen[key] ?? 0) + 1;
    const exercises: Exercise[] = s.patterns.map((p, idx) => {
      const opts = lib[p];
      const name = opts[(idx + (seen[key] - 1) + (p === "hpush" && idx > 0 ? 1 : 0)) % opts.length];
      return { name, ...scheme(i.experience, i.goal, idx) };
    });
    return {
      day: DAYS[split.on[n]],
      title: s.title,
      focus: s.focus,
      minutes: i.experience === "beginner" ? 45 : 60,
      exercises,
    };
  });

  const cardio =
    i.goal === "lose_fat"
      ? `${i.training_days >= 4 ? 2 : 3}× 25–35 min zone-2 cardio (brisk walk, incline treadmill, cycling) on non-lifting days or after training.`
      : i.goal === "performance"
      ? "1× intervals (8×30 s hard / 90 s easy) + 1× 40 min easy zone-2 each week."
      : "2× 20–30 min easy cardio a week for heart health and recovery.";

  const progression =
    "Use double progression: when you hit the top of the rep range on every set with good form, add 2.5 kg (or the smallest jump) next session. Keep 1–2 reps in reserve. Every 6th week, deload: same exercises, half the sets.";

  return { split: split.name, sessions, cardio, progression };
}

/* ---------------------------------------------------------------- full plan */
export function generatePlan(i: Intake): Plan {
  const targets = computeTargets(i);
  const notes: string[] = [];
  if (i.goal === "lose_fat") notes.push(`Aim for ~${Math.abs(targets.weekly_change_kg)} kg loss a week. If you lose faster than 1% of body weight weekly for 2+ weeks, add 150 kcal.`);
  if (i.goal === "build_muscle") notes.push("Aim to gain 0.25–0.5% of body weight per week. If the scale isn't moving after 3 weeks, add 150 kcal.");
  if (i.diet === "vegan" || i.diet === "vegetarian") notes.push("Plant-protein tip: combine legumes with grains across the day, and consider B12 (and vitamin D if you get little sun). Check with a GP before starting supplements.");
  notes.push(`Spread protein over ${i.meals_per_day} meals, roughly ${Math.round(targets.protein_g / Math.max(2, i.meals_per_day))} g each.`);
  if (i.constraints?.trim()) notes.push(`You noted: "${i.constraints.trim()}". Swap any exercise that aggravates it, and get it checked by a physio if pain persists.`);

  return {
    generated_at: new Date().toISOString(),
    targets,
    meals: buildMealPlan(i, targets),
    training: buildTraining(i),
    notes,
  };
}
