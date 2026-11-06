import { requireProfile } from "@/lib/session";
import { addDays, isoDate } from "@/lib/report";
import type { DailyLog } from "@/lib/types";
import { CalendarView } from "./CalendarView";

export const metadata = { title: "Calendar · Fit&Sync" };

export default async function CalendarPage({ searchParams }: { searchParams: { m?: string; d?: string } }) {
  const { profile, supabase } = await requireProfile();
  const today = isoDate(new Date());
  const m = /^\d{4}-\d{2}$/.test(searchParams.m ?? "") ? `${searchParams.m}-01` : today.slice(0, 8) + "01";
  const next = new Date(m + "T00:00:00");
  next.setMonth(next.getMonth() + 1, 1);
  const end = addDays(isoDate(next), -1);
  const { data } = await supabase.from("daily_logs").select("log_date, meals, workouts, water_ml, weight_kg").gte("log_date", m).lte("log_date", end);
  const t = profile.plan!.targets;
  return (
    <CalendarView
      month={m}
      today={today}
      initial={searchParams.d}
      logs={(data ?? []) as Pick<DailyLog, "log_date" | "meals" | "workouts" | "water_ml" | "weight_kg">[]}
      kcalTarget={t.kcal}
      proteinTarget={t.protein_g}
    />
  );
}
