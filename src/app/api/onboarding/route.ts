import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePlan } from "@/lib/plan";
import type { Intake } from "@/lib/types";

const num = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const oneOf = <T extends string>(v: unknown, opts: readonly T[]) => (opts.includes(v as T) ? (v as T) : null);

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const b = await req.json();
  const year = new Date().getFullYear();
  const intake: Intake = {
    full_name: String(b.full_name ?? "").slice(0, 60),
    sex: oneOf(b.sex, ["male", "female"] as const)!,
    birth_year: num(b.birth_year, year - 90, year - 16)!,
    height_cm: num(b.height_cm, 120, 230)!,
    weight_kg: num(b.weight_kg, 35, 300)!,
    goal_weight_kg: num(b.goal_weight_kg, 35, 300)!,
    goal: oneOf(b.goal, ["lose_fat", "build_muscle", "recomp", "performance", "general_health"] as const)!,
    activity: oneOf(b.activity, ["sedentary", "light", "moderate", "active", "very_active"] as const)!,
    experience: oneOf(b.experience, ["beginner", "intermediate", "advanced"] as const)!,
    diet: oneOf(b.diet, ["vegetarian", "vegan", "eggetarian", "pescatarian", "non_veg"] as const)!,
    equipment: oneOf(b.equipment, ["none", "home", "gym"] as const)!,
    training_days: num(b.training_days, 2, 6)!,
    meals_per_day: num(b.meals_per_day, 2, 5)!,
    dislikes: String(b.dislikes ?? "").slice(0, 300),
    constraints: String(b.constraints ?? "").slice(0, 300),
  };
  const missing = Object.entries(intake).filter(([k, v]) => v === null && k !== "dislikes" && k !== "constraints");
  if (missing.length) return NextResponse.json({ error: `Check: ${missing.map(([k]) => k.replace("_", " ")).join(", ")}` }, { status: 400 });

  const plan = generatePlan(intake);
  const { error } = await supabase.from("profiles").update({ ...intake, plan, onboarded: true }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // starting weight goes into today's log
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("daily_logs").upsert({ user_id: user.id, log_date: today, weight_kg: intake.weight_kg }, { onConflict: "user_id,log_date", ignoreDuplicates: true });

  return NextResponse.json({ ok: true, plan });
}
