"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Slot } from "./AiFoodLogger";
import type { FoodItem } from "./QuickFoods";

interface Product {
  code: string;
  name: string;
  brand: string;
  image: string | null;
  quantity: string;
  serving: { grams: number; label: string } | null;
  per100: { kcal: number; protein: number; carbs: number; sugar: number; fat: number; sat_fat: number; fibre: number; sodium: number };
  complete: boolean;
}

const SLOTS: Slot[] = ["breakfast", "lunch", "dinner", "snack"];
const slotNow = (): Slot => {
  const h = new Date().getHours();
  return h < 10 ? "breakfast" : h < 15 ? "lunch" : h >= 17 && h < 22 ? "dinner" : "snack";
};
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

export function BarcodeScanner({ onAdd, onFallback, dayLabel = "today" }: { onAdd: (item: FoodItem, slot: Slot) => void; onFallback: (mode: "camera" | "manual") => void; dayLabel?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<"scan" | "loading" | "result" | "notfound" | "done">("scan");
  const [camError, setCamError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [unit, setUnit] = useState<"serving" | "g">("serving");
  const [qty, setQty] = useState("1");
  const [slot, setSlot] = useState<Slot>(slotNow());

  const lookup = useCallback(async (raw: string) => {
    stopRef.current();
    const c = raw.replace(/\D/g, "");
    setCode(c);
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch(`/api/food/barcode?code=${c}`);
      const j = await res.json();
      if (res.status === 404) return setPhase("notfound");
      if (!res.ok) throw new Error(j.error || "Lookup failed");
      setProduct(j);
      setUnit(j.serving ? "serving" : "g");
      setQty(j.serving ? "1" : "100");
      setPhase("result");
      try {
        navigator.vibrate?.(60);
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase("scan");
    }
  }, []);

  // camera + detection loop
  useEffect(() => {
    if (phase !== "scan") return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let zxingStop: (() => void) | undefined;

    const stop = () => {
      cancelled = true;
      clearTimeout(timer);
      zxingStop?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
    stopRef.current = stop;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
        if (cancelled || !video.current) return stream.getTracks().forEach((t) => t.stop());
        video.current.srcObject = stream;
        await video.current.play().catch(() => {});

        const BD = (window as unknown as { BarcodeDetector?: { new (o: { formats: string[] }): BarcodeDetectorLike; getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
        const supported = BD ? await BD.getSupportedFormats?.().catch(() => []) : [];
        if (BD && supported?.some((f) => FORMATS.includes(f))) {
          const det = new BD({ formats: FORMATS.filter((f) => supported.includes(f)) });
          const tick = async () => {
            if (cancelled || !video.current) return;
            try {
              const found = await det.detect(video.current);
              if (found[0]?.rawValue) return lookup(found[0].rawValue);
            } catch {
              /* frame not ready */
            }
            timer = setTimeout(tick, 250);
          };
          tick();
        } else {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromVideoElement(video.current, (result) => {
            if (result && !cancelled) lookup(result.getText());
          });
          zxingStop = () => controls.stop();
        }
      } catch (e) {
        const name = (e as Error).name;
        setCamError(name === "NotAllowedError" ? "Camera permission was blocked. Allow camera access in your browser settings, or type the barcode number below." : "Couldn't start the camera. Type the barcode number below instead.");
      }
    })();
    return stop;
  }, [phase, lookup]);

  const factor = product ? (unit === "serving" && product.serving ? (Number(qty) || 0) * product.serving.grams : Number(qty) || 0) / 100 : 0;
  const r = (v: number, d = 0) => Math.round(v * factor * 10 ** d) / 10 ** d;
  const n = product?.per100;
  const amountLabel = product ? (unit === "serving" && product.serving ? `${qty} × ${product.serving.label}` : `${qty} g`) : "";

  if (phase === "done")
    return (
      <div className="p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blood text-2xl text-white">✓</div>
        <p className="h-display mt-3 text-2xl">Logged to {dayLabel}</p>
        <button className="btn-ghost mt-4" onClick={() => { setProduct(null); setCode(""); setPhase("scan"); }}>Scan another barcode</button>
      </div>
    );

  return (
    <div className="space-y-4 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blood-400">▥ Barcode scan</div>

      {phase === "scan" && (
        <>
          {!camError ? (
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video ref={video} playsInline muted className="aspect-[4/3] w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="relative h-28 w-64 rounded-xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,.45)]">
                  <div className="scanline absolute inset-x-2 h-0.5 rounded bg-blood shadow-[0_0_12px_#E11D2E]" />
                </div>
              </div>
              <p className="absolute inset-x-0 bottom-3 text-center text-xs text-white/80">Point at the barcode on the pack</p>
            </div>
          ) : (
            <p className="rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">{camError}</p>
          )}
          {error && <p className="text-sm text-blood-400">{error}</p>}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code) lookup(code); }}>
            <input className="input !py-2.5" inputMode="numeric" placeholder="Or type the barcode number" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            <button className="btn-red !px-4 !py-2.5" disabled={code.length < 6}>Find</button>
          </form>
        </>
      )}

      {phase === "loading" && (
        <div className="grid place-items-center gap-3 py-12 text-sm text-bone-dim">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-blood" />
          Looking up {code}…
        </div>
      )}

      {phase === "notfound" && (
        <div className="space-y-3 py-2 text-center">
          <div className="text-4xl">🔎</div>
          <p className="font-medium">We couldn&apos;t find barcode {code}</p>
          <p className="text-sm text-bone-dim">Snap the nutrition label and our AI will read it, or type the values in yourself.</p>
          <button className="btn-red w-full" onClick={() => onFallback("camera")}>📷 Scan the nutrition label</button>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost !py-2.5 text-sm" onClick={() => onFallback("manual")}>✍️ Enter manually</button>
            <button className="btn-ghost !py-2.5 text-sm" onClick={() => { setCode(""); setPhase("scan"); }}>↺ Scan again</button>
          </div>
        </div>
      )}

      {phase === "result" && product && n && (
        <>
          <div className="flex items-center gap-3">
            {product.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={product.image} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-white object-contain p-1" />
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl">🛒</div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{product.name}</p>
              <p className="truncate text-xs text-bone-mute">{[product.brand, product.quantity].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          {!product.complete && <p className="rounded-xl bg-amber-400/10 p-3 text-xs text-amber-200">This product has incomplete nutrition data. Check the pack and use ✍️ Edit if needed.</p>}

          <div>
            <div className="label">How much?</div>
            <div className="flex gap-2">
              <div className="flex items-center rounded-xl border border-white/10 bg-ink-3">
                <button type="button" className="px-3 py-2 text-lg" onClick={() => setQty(String(Math.max(0, (Number(qty) || 0) - (unit === "g" ? 10 : 0.5))))}>−</button>
                <input className="w-16 bg-transparent text-center outline-none" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} onFocus={(e) => e.target.select()} />
                <button type="button" className="px-3 py-2 text-lg" onClick={() => setQty(String((Number(qty) || 0) + (unit === "g" ? 10 : 0.5)))}>+</button>
              </div>
              <div className="flex flex-1 rounded-xl bg-white/5 p-1 text-xs">
                {product.serving && (
                  <button type="button" onClick={() => { setUnit("serving"); setQty("1"); }} className={`flex-1 rounded-lg px-2 ${unit === "serving" ? "bg-bone text-ink" : "text-bone-dim"}`}>Serving ({product.serving.label})</button>
                )}
                <button type="button" onClick={() => { setUnit("g"); setQty(product.serving ? String(product.serving.grams) : "100"); }} className={`flex-1 rounded-lg px-2 ${unit === "g" ? "bg-bone text-ink" : "text-bone-dim"}`}>Grams / ml</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-ink p-4">
            <div className="flex items-end justify-between">
              <div className="h-display text-4xl tabular-nums">{r(n.kcal)}<span className="ml-1 text-sm text-bone-dim">kcal</span></div>
              <div className="text-xs text-bone-mute">{amountLabel}</div>
            </div>
            <dl className="mt-3 divide-y divide-white/5 text-sm">
              {([
                ["Protein", r(n.protein, 1), "g"],
                ["Carbs", r(n.carbs, 1), "g"],
                ["of which sugars", r(n.sugar, 1), "g", true],
                ["Fibre", r(n.fibre, 1), "g", true],
                ["Fat", r(n.fat, 1), "g"],
                ["of which saturated", r(n.sat_fat, 1), "g", true],
                ["Sodium", r(n.sodium), "mg"],
              ] as const).map(([k, v, u, sub]) => (
                <div key={k} className={`flex justify-between py-1.5 ${sub ? "pl-4 text-bone-dim" : ""}`}>
                  <dt>{k}</dt>
                  <dd className="tabular-nums">{v} {u}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {SLOTS.map((s) => (
              <button key={s} type="button" onClick={() => setSlot(s)} className={`rounded-xl py-2 text-xs capitalize ${slot === s ? "bg-bone text-ink" : "bg-white/5 text-bone-dim"}`}>{s}</button>
            ))}
          </div>

          <button
            className="btn-red w-full !py-3.5 text-base"
            disabled={factor <= 0}
            onClick={() => {
              onAdd(
                {
                  name: `${product.brand ? product.brand + " " : ""}${product.name} (${amountLabel})`,
                  kcal: r(n.kcal),
                  protein: r(n.protein),
                  carbs: r(n.carbs),
                  fat: r(n.fat),
                  fibre: r(n.fibre),
                  sugar: r(n.sugar),
                  sat_fat: r(n.sat_fat),
                  sodium: r(n.sodium),
                },
                slot
              );
              setPhase("done");
            }}
          >
            ✓ Log to {dayLabel}
          </button>
          <button className="w-full text-center text-xs text-bone-mute underline underline-offset-4" onClick={() => { setProduct(null); setCode(""); setPhase("scan"); }}>Wrong product? Scan again</button>
          <p className="text-center text-[10px] text-bone-mute">Product data: Open Food Facts (openfoodfacts.org)</p>
        </>
      )}
    </div>
  );
}
