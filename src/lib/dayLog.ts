"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoggedMeal } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Append meals to a day's log from anywhere in the app (Recipes, My meals). */
export async function addMealsToDay(supabase: SupabaseClient, userId: string, date: string, meals: Omit<LoggedMeal, "id">[]) {
  const { data, error: readErr } = await supabase.from("daily_logs").select("meals").eq("log_date", date).maybeSingle();
  if (readErr) throw new Error(readErr.message);
  const existing = ((data?.meals as LoggedMeal[] | undefined) ?? []);
  const next = [...existing, ...meals.map((m) => ({ ...m, id: uid() }))];
  const { error } = await supabase.from("daily_logs").upsert({ user_id: userId, log_date: date, meals: next, updated_at: new Date().toISOString() }, { onConflict: "user_id,log_date" });
  if (error) throw new Error(error.message);
}

export const slotNow = (): "breakfast" | "lunch" | "dinner" | "snack" => {
  const h = new Date().getHours();
  return h < 10 ? "breakfast" : h < 15 ? "lunch" : h >= 17 && h < 22 ? "dinner" : "snack";
};
