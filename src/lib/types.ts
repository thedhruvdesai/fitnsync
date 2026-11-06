export type Sex = "male" | "female";
export type Goal = "lose_fat" | "build_muscle" | "recomp" | "performance" | "general_health";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Experience = "beginner" | "intermediate" | "advanced";
export type Diet = "vegetarian" | "vegan" | "eggetarian" | "pescatarian" | "non_veg";
export type Equipment = "none" | "home" | "gym";

export interface Intake {
  full_name: string;
  sex: Sex;
  birth_year: number;
  height_cm: number;
  weight_kg: number;
  goal_weight_kg: number;
  goal: Goal;
  activity: Activity;
  experience: Experience;
  diet: Diet;
  equipment: Equipment;
  training_days: number;
  meals_per_day: number;
  dislikes: string;
  constraints: string;
}

export interface Targets {
  bmr: number;
  tdee: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  water_ml: number;
  steps: number;
  sleep_h: number;
  weekly_change_kg: number;
}

export interface PlannedMeal {
  slot: string;
  name: string;
  items: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PlannedDay {
  day: string;
  meals: PlannedMeal[];
  totals: { kcal: number; protein: number };
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  cue?: string;
}

export interface Session {
  day: string;
  title: string;
  focus: string;
  minutes: number;
  exercises: Exercise[];
}

export interface Plan {
  generated_at: string;
  targets: Targets;
  meals: PlannedDay[];
  training: { split: string; sessions: Session[]; cardio: string; progression: string };
  notes: string[];
}

export interface LoggedMeal {
  id: string;
  name: string;
  slot: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface LoggedWorkout {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  minutes?: number;
  /** library id (src/data/exercises.json) */
  ex?: string;
  /** every completed set: weight kg + reps */
  set_list?: { w: number; r: number }[];
}

export interface DailyLog {
  log_date: string;
  meals: LoggedMeal[];
  workouts: LoggedWorkout[];
  water_ml: number;
  weight_kg: number | null;
  sleep_hours: number | null;
  energy: number | null;
  notes: string | null;
}

export interface Profile extends Partial<Intake> {
  id: string;
  email: string | null;
  plan: Plan | null;
  onboarded: boolean;
  tier: "free" | "starter" | "pro" | "elite";
  subscription_status: string | null;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  weekly_email: boolean;
}
