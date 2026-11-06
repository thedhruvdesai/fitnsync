"use client";
import { LineChart } from "./Charts";
import { kgTo, useUnits } from "@/lib/units";

/** Weight in the user's preferred unit (kg or lb). */
export function W({ kg, signed, suffix = true }: { kg: number | null | undefined; signed?: boolean; suffix?: boolean }) {
  const [u] = useUnits();
  if (kg == null) return <>—</>;
  const v = kgTo(kg, u.w);
  return <>{signed && v > 0 ? "+" : ""}{v}{suffix ? ` ${u.w}` : ""}</>;
}

export function WeightChart({ points, goalKg }: { points: { label: string; value: number | null }[]; goalKg?: number }) {
  const [u] = useUnits();
  return <LineChart points={points.map((p) => ({ ...p, value: p.value == null ? null : kgTo(p.value, u.w) }))} unit={` ${u.w}`} target={goalKg != null ? kgTo(goalKg, u.w) : undefined} />;
}
