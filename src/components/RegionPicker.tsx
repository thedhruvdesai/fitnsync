"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { REGIONS, REGION_COOKIE, type Region } from "@/lib/regions";

function save(id: string) {
  document.cookie = `${REGION_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/** Small country/currency switcher for the nav. */
export function RegionPicker({ region }: { region: Region }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-bone-dim hover:border-white/30" aria-label="Change country">
        <span>{region.flag}</span>
        <span className="uppercase">{region.currency}</span>
        <span className="text-[9px]">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-80 w-56 overflow-auto rounded-2xl border border-white/10 bg-ink-2/95 p-1.5 shadow-2xl backdrop-blur-xl">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                save(r.id);
                setOpen(false);
                router.refresh();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-white/5 ${r.id === region.id ? "text-bone" : "text-bone-dim"}`}
            >
              <span>{r.flag} {r.label}</span>
              <span className="text-xs uppercase text-bone-mute">{r.currency}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** First-visit prompt: "Looks like you're in India. Show prices in INR?" */
export function RegionBanner({ detected }: { detected: Region }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [picking, setPicking] = useState(false);
  if (hidden) return null;
  const choose = (id: string) => {
    save(id);
    setHidden(true);
    router.refresh();
  };
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-lg rounded-2xl border border-white/10 bg-ink-2/90 p-4 shadow-2xl backdrop-blur-xl md:bottom-6">
      {!picking ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl">{detected.flag}</span>
          <p className="flex-1 text-sm text-bone-dim">
            {detected.id === "INTL" ? "Where are you visiting from?" : <>Looks like you&apos;re in <strong className="text-bone">{detected.label}</strong>. Show prices in <strong className="text-bone">{detected.currency.toUpperCase()}</strong>?</>}
          </p>
          <div className="flex gap-2">
            {detected.id !== "INTL" && <button className="btn-red !px-4 !py-2" onClick={() => choose(detected.id)}>Yes</button>}
            <button className="btn-ghost !px-4 !py-2" onClick={() => setPicking(true)}>{detected.id === "INTL" ? "Choose country" : "Change"}</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-bone-dim">Choose your country:</p>
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-auto">
            {REGIONS.map((r) => (
              <button key={r.id} className="chip text-left !text-xs" onClick={() => choose(r.id)}>{r.flag} {r.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
