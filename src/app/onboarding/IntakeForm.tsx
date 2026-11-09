"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ConvertedInput, cmToFtIn, ftInToCm, kgTo, round, toKg, UnitToggle, useUnits } from "@/lib/units";
import type { Intake, Plan } from "@/lib/types";

type Opt<T> = { v: T; label: string; sub?: string };

const GOALS: Opt<Intake["goal"]>[] = [
  { v: "lose_fat", label: "Lose fat", sub: "Lean out, keep muscle" },
  { v: "build_muscle", label: "Build muscle", sub: "Size & strength" },
  { v: "recomp", label: "Recomp", sub: "Lose fat and build muscle together" },
  { v: "performance", label: "Performance", sub: "Stronger, fitter, faster" },
  { v: "general_health", label: "Feel healthier", sub: "Energy, habits, longevity" },
];
const ACTIVITY: Opt<Intake["activity"]>[] = [
  { v: "sedentary", label: "Mostly sitting", sub: "Desk job, < 5k steps" },
  { v: "light", label: "Lightly active", sub: "5–8k steps" },
  { v: "moderate", label: "Active", sub: "On your feet a lot, 8–12k" },
  { v: "active", label: "Very active", sub: "Physical job / shift work" },
  { v: "very_active", label: "Athlete", sub: "Hard physical work + training" },
];
const DIETS: Opt<Intake["diet"]>[] = [
  { v: "non_veg", label: "I eat everything", sub: "Meat, fish, eggs, dairy, plants" },
  { v: "pescatarian", label: "Pescatarian", sub: "Fish & seafood, no meat" },
  { v: "eggetarian", label: "Vegetarian + eggs" },
  { v: "vegetarian", label: "Vegetarian" },
  { v: "vegan", label: "Vegan", sub: "Fully plant-based" },
];
const EQUIP: Opt<Intake["equipment"]>[] = [
  { v: "gym", label: "Full gym" },
  { v: "home", label: "Home: dumbbells/bands" },
  { v: "none", label: "No equipment" },
];
const EXP: Opt<Intake["experience"]>[] = [
  { v: "beginner", label: "New to lifting", sub: "< 6 months" },
  { v: "intermediate", label: "Some experience", sub: "6 months – 3 years" },
  { v: "advanced", label: "Experienced", sub: "3+ years, consistent" },
];

function Choice<T extends string | number>({ opts, value, onChange, cols = 1 }: { opts: Opt<T>[]; value: T | undefined; onChange: (v: T) => void; cols?: number }) {
  return (
    <div className={`grid gap-2 ${cols === 2 ? "grid-cols-2" : ""}`}>
      {opts.map((o) => (
        <button
          type="button"
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={`rounded-2xl border px-4 py-3.5 text-left transition ${value === o.v ? "border-blood bg-blood/10" : "border-white/10 bg-ink-2 hover:border-white/25"}`}
        >
          <div className="font-semibold">{o.label}</div>
          {o.sub && <div className="text-sm text-bone-dim">{o.sub}</div>}
        </button>
      ))}
    </div>
  );
}

const LOVE_CHOICES: { food: string; tag: "vegan" | "veg" | "egg" | "fish" | "meat" }[] = [
  { food: "chicken", tag: "meat" }, { food: "beef", tag: "meat" }, { food: "salmon", tag: "fish" }, { food: "tuna", tag: "fish" }, { food: "prawns", tag: "fish" },
  { food: "eggs", tag: "egg" }, { food: "paneer", tag: "veg" }, { food: "yogurt", tag: "veg" }, { food: "cheese", tag: "veg" },
  { food: "tofu", tag: "vegan" }, { food: "lentils", tag: "vegan" }, { food: "chickpeas", tag: "vegan" }, { food: "beans", tag: "vegan" },
  { food: "rice", tag: "vegan" }, { food: "oats", tag: "vegan" }, { food: "pasta", tag: "vegan" }, { food: "potato", tag: "vegan" }, { food: "avocado", tag: "vegan" }, { food: "berries", tag: "vegan" },
];
const DIET_ALLOWS: Record<string, string[]> = { vegan: ["vegan"], vegetarian: ["vegan", "veg"], eggetarian: ["vegan", "veg", "egg"], pescatarian: ["vegan", "veg", "egg", "fish"], non_veg: ["vegan", "veg", "egg", "fish", "meat"] };

