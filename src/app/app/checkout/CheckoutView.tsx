"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Counter } from "@/components/Motion";
import { closeCheckout, onPaddleEvent, openInlineCheckout } from "@/lib/paddle-client";
import { formatMoney, getRegion } from "@/lib/regions";

const FRAME = "platelift-checkout";

function money(amount: unknown, currency?: string) {
  const n = Number(amount);
  if (!Number.isFinite(n) || !currency) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

const Icon = {
  lock: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z",
  undo: "M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z",
};
const Svg = ({ d, className = "h-4 w-4" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d={d} />
  </svg>
);

function Steps({ at }: { at: 1 | 2 | 3 }) {
  const items = ["Plan", "Payment", "Start"];
  return (
    <ol className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < at;
        const active = n === at;
        return (
          <li key={label} className="flex items-center gap-2">
            <span className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] transition ${done ? "border-blood bg-blood text-white" : active ? "step-dot-active border-blood text-bone" : "border-white/15 text-bone-mute"}`}>
              {done ? "✓" : n}
            </span>
            <span className={active || done ? "text-bone" : "text-bone-mute"}>{label}</span>
            {i < items.length - 1 && <span className={`mx-1 h-px w-6 md:w-12 ${done ? "bg-blood" : "bg-white/15"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export function Success({ name, planName }: { name: string; planName: string }) {
  const bits = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const d = 90 + (i % 3) * 40;
    return { x: `${Math.cos(a) * d}px`, y: `${Math.sin(a) * d}px`, r: `${i * 47}deg`, c: i % 3 === 0 ? "#F4F1EC" : i % 3 === 1 ? "#E11D2E" : "#FF3B4C" };
  });
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center">
      <div className="burst relative h-28 w-28">
        {bits.map((b, i) => (
          <span key={i} style={{ "--x": b.x, "--y": b.y, "--r": b.r, background: b.c } as React.CSSProperties} />
        ))}
        <svg viewBox="0 0 104 104" className="h-28 w-28 drop-shadow-[0_0_30px_rgba(225,29,46,0.6)]">
          <circle className="check-ring" cx="52" cy="52" r="48" fill="none" stroke="#E11D2E" strokeWidth="4" />
          <path className="check-tick" d="M32 54 L46 68 L73 38" fill="none" stroke="#F4F1EC" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="eyebrow fade-up mt-10" style={{ animationDelay: "1s" }}>Welcome to {planName}</p>
      <h1 className="h-display fade-up mt-3 text-5xl md:text-6xl" style={{ animationDelay: "1.1s" }}>
        You&apos;re in{name ? `, ${name}` : ""}.
      </h1>
      <p className="fade-up mt-4 text-bone-dim" style={{ animationDelay: "1.25s" }}>Unlocking your features now. Taking you to your account…</p>
      <div className="fade-up mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/10" style={{ animationDelay: "1.3s" }}>
        <div className="h-full origin-left animate-[grow_3s_linear_forwards] bg-blood" style={{ animation: "grow 3.2s linear 1.3s forwards", transform: "scaleX(0)" }} />
      </div>
      <style>{`@keyframes grow { to { transform: scaleX(1); } }`}</style>
    </div>
  );
}

export default function CheckoutView(props: {
  planId: "starter" | "pro" | "elite";
  planName: string;
  tagline: string;
  features: string[];
  regionId: string;
  trialDays: number;
  name: string;
}) {
  const region = getRegion(props.regionId)!;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const [recurring, setRecurring] = useState<string>(formatMoney(region.prices[props.planId], region));
  const [tax, setTax] = useState<string | null>(null);
  const started = useRef(false);
  const expectedCountry = useRef<string | null>(null);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const off = onPaddleEvent((e) => {
      const d = e.data;
      if (e.name === "checkout.loaded" || e.name === "checkout.updated") {
        setLoaded(true);
        const cur = d?.currency_code;
        const t = money(d?.totals?.total, cur);
        const r = money(d?.recurring_totals?.total ?? d?.items?.[0]?.recurring_totals?.total, cur);
        const taxN = Number(d?.recurring_totals?.tax ?? d?.totals?.tax);
        if (t) setToday(t);
        if (r) setRecurring(r);
        if (taxN > 0) setTax(money(taxN, cur));
        const cc = d?.customer?.address?.country_code;
        if (expectedCountry.current && cc && cc !== expectedCountry.current) {
          setNotice(`Please keep your billing country as ${expectedCountry.current}. Prices follow where you live, and a subscription with a different country is cancelled automatically.`);
        }
      }
      if (e.name === "checkout.completed") {
        setDone(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => window.location.assign("/app/billing?success=1"), 4600);
      }
      // Recoverable problems (e.g. an invalid discount code) arrive as checkout.error/warning while the
      // form stays usable, so show a small notice and keep the form instead of replacing it.
      if (e.name === "checkout.error" || e.name === "checkout.warning") {
        const err = (e as { error?: { detail?: string; errors?: { message?: string }[] } }).error;
        const msg = err?.errors?.[0]?.message || err?.detail || "Please check your details and try again.";
        console.warn("Paddle checkout", e);
        setNotice(msg);
        if (!loaded) setLoaded(true);
      }
    });
    if (!started.current) {
      started.current = true;
      fetch("/api/paddle/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier: props.planId }) })
        .then((r) => r.json())
        .then((j) => {
          if (j.switched) return window.location.assign("/app/billing?success=1");
          if (j.needPhone) return window.location.assign(`/app/billing?plan=${props.planId}&verify=1`);
          if (!j.checkout) throw new Error(j.error || "Couldn't start checkout");
          expectedCountry.current = j.checkout.countryCode ?? null;
          return openInlineCheckout(j.checkout, FRAME);
        })
        .catch((e) => setError((e as Error).message));
    }
    return () => {
      off();
    };
  }, [props.planId, props.regionId]);

  useEffect(() => () => closeCheckout(), []);

  // 3D tilt on the plan card (desktop pointers only)
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !card.current) return;
    const r = card.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.current.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  };
  const onLeave = () => card.current && (card.current.style.transform = "");

  if (done) return <Success name={props.name} planName={props.planName} />;

  const trial = props.trialDays > 0;
  const firstCharge = new Date(Date.now() + props.trialDays * 864e5).toLocaleDateString("en-AU", { day: "numeric", month: "long" });
  const priceNum = region.prices[props.planId];

  return (
    <div className="relative mx-auto max-w-6xl">
      {/* giant outlined watermark */}
      <div aria-hidden className="h-display text-outline pointer-events-none absolute -top-6 right-0 select-none text-[22vw] uppercase leading-none opacity-[0.12] lg:text-[200px]">
        {props.planName}
      </div>

      <div className="fade-up relative flex flex-wrap items-center justify-between gap-4">
        <Link href="/app/billing" className="group flex items-center gap-2 text-sm text-bone-dim hover:text-bone">
          <span className="transition group-hover:-translate-x-1">←</span> Back to plans
        </Link>
        <Steps at={2} />
      </div>

      <div className="relative mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        {/* plan summary */}
        <section onPointerMove={onMove} onPointerLeave={onLeave} className="fade-up" style={{ animationDelay: "120ms" }}>
          <div ref={card} className="tilt-3d glow-border sheen h-full rounded-[28px] bg-gradient-to-br from-blood/25 via-ink-2/90 to-ink-2/90 p-7 backdrop-blur-md md:p-9">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blood/30 blur-3xl" />
            <div className="pop relative">
              <p className="eyebrow">PlateLift {props.planName}</p>
              <h1 className="h-display mt-3 text-4xl leading-[0.92] md:text-[54px]">{props.tagline}</h1>

              <div className="mt-8 flex items-end gap-2">
                <span className="h-display text-6xl md:text-7xl">
                  {Number.isInteger(priceNum) ? <Counter to={priceNum} prefix={formatMoney(0, region).replace(/[\d.,\s]/g, "")} duration={1200} /> : formatMoney(priceNum, region)}
                </span>
                <span className="mb-2 text-bone-dim">/ month</span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-ink/70 p-5">
                {trial ? (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-bone-dim">Due today</span>
                      <span className="h-display text-3xl text-blood-400">{today ?? formatMoney(0, region)}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between text-sm">
                      <span className="text-bone-dim">From {firstCharge}</span>
                      <span className="font-semibold">{recurring} / month</span>
                    </div>
                    {/* trial timeline */}
                    <div className="mt-5">
                      <div className="relative h-1.5 rounded-full bg-white/10">
                        <div className="absolute inset-y-0 left-0 w-[72%] origin-left rounded-full bg-gradient-to-r from-blood to-blood-400" style={{ animation: "growx 1.4s cubic-bezier(.2,.8,.1,1) .6s both" }} />
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] uppercase tracking-widest text-bone-mute">
                        <span>Today · free</span>
                        <span>Day {props.trialDays} · first charge</span>
                      </div>
                    </div>
                    <style>{`@keyframes growx { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
                  </>
                ) : (
                  <div className="flex items-baseline justify-between">
                    <span className="text-bone-dim">Due today</span>
                    <span className="h-display text-3xl">{today ?? recurring}</span>
                  </div>
                )}
                {tax && <p className="mt-3 text-xs text-bone-mute">Includes {tax} tax</p>}
              </div>

              <ul className="stagger mt-7 space-y-2.5 text-sm">
                {props.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-blood/20 text-[9px] text-blood-400">✓</span>
                    <span className="text-bone-dim">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider text-bone-dim">
                {[
                  [Icon.lock, "Secure"],
                  [Icon.undo, "Cancel anytime"],
                  [Icon.globe, "Tax included"],
                ].map(([d, l]) => (
                  <div key={l} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-ink/40 px-2 py-3 transition hover:border-blood/50 hover:text-bone">
                    <Svg d={d} className="h-5 w-5 text-blood-400" />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* payment */}
        <section className="fade-up" style={{ animationDelay: "240ms" }}>
          <div className="glow-border h-full rounded-[28px] bg-ink-2/90 p-5 backdrop-blur-md md:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow">Step 2 of 3</p>
                <h2 className="h-display mt-1 text-3xl">Payment details</h2>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-bone-dim">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" /> Encrypted
              </span>
            </div>

            {error ? (
              <div className="rounded-2xl border border-blood/40 bg-blood/10 p-5 text-sm">
                <p className="text-bone">{error}</p>
                <button className="btn-red mt-4 !py-2" onClick={() => window.location.reload()}>Try again</button>
              </div>
            ) : (
              <>
                {!loaded && (
                  <div className="space-y-3" aria-label="Loading payment form">
                    {["Card number", "Name on card", "Expiry · CVC", "Country"].map((l, i) => (
                      <div key={l} className="sheen relative h-14 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2" style={{ animationDelay: `${i * 120}ms` }}>
                        <div className="text-[10px] uppercase tracking-widest text-bone-mute">{l}</div>
                        <div className="mt-2 h-2 w-1/3 rounded bg-white/10" />
                      </div>
                    ))}
                    <div className="sheen h-14 rounded-full bg-blood/40" />
                    <p className="pt-1 text-center text-xs text-bone-mute">Loading secure payment form…</p>
                  </div>
                )}
                {notice && (
                  <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-bone">
                    <span>{notice}</span>
                    <button className="text-bone-mute hover:text-bone" onClick={() => setNotice(null)} aria-label="Dismiss">✕</button>
                  </div>
                )}
                <div className={`${FRAME} transition-opacity duration-700 ${loaded ? "opacity-100" : "h-0 overflow-hidden opacity-0"}`} />
              </>
            )}

            <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-5 text-[11px] leading-relaxed text-bone-mute">
              <Svg d={Icon.lock} className="h-4 w-4 shrink-0" />
              <p>Payments are processed by Paddle.com, our merchant of record, which handles billing, tax and receipts. Cancel anytime from your account.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
