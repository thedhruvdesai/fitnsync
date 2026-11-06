"use client";
import { useEffect, useRef, useState } from "react";

export interface AiItem {
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  sat_fat: number;
  sodium: number;
  confidence: "high" | "medium" | "low";
}

export type Slot = "breakfast" | "lunch" | "dinner" | "snack";
export type StartMode = "camera" | "gallery" | "text" | "manual" | "demo";
export const DEMO_MEAL = "2 scrambled eggs on sourdough toast with half an avocado, and a regular flat white";

/** Daily guides for the nutrition panel. Sodium: Australian suggested dietary target 2,000 mg. */
export interface DailyGuide {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

const blank = (): AiItem & { on: boolean } => ({ name: "", portion: "1 serve", kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sat_fat: 0, sodium: 0, confidence: "high", on: true });

/** Shrink a photo in the browser before upload (max 1024px, JPEG) so scans are fast and cheap. */
async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Couldn't read that image"));
      i.src = url;
    });
    const max = 1024;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const CONF = { high: "text-emerald-400", medium: "text-amber-300", low: "text-blood-400" };
const SLOTS: { k: Slot; label: string }[] = [
  { k: "breakfast", label: "Breakfast" },
  { k: "lunch", label: "Lunch" },
  { k: "dinner", label: "Dinner" },
  { k: "snack", label: "Snack" },
];
const slotNow = (): Slot => {
  const h = new Date().getHours();
  return h < 10 ? "breakfast" : h < 15 ? "lunch" : h >= 17 && h < 22 ? "dinner" : "snack";
};

const FIELDS: { k: keyof AiItem; label: string; unit: string; sub?: boolean }[] = [
  { k: "kcal", label: "Calories", unit: "kcal" },
  { k: "protein", label: "Protein", unit: "g" },
  { k: "carbs", label: "Carbs", unit: "g" },
  { k: "sugar", label: "Sugars", unit: "g", sub: true },
  { k: "fibre", label: "Fibre", unit: "g", sub: true },
  { k: "fat", label: "Fat", unit: "g" },
  { k: "sat_fat", label: "Saturated", unit: "g", sub: true },
  { k: "sodium", label: "Sodium", unit: "mg" },
];

type Row = AiItem & { on: boolean };