/** Pick or type the foods you love; the meal plan is built around them. */
function FoodsYouLove({ value, diet, onChange }: { value: string; diet?: string; onChange: (v: string) => void }) {
  const list = value.split(",").map((x) => x.trim()).filter(Boolean);
  const has = (w: string) => list.some((x) => x.toLowerCase() === w);
  const toggle = (w: string) => onChange((has(w) ? list.filter((x) => x.toLowerCase() !== w) : [...list, w]).join(", "));
  const allowed = DIET_ALLOWS[diet ?? "non_veg"] ?? DIET_ALLOWS.non_veg;
  const choices = LOVE_CHOICES.filter((c) => allowed.includes(c.tag));
  return (
    <div>
      <label className="label">Foods you love (your meals are built around these)</label>
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <button type="button" key={c.food} onClick={() => toggle(c.food)} aria-pressed={has(c.food)} className={`chip !py-1.5 text-sm capitalize ${has(c.food) ? "chip-on" : ""}`}>
            {has(c.food) ? "✓ " : "+ "}{c.food}
          </button>
        ))}
      </div>
      <input className="input mt-3" aria-label="Foods you love" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Add your own, e.g. dal, sushi, kimchi, sourdough" />
    </div>
  );
}

export default function IntakeForm({ initial, customTraining = null }: { initial: Partial<Intake>; customTraining?: { days: number; equipment: string } | null }) {
  const [keepTraining, setKeepTraining] = useState(true);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [f, setF] = useState<Partial<Intake>>({
    training_days: 4,
    meals_per_day: 3,
    dislikes: "",
    likes: "",
    constraints: "",
    ...Object.fromEntries(Object.entries(initial).filter(([, v]) => v !== null && v !== undefined)),
  });
  const set = <K extends keyof Intake>(k: K, v: Intake[K]) => setF((p) => ({ ...p, [k]: v }));
  const [units, setUnits] = useUnits();
  const [hUnit, setHUnitRaw] = useState<"cm" | "ft">("cm");
  const [ftIn, setFtIn] = useState<{ ft: string; inch: string }>({ ft: "", inch: "" });
  const setHUnit = (u: "cm" | "ft") => {
    setHUnitRaw(u);
    setUnits({ l: u === "ft" ? "in" : "cm" });
    if (u === "ft" && f.height_cm) {
      const { ft, inch } = cmToFtIn(f.height_cm);
      setFtIn({ ft: String(ft), inch: String(inch) });
    }
  };
  useEffect(() => {
    if (units.l === "in" && hUnit === "cm") setHUnit("ft");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units.l]);
  const setHeightFt = (ft: string, inch: string) => {
    setFtIn({ ft, inch });
    const cm = ftInToCm(Number(ft) || 0, Number(inch) || 0);
    set("height_cm", cm > 0 ? round(cm, 1) : (undefined as never));
  };

  const steps = [
    { title: "About you", ok: !!(f.full_name && f.sex && f.birth_year && f.height_cm && f.weight_kg) },
    { title: "Your goal", ok: !!(f.goal && f.goal_weight_kg) },
    { title: "Your week", ok: !!(f.activity && f.experience && f.equipment && f.training_days) },
    { title: "How you eat", ok: !!(f.diet && f.meals_per_day) },
    { title: "Anything we should know?", ok: true },
  ];

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, keepTraining, timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; } })() }) });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setError(j.error || "Something went wrong");
    setPlan(j.plan);
  }

  if (plan) {
    const t = plan.targets;
    return (
      <main className="relative z-10 mx-auto max-w-lg px-6 py-10">
        <Logo />
        <p className="eyebrow mt-14">Your plan is ready</p>
        <h1 className="h-display mt-2 text-5xl leading-[0.95]">{t.kcal.toLocaleString()} kcal<br /><span className="text-blood-400">{t.protein_g} g</span> protein.</h1>
        <p className="mt-4 text-bone-dim">
          Your maintenance is about {t.tdee.toLocaleString()} kcal.{" "}
          {t.weekly_change_kg < 0 ? `Expect about ${Math.abs(t.weekly_change_kg)} kg loss a week.` : t.weekly_change_kg > 0 ? `Expect about ${t.weekly_change_kg} kg gain a week.` : "Built for steady recomposition."}
        </p>
        <div className="mt-8 grid grid-cols-3 gap-2 text-center">
          {[["Carbs", `${t.carbs_g} g`], ["Fat", `${t.fat_g} g`], ["Water", `${(t.water_ml / 1000).toFixed(1)} L`], ["Steps", t.steps.toLocaleString()], ["Sleep", `${t.sleep_h} h`], ["Training", plan.training.split.split(" ")[0]]].map(([k, v]) => (
            <div key={k} className="card !p-4">
              <div className="text-xs uppercase tracking-widest text-bone-mute">{k}</div>
              <div className="mt-1 text-lg font-semibold">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3">
          <button className="btn-red" onClick={() => router.push("/app/billing?welcome=1")}>Unlock my full plan</button>
          <button className="btn-ghost" onClick={() => router.push("/app")}>Go to dashboard</button>
        </div>
      </main>
    );
  }

  const s = steps[step];
  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-6 py-10">
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-sm text-bone-mute">{step + 1} / {steps.length}</span>
      </div>
      <div className="mt-6 h-1 rounded-full bg-ink-4">
        <div className="h-1 rounded-full bg-blood transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>
      <h1 className="h-display mt-10 text-4xl">{s.title}</h1>

      <div className="mt-8 flex-1 space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="label">First name</label>
              <input className="input" aria-label="First name" value={f.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div>
              <label className="label">Sex (for energy maths)</label>
              <Choice cols={2} opts={[{ v: "male", label: "Male" }, { v: "female", label: "Female" }]} value={f.sex} onChange={(v) => set("sex", v)} />
            </div>
            <div>
              <label className="label">Birth year</label>
              <input className="input" aria-label="Birth year" inputMode="numeric" value={f.birth_year ?? ""} onChange={(e) => set("birth_year", Number(e.target.value) || (undefined as never))} placeholder="1998" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label !mb-0">Height</label>
                <UnitToggle label="Height unit" value={hUnit} onChange={setHUnit} options={[{ v: "cm", label: "cm" }, { v: "ft", label: "ft / in" }]} />
              </div>
              {hUnit === "cm" ? (
                <input className="input" aria-label="Height in centimetres" inputMode="decimal" value={f.height_cm ? round(f.height_cm) : ""} onChange={(e) => set("height_cm", Number(e.target.value) || (undefined as never))} placeholder="175" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <label className="input flex items-center gap-2">
                    <input className="w-full bg-transparent outline-none" inputMode="numeric" value={ftIn.ft} placeholder="5" aria-label="Height feet" onChange={(e) => setHeightFt(e.target.value, ftIn.inch)} />
                    <span className="text-sm text-bone-mute">ft</span>
                  </label>
                  <label className="input flex items-center gap-2">
                    <input className="w-full bg-transparent outline-none" inputMode="numeric" value={ftIn.inch} placeholder="9" aria-label="Height inches" onChange={(e) => setHeightFt(ftIn.ft, e.target.value)} />
                    <span className="text-sm text-bone-mute">in</span>
                  </label>
                </div>
              )}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label !mb-0">Weight</label>
                <UnitToggle label="Weight unit" value={units.w} onChange={(w) => setUnits({ w })} options={[{ v: "kg", label: "kg" }, { v: "lb", label: "lb" }]} />
              </div>
              <label className="input flex items-center gap-2">
                <ConvertedInput value={f.weight_kg} unitKey={units.w} show={(v) => kgTo(v, units.w)} store={(v) => toKg(v, units.w)} onChange={(v) => set("weight_kg", v as never)} placeholder={units.w === "kg" ? "72" : "160"} ariaLabel={`Weight in ${units.w}`} />
                <span className="text-sm text-bone-mute">{units.w}</span>
              </label>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <Choice opts={GOALS} value={f.goal} onChange={(v) => set("goal", v)} />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label !mb-0">Goal weight</label>
                <UnitToggle label="Weight unit" value={units.w} onChange={(w) => setUnits({ w })} options={[{ v: "kg", label: "kg" }, { v: "lb", label: "lb" }]} />
              </div>
              <label className="input flex items-center gap-2">
                <ConvertedInput value={f.goal_weight_kg} unitKey={units.w} show={(v) => kgTo(v, units.w)} store={(v) => toKg(v, units.w)} onChange={(v) => set("goal_weight_kg", v as never)} placeholder={String(kgTo(f.weight_kg ?? 70, units.w))} ariaLabel={`Goal weight in ${units.w}`} />
                <span className="text-sm text-bone-mute">{units.w}</span>
              </label>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div>
              <label className="label">Daily activity outside training</label>
              <Choice opts={ACTIVITY} value={f.activity} onChange={(v) => set("activity", v)} />
            </div>
            <div>
              <label className="label">Training experience</label>
              <Choice opts={EXP} value={f.experience} onChange={(v) => set("experience", v)} />
            </div>
            <div>
              <label className="label">Where you train</label>
              <Choice opts={EQUIP} value={f.equipment} onChange={(v) => set("equipment", v)} />
            </div>
            <div>
              <label className="label">Training days per week</label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button type="button" key={n} onClick={() => set("training_days", n)} className={`chip flex-1 ${f.training_days === n ? "chip-on" : ""}`}>{n}</button>
                ))}
              </div>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div>
              <label className="label">Diet</label>
              <Choice opts={DIETS} value={f.diet} onChange={(v) => set("diet", v)} />
            </div>
            <div>
              <label className="label">Meals per day</label>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => set("meals_per_day", n)} className={`chip flex-1 ${f.meals_per_day === n ? "chip-on" : ""}`}>{n}</button>
                ))}
              </div>
            </div>
            <FoodsYouLove value={f.likes ?? ""} diet={f.diet} onChange={(v) => set("likes", v)} />
            <div>
              <label className="label">Foods you won&apos;t eat (comma separated)</label>
              <input className="input" aria-label="Foods you dislike" value={f.dislikes ?? ""} onChange={(e) => set("dislikes", e.target.value)} placeholder="mushroom, tofu" />
            </div>
          </>
        )}
        {step === 4 && (
          <div>
            <label className="label">Injuries, schedule or anything else (optional)</label>
            <textarea className="input min-h-[140px]" aria-label="Injuries, schedule or anything else" value={f.constraints ?? ""} onChange={(e) => set("constraints", e.target.value)} placeholder="e.g. night shifts 3×/week, sore left knee, only 45 min to train" />
            {customTraining && (
              customTraining.days === f.training_days && customTraining.equipment === f.equipment ? (
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-[#E11D2E]" checked={keepTraining} onChange={(e) => setKeepTraining(e.target.checked)} />
                  <span>
                    <span className="block text-sm font-medium">Keep my edited workouts</span>
                    <span className="block text-xs text-bone-mute">You&apos;ve customised your training. Leave this on to keep your exercises; your calories and meals will still update. Untick for a fresh program.</span>
                  </span>
                </label>
              ) : (
                <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-100">
                  Heads up: you&apos;ve customised your workouts, but you changed your training days or equipment, so we&apos;ll build a new program to match. You can edit it again on the Plan page.
                </p>
              )
            )}
            <p className="mt-3 text-xs text-bone-mute">Liftkai gives general fitness and nutrition guidance. It isn&apos;t medical advice. If you have a medical condition, are pregnant, or have a history of disordered eating, please check with your GP first.</p>
          </div>
        )}
        {error && <p className="text-sm text-blood-400">{error}</p>}
      </div>

      <div className="sticky bottom-0 mt-8 flex gap-3 bg-gradient-to-t from-ink via-ink to-transparent pb-4 pt-6">
        {step > 0 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
        {step < steps.length - 1 ? (
          <button className="btn-red flex-1" disabled={!s.ok} onClick={() => setStep(step + 1)}>Continue</button>
        ) : (
          <button className="btn-red flex-1" disabled={busy} onClick={submit}>{busy ? "Building your plan…" : "Build my plan"}</button>
        )}
      </div>
    </main>
  );
}
