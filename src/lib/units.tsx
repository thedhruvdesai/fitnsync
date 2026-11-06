"use client";
import { useEffect, useState } from "react";

export type WeightUnit = "kg" | "lb";
export type LengthUnit = "cm" | "in";
export interface Units {
  w: WeightUnit;
  l: LengthUnit;
}

const KEY = "fs_units";
const LB = 2.20462;
const IN = 2.54;

export const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
export const kgTo = (kg: number, u: WeightUnit) => (u === "lb" ? round(kg * LB) : round(kg));
export const toKg = (v: number, u: WeightUnit) => (u === "lb" ? v / LB : v);
export const cmTo = (cm: number, u: LengthUnit) => (u === "in" ? round(cm / IN) : round(cm));
export const toCm = (v: number, u: LengthUnit) => (u === "in" ? v * IN : v);
export const cmToFtIn = (cm: number) => {
  const total = cm / IN;
  let ft = Math.floor(total / 12);
  let inch = Math.round(total - ft * 12);
  if (inch === 12) { ft++; inch = 0; }
  return { ft, inch };
};
export const ftInToCm = (ft: number, inch: number) => (ft * 12 + inch) * IN;

/** Unit preference remembered on this device. Defaults: kg + cm (Australia). */
export function useUnits() {
  const [units, setUnits] = useState<Units>({ w: "kg", l: "cm" });
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (v?.w && v?.l) setUnits(v);
    } catch {
      /* ignore */
    }
  }, []);
  const update = (u: Partial<Units>) =>
    setUnits((cur) => {
      const next = { ...cur, ...u };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  return [units, update] as const;
}

export function UnitToggle<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex rounded-full bg-white/5 p-0.5 text-[11px]" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} className={`rounded-full px-2.5 py-1 transition ${value === o.v ? "bg-bone font-semibold text-ink" : "text-bone-dim"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Number input that shows a converted value but keeps exactly what the user is typing. */
export function ConvertedInput({
  value,
  show,
  store,
  unitKey,
  onChange,
  placeholder,
  className = "w-full bg-transparent outline-none",
}: {
  value: number | null | undefined;
  show: (metric: number) => number;
  store: (shown: number) => number;
  unitKey: string;
  onChange: (metric: number | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(value != null && value !== 0 ? String(show(value)) : "");
  useEffect(() => {
    setText(value != null && value !== 0 ? String(show(value)) : "");
    // only re-sync when the unit changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitKey]);
  return (
    <input
      className={className}
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value.replace(",", ".");
        setText(raw);
        const n = Number(raw);
        onChange(raw && Number.isFinite(n) && n > 0 ? round(store(n), 2) : undefined);
      }}
    />
  );
}
