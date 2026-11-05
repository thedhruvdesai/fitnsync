"use client";
import { useRef, useState } from "react";

export interface AiItem {
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
}

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

export function AiFoodLogger({ onAdd }: { onAdd: (items: AiItem[]) => void }) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<(AiItem & { on: boolean })[] | null>(null);
  const [note, setNote] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  async function pick(f?: File | null) {
    if (!f) return;
    setError(null);
    try {
      setPhoto(await compress(f));
      setItems(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function analyze() {
    setBusy(true);
    setError(null);
    setItems(null);
    try {
      const res = await fetch("/api/food/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, image: photo ?? undefined }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Something went wrong");
      if (!j.items?.length) throw new Error(j.note || "No food found. Try another photo or describe it.");
      setItems(j.items.map((i: AiItem) => ({ ...i, on: true })));
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
  }

  const chosen = items?.filter((i) => i.on) ?? [];
  const total = chosen.reduce((s, i) => ({ kcal: s.kcal + i.kcal, protein: s.protein + i.protein, carbs: s.carbs + i.carbs, fat: s.fat + i.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const edit = (k: number, field: keyof AiItem, v: string) =>
    setItems((list) => list!.map((it, i) => (i === k ? { ...it, [field]: field === "name" || field === "portion" ? v : Math.max(0, Number(v) || 0) } : it)));

  return (
    <div className="glow-border rounded-2xl bg-ink-2 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blood">✨ AI food log</div>
          <p className="mt-0.5 text-xs text-bone-mute">Snap your plate or type what you ate, and we&apos;ll work out the calories and macros.</p>
        </div>
        {remaining != null && <span className="text-[10px] text-bone-mute">{remaining} left today</span>}
      </div>

      {!items && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="chip flex items-center justify-center gap-2 !py-3" onClick={() => camera.current?.click()}>📷 Take photo</button>
            <button type="button" className="chip flex items-center justify-center gap-2 !py-3" onClick={() => gallery.current?.click()}>🖼️ Upload photo</button>
          </div>
          <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <input ref={gallery} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

          {photo && (
            <div className="relative mt-3 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="Your meal" className="max-h-56 w-full object-cover" />
              <button type="button" onClick={() => setPhoto(null)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-sm">✕</button>
              {busy && <div className="sheen absolute inset-0 bg-ink/40" />}
            </div>
          )}

          <textarea
            className="input mt-3 min-h-[70px] !py-2.5 text-sm"
            placeholder={photo ? "Optional: add details, e.g. 'cooked in 1 tsp ghee, 2 rotis'" : "e.g. 2 rotis, 1 bowl dal, a bit of rice and salad"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-blood-400">{error}</p>}
          <button type="button" className="btn-red mt-3 w-full" disabled={busy || (!photo && !text.trim())} onClick={analyze}>
            {busy ? "Reading your meal…" : "Work out calories"}
          </button>
        </>
      )}

      {items && (
        <div className="mt-3">
          <ul className="space-y-2">
            {items.map((it, k) => (
              <li key={k} className={`rounded-xl border p-3 transition ${it.on ? "border-blood/40 bg-blood/5" : "border-white/10 opacity-60"}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={it.on} onChange={(e) => setItems((l) => l!.map((x, i) => (i === k ? { ...x, on: e.target.checked } : x)))} className="mt-1 accent-[#E11D2E]" />
                  <div className="min-w-0 flex-1">
                    <input className="w-full bg-transparent font-medium outline-none" value={it.name} onChange={(e) => edit(k, "name", e.target.value)} />
                    <div className="flex items-center gap-2 text-xs text-bone-mute">
                      <input className="w-full bg-transparent outline-none" value={it.portion} onChange={(e) => edit(k, "portion", e.target.value)} />
                      <span className={`shrink-0 ${CONF[it.confidence]}`}>● {it.confidence}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {(["kcal", "protein", "carbs", "fat"] as const).map((f) => (
                        <label key={f} className="rounded-lg bg-ink-3 px-2 py-1">
                          <span className="block whitespace-nowrap text-[9px] uppercase tracking-wider text-bone-mute">{f === "kcal" ? "kcal" : f === "protein" ? "Prot g" : `${f} g`}</span>
                          <input inputMode="numeric" className="w-full bg-transparent text-sm outline-none" value={it[f]} onChange={(e) => edit(k, f, e.target.value)} />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {note && <p className="mt-3 text-xs text-bone-dim">💡 {note}</p>}
          <div className="mt-3 rounded-xl bg-ink-3 px-3 py-2 text-sm">
            Total: <strong>{total.kcal} kcal</strong> · {total.protein} g P · {total.carbs} g C · {total.fat} g F
          </div>
          <p className="mt-2 text-[11px] text-bone-mute">AI estimates can be off. Tap any number to fix it before adding.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-ghost !py-2.5" onClick={reset}>Start over</button>
            <button
              type="button"
              className="btn-red flex-1 !py-2.5"
              disabled={!chosen.length}
              onClick={() => {
                onAdd(chosen);
                reset();
              }}
            >
              Add {chosen.length} item{chosen.length === 1 ? "" : "s"} to today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