export function AiFoodLogger({
  onAdd,
  start,
  guide,
  dayLabel = "today",
}: {
  onAdd: (items: AiItem[], slot: Slot, source: "ai" | "manual") => void;
  start?: StartMode;
  guide?: DailyGuide;
  dayLabel?: string;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Row[] | null>(start === "manual" ? [blank()] : null);
  const [source, setSource] = useState<"ai" | "manual">(start === "manual" ? "manual" : "ai");
  const [editing, setEditing] = useState<boolean>(start === "manual");
  const [open, setOpen] = useState<number | null>(start === "manual" ? 0 : null);
  const [note, setNote] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [slot, setSlot] = useState<Slot>(slotNow());
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (start === "camera") camera.current?.click();
    if (start === "gallery") gallery.current?.click();
    if (start === "demo") {
      setText(DEMO_MEAL);
      analyze(null, DEMO_MEAL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  async function pick(f?: File | null) {
    if (!f) return;
    setError(null);
    try {
      const p = await compress(f);
      setPhoto(p);
      setItems(null);
      analyze(p, text);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function analyze(p = photo, t = text) {
    setBusy(true);
    setError(null);
    setItems(null);
    try {
      const res = await fetch("/api/food/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t, image: p ?? undefined }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Something went wrong");
      if (!j.items?.length) throw new Error(j.note || "No food found. Try another photo or describe it.");
      setItems(j.items.map((i: AiItem) => ({ ...blank(), ...i, on: true })));
      setSource("ai");
      setEditing(false);
      setOpen(null);
      setNote(j.note || "");
      setRemaining(j.remaining ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  function reset() {
    setPhoto(null);
    setText("");
    setItems(null);
    setNote("");
    setEditing(false);
    setOpen(null);
    setDone(false);
  }

  function manual() {
    setItems((l) => (l?.length ? l : [blank()]));
    setSource((s) => (items?.length ? s : "manual"));
    setEditing(true);
    setOpen(items?.length ? null : 0);
  }

  const chosen = items?.filter((i) => i.on) ?? [];
  const total = chosen.reduce(
    (s, i) => {
      for (const f of FIELDS) s[f.k as "kcal"] += Number(i[f.k]) || 0;
      return s;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sat_fat: 0, sodium: 0 } as Record<string, number>
  );
  const edit = (k: number, field: keyof AiItem, v: string) =>
    setItems((list) => list!.map((it, i) => (i === k ? { ...it, [field]: field === "name" || field === "portion" ? v : Math.max(0, Number(v) || 0) } : it)));

  const macroK = total.protein * 4 + total.carbs * 4 + total.fat * 9 || 1;
  const pct = (v: number, of?: number) => (of ? Math.round((v / of) * 100) : null);
  const daily: Record<string, number | undefined> = {
    kcal: guide?.kcal,
    protein: guide?.protein,
    carbs: guide?.carbs,
    fat: guide?.fat,
    fibre: guide?.fibre,
    sodium: 2000,
    sat_fat: guide ? Math.round((guide.kcal * 0.1) / 9) : undefined,
    sugar: guide ? Math.round((guide.kcal * 0.1) / 4) : undefined,
  };
  const flags: { t: string; good: boolean }[] = [];
  if (total.protein >= 25) flags.push({ t: "Good protein", good: true });
  if (total.fibre >= 8) flags.push({ t: "High fibre", good: true });
  if (total.sodium >= 800) flags.push({ t: "High sodium", good: false });
  if (total.sugar >= 25) flags.push({ t: "High sugar", good: false });
  if (total.sat_fat >= 10) flags.push({ t: "High saturated fat", good: false });

  const canLog = chosen.length > 0 && chosen.every((c) => c.name.trim());

  if (done)
    return (
      <div className="rounded-2xl bg-ink-2 p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blood text-2xl text-white">✓</div>
        <p className="h-display mt-3 text-2xl">Logged to {dayLabel}</p>
        <p className="mt-1 text-sm text-bone-dim">{total.kcal} kcal added to {SLOTS.find((s) => s.k === slot)!.label.toLowerCase()}.</p>
        <button className="btn-ghost mt-4" onClick={reset}>Scan another</button>
      </div>
    );

  return (
    <div className="rounded-2xl bg-ink-2 p-4">
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <input ref={gallery} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blood">{source === "manual" && items ? "✍️ Manual entry" : start === "demo" ? "✨ Demo scan" : "✨ AI food scan"}</div>
        {remaining != null && <span className="text-[10px] text-bone-mute">{remaining} scans left today</span>}
      </div>

      {/* capture */}
      {!items && (
        <>
          {photo ? (
            <div className="relative mt-3 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="Your meal" className="max-h-60 w-full object-cover" />
              {!busy && <button type="button" onClick={() => setPhoto(null)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-sm">✕</button>}
              {busy && (
                <div className="absolute inset-0 grid place-items-center bg-ink/50">
                  <div className="sheen absolute inset-0" />
                  <span className="relative rounded-full bg-ink/80 px-4 py-2 text-sm">🔍 Reading your meal…</span>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="flex flex-col items-center gap-1 rounded-2xl border border-blood/40 bg-blood/10 py-5 text-sm font-medium" onClick={() => camera.current?.click()}>
                <span className="text-2xl">📷</span>Scan with camera
              </button>
              <button type="button" className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] py-5 text-sm font-medium" onClick={() => gallery.current?.click()}>
                <span className="text-2xl">🖼️</span>Upload photo
              </button>
            </div>
          )}

          <textarea
            className="input mt-3 min-h-[64px] !py-2.5 text-sm"
            placeholder={photo ? "Optional: add details, e.g. 'cooked in olive oil, large portion'" : "Or type it: '2 eggs on toast and a flat white', 'chicken biryani, 1 plate'"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-blood-400">{error}</p>}
          <button type="button" className="btn-red mt-3 w-full" disabled={busy || (!photo && !text.trim())} onClick={() => analyze()}>
            {busy ? "Working it out…" : photo ? "Analyse photo again" : "Work out nutrition"}
          </button>
          <button type="button" className="mt-3 w-full text-center text-xs text-bone-mute underline underline-offset-4 hover:text-bone" onClick={manual}>
            Enter nutrition manually instead
          </button>
        </>
      )}

      {/* review */}
      {items && (
        <div className="mt-3 space-y-4">
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt="Your meal" className="h-32 w-full rounded-xl object-cover" />
          )}

          {/* headline */}
          <div className="rounded-2xl border border-white/10 bg-ink p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-bone-mute">Total</div>
                <div className="h-display text-5xl leading-none tabular-nums">{total.kcal}<span className="ml-1 text-base text-bone-dim">kcal</span></div>
              </div>
              {daily.kcal && <div className="text-right text-xs text-bone-mute">{pct(total.kcal, daily.kcal)}% of your<br />daily target</div>}
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="bg-blood" style={{ width: `${(total.protein * 4 * 100) / macroK}%` }} />
              <div className="bg-amber-400" style={{ width: `${(total.carbs * 4 * 100) / macroK}%` }} />
              <div className="bg-sky-400" style={{ width: `${(total.fat * 9 * 100) / macroK}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span><span className="text-blood">●</span> Protein {total.protein} g</span>
              <span><span className="text-amber-400">●</span> Carbs {total.carbs} g</span>
              <span><span className="text-sky-400">●</span> Fat {total.fat} g</span>
            </div>
            {flags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {flags.map((f) => (
                  <span key={f.t} className={`rounded-full px-2.5 py-0.5 text-[11px] ${f.good ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>{f.good ? "✓" : "!"} {f.t}</span>
                ))}
              </div>
            )}
          </div>

          {/* nutrition facts */}
          <div className="rounded-2xl border border-white/10 bg-ink p-4">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
              <span className="font-semibold">Nutrition facts</span>
              <span className="text-[10px] uppercase tracking-widest text-bone-mute">% daily</span>
            </div>
            <dl className="divide-y divide-white/5 text-sm">
              {FIELDS.filter((f) => f.k !== "kcal").map((f) => {
                const p = pct(total[f.k], daily[f.k]);
                return (
                  <div key={f.k} className={`flex items-center justify-between py-1.5 ${f.sub ? "pl-4 text-bone-dim" : ""}`}>
                    <dt>{f.sub ? `of which ${f.label.toLowerCase()}` : f.label}</dt>
                    <dd className="flex items-center gap-3 tabular-nums">
                      <span>{total[f.k]} {f.unit}</span>
                      <span className={`w-10 text-right text-xs ${p != null && p >= 40 && (f.k === "sodium" || f.k === "sugar" || f.k === "sat_fat") ? "text-amber-300" : "text-bone-mute"}`}>{p != null ? `${p}%` : ""}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          {/* items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label !mb-0">{items.length > 1 ? `${items.length} items found` : "Item"}</span>
              {source === "ai" && <span className="text-[10px] text-bone-mute">Untick anything you didn&apos;t eat</span>}
            </div>
            <ul className="space-y-2">
              {items.map((it, k) => (
                <li key={k} className={`rounded-xl border transition ${it.on ? "border-white/10 bg-white/[0.03]" : "border-white/5 opacity-50"}`}>
                  <div className="flex items-center gap-3 p-3">
                    <input type="checkbox" checked={it.on} onChange={(e) => setItems((l) => l!.map((x, i) => (i === k ? { ...x, on: e.target.checked } : x)))} className="h-4 w-4 accent-[#E11D2E]" aria-label={`Include ${it.name}`} />
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === k ? null : k)}>
                      <span className="block truncate font-medium">{it.name || "Untitled food"}</span>
                      <span className="block text-xs text-bone-mute">
                        {it.portion} · {it.kcal} kcal{source === "ai" && <span className={`ml-1 ${CONF[it.confidence]}`}>● {it.confidence}</span>}
                      </span>
                    </button>
                    <button type="button" onClick={() => setOpen(open === k ? null : k)} className="text-xs text-bone-mute">{open === k || editing ? "▲" : "✏️"}</button>
                  </div>
                  {(open === k || editing) && (
                    <div className="space-y-2 border-t border-white/5 p-3">
                      <div className="grid grid-cols-[1.6fr_1fr] gap-2">
                        <input className="input !py-2 text-sm" placeholder="Food name" value={it.name} onChange={(e) => edit(k, "name", e.target.value)} />
                        <input className="input !py-2 text-sm" placeholder="Portion" value={it.portion} onChange={(e) => edit(k, "portion", e.target.value)} />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {FIELDS.map((f) => (
                          <label key={f.k} className="rounded-lg bg-ink px-2 py-1">
                            <span className="block whitespace-nowrap text-[9px] uppercase tracking-wider text-bone-mute">{f.label} {f.unit}</span>
                            <input inputMode="decimal" className="w-full bg-transparent text-sm outline-none" value={it[f.k] as number} onFocus={(e) => e.target.select()} onChange={(e) => edit(k, f.k, e.target.value)} />
                          </label>
                        ))}
                      </div>
                      {items.length > 1 && (
                        <button type="button" className="text-xs text-blood-400" onClick={() => { setItems((l) => l!.filter((_, i) => i !== k)); setOpen(null); }}>Remove item</button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {editing && (
              <button type="button" className="mt-2 text-xs text-bone-dim underline underline-offset-4" onClick={() => { setItems((l) => [...(l ?? []), blank()]); setOpen(items.length); }}>+ Add another item</button>
            )}
          </div>

          {note && <p className="rounded-xl bg-white/[0.03] p-3 text-xs text-bone-dim">💡 {note}</p>}

          {/* slot */}
          <div>
            <div className="label">Add to</div>
            <div className="grid grid-cols-4 gap-1.5">
              {SLOTS.map((s) => (
                <button key={s.k} type="button" onClick={() => setSlot(s.k)} className={`rounded-xl py-2 text-xs transition ${slot === s.k ? "bg-bone text-ink" : "bg-white/5 text-bone-dim"}`}>{s.label}</button>
              ))}
            </div>
          </div>

          {source === "ai" && <p className="text-[11px] text-bone-mute">AI estimates can be off by 10–20%. Tap ✏️ on any item to correct it.</p>}

          <div className="space-y-2">
            <button
              type="button"
              className="btn-red w-full !py-3.5 text-base"
              disabled={!canLog}
              onClick={() => {
                onAdd(chosen.map(({ on: _on, ...rest }) => rest), slot, source);
                setDone(true);
              }}
            >
              ✓ Log {chosen.length > 1 ? `${chosen.length} items` : "it"} to {dayLabel}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-ghost !py-2.5 text-sm" onClick={() => (editing ? setEditing(false) : manual())}>{editing ? "Done editing" : "✏️ Edit manually"}</button>
              <button type="button" className="btn-ghost !py-2.5 text-sm" onClick={reset}>↺ Scan again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
