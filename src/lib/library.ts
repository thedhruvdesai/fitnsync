/**
 * Exercise library: 160 of the most-used gym and home exercises with real start/end photos
 * (public domain, yuhonas/free-exercise-db) and step-by-step instructions.
 */
import raw from "@/data/exercises.json";

export type Group = "Chest" | "Back" | "Shoulders" | "Arms" | "Legs" | "Glutes" | "Core" | "Cardio";

export interface LibExercise {
  id: string;
  name: string;
  group: Group;
  equipment: string;
  where: "gym" | "both";
  level: "beginner" | "intermediate" | "expert";
  primary: string[];
  secondary: string[];
  rank: number;
}

const data = raw as { source: string; exercises: LibExercise[] };

export const LIBRARY: LibExercise[] = data.exercises;
export const GROUPS: Group[] = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Glutes", "Core", "Cardio"];
export const EQUIPMENT = ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight", "Kettlebell", "Band", "Other"];

const BY_ID = new Map(LIBRARY.map((e) => [e.id, e]));
export const byId = (id: string) => BY_ID.get(id);

export function photo(id: string, frame: 0 | 1) {
  return `${data.source}${id}_${frame}.webp`;
}

/** Names the plan generator uses → library entry. */
const ALIAS: Record<string, string> = {
  "back squat": "Barbell_Squat",
  "leg press": "Leg_Press",
  "hack squat": "Hack_Squat",
  "romanian deadlift": "Romanian_Deadlift",
  "trap-bar deadlift": "Trap_Bar_Deadlift",
  "hip thrust": "Barbell_Hip_Thrust",
  "barbell bench press": "Barbell_Bench_Press_-_Medium_Grip",
  "incline dumbbell press": "Incline_Dumbbell_Press",
  "incline dumbbell press on bench": "Incline_Dumbbell_Press",
  "machine chest press": "Machine_Bench_Press",
  "seated dumbbell shoulder press": "Seated_Dumbbell_Press",
  "overhead press": "Standing_Military_Press",
  "machine shoulder press": "Machine_Shoulder_Military_Press",
  "chest-supported row": "Dumbbell_Incline_Row",
  "chest-supported dumbbell row": "Dumbbell_Incline_Row",
  "seated cable row": "Seated_Cable_Rows",
  "one-arm dumbbell row": "One-Arm_Dumbbell_Row",
  "lat pulldown": "Wide-Grip_Lat_Pulldown",
  "pull-ups (assisted if needed)": "Pullups",
  "door-frame pull-ups": "Pullups",
  "neutral-grip pulldown": "V-Bar_Pulldown",
  "walking lunges": "Bodyweight_Walking_Lunge",
  "bulgarian split squat": "Split_Squat_with_Dumbbells",
  "split squats": "Split_Squat_with_Dumbbells",
  "leg extension": "Leg_Extensions",
  "cable crunch": "Cable_Crunch",
  "hanging knee raise": "Hanging_Leg_Raise",
  "pallof press": "Pallof_Press",
  "cable curl / rope pushdown superset": "Standing_Biceps_Cable_Curl",
  "ez-bar curl": "EZ-Bar_Curl",
  "overhead triceps extension": "Cable_Rope_Overhead_Triceps_Extension",
  "standing calf raise": "Standing_Calf_Raises",
  "seated calf raise": "Seated_Calf_Raise",
  "leg-press calf raise": "Calf_Press_On_The_Leg_Press_Machine",
  "goblet squat (dumbbell)": "Goblet_Squat",
  "tempo goblet squat": "Goblet_Squat",
  "dumbbell front squat": "Dumbbell_Squat",
  "dumbbell romanian deadlift": "Stiff-Legged_Dumbbell_Deadlift",
  "single-leg rdl": "Kettlebell_One-Legged_Deadlift",
  "dumbbell hip thrust": "Barbell_Hip_Thrust",
  "dumbbell floor press": "Dumbbell_Floor_Press",
  "push-ups (weighted if easy)": "Pushups",
  "push-ups": "Pushups",
  "incline push-ups": "Incline_Push-Up",
  "diamond push-ups": "Push-Ups_-_Close_Triceps_Position",
  "close-grip push-ups": "Push-Ups_-_Close_Triceps_Position",
  "dumbbell shoulder press": "Dumbbell_Shoulder_Press",
  "arnold press": "Arnold_Dumbbell_Press",
  "dumbbell pullover": "Straight-Arm_Dumbbell_Pullover",
  "reverse lunges (dumbbell)": "Dumbbell_Rear_Lunge",
  "reverse lunges": "Dumbbell_Rear_Lunge",
  "step-ups": "Dumbbell_Step_Ups",
  "step-ups on stairs": "Step-up_with_Knee_Raise",
  "dead bug": "Dead_Bug",
  plank: "Plank",
  "side plank": "Side_Bridge",
  "dumbbell curl": "Dumbbell_Bicep_Curl",
  "hammer curl": "Hammer_Curls",
  "dumbbell skull crusher": "Lying_Dumbbell_Tricep_Extension",
  "single-leg calf raise": "Standing_Dumbbell_Calf_Raise",
  "calf raise on step": "Standing_Dumbbell_Calf_Raise",
  "tempo calf raise": "Standing_Dumbbell_Calf_Raise",
  "bodyweight squat (slow tempo)": "Bodyweight_Squat",
  "jump squat": "Freehand_Jump_Squat",
  "glute bridge": "Butt_Lift_Bridge",
  "single-leg glute bridge": "Single_Leg_Glute_Bridge",
  "table/towel rows": "Inverted_Row",
  "doorway rows": "Inverted_Row",
  "doorway pull-aparts": "Band_Pull_Apart",
  "chair dips": "Bench_Dips",
};

const BY_NAME = new Map(LIBRARY.map((e) => [e.name.toLowerCase(), e]));

/** Find the library entry for any exercise name (plan names, library names or ids). */
export function findExercise(name: string): LibExercise | undefined {
  const k = name.trim().toLowerCase();
  const alias = ALIAS[k];
  return (alias && BY_ID.get(alias)) || BY_NAME.get(k) || BY_ID.get(name);
}

/* --------------------------------------------------------------- history maths */
export interface SetEntry {
  w: number;
  r: number;
}

/** Epley estimate, capped at 12 reps where it stops being meaningful. */
export const oneRepMax = (w: number, r: number) => (r <= 1 ? w : w * (1 + Math.min(r, 12) / 30));

export interface SessionStat {
  date: string;
  heaviest: number;
  oneRm: number;
  volume: number;
  reps: number;
  sets: SetEntry[];
}

export function sessionStat(date: string, sets: SetEntry[]): SessionStat {
  const valid = sets.filter((s) => s.r > 0);
  return {
    date,
    sets: valid,
    heaviest: Math.max(0, ...valid.map((s) => s.w)),
    oneRm: Math.round(Math.max(0, ...valid.map((s) => oneRepMax(s.w, s.r))) * 10) / 10,
    volume: Math.round(valid.reduce((a, s) => a + s.w * s.r, 0)),
    reps: valid.reduce((a, s) => a + s.r, 0),
  };
}
