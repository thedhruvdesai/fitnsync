"use client";
import { useEffect, useState } from "react";
import type { Region } from "@/lib/regions";

const KEY = "fs_loc_seen";

/** First-visit note: "Looks like you're in Australia. Prices are in AUD." Information only, no country switch. */
export function LocationBanner({ region }: { region: Region }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== region.id) setShow(true);
    } catch {
      setShow(true);
    }
  }, [region.id]);
  if (!show) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, region.id);
    } catch {
      /* ignore */
    }
    setShow(false);
  };
  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-white/10 bg-ink-2/90 p-4 shadow-2xl backdrop-blur-xl md:bottom-6">
      <span className="text-2xl" aria-hidden>{region.flag}</span>
      <p className="flex-1 text-sm text-bone-dim">
        {region.id === "INTL" ? (
          <>Prices are shown in <strong className="text-bone">USD</strong> for your location.</>
        ) : (
          <>Looks like you&apos;re in <strong className="text-bone">{region.label}</strong>. Prices are in <strong className="text-bone">{region.currency.toUpperCase()}</strong>, based on your location.</>
        )}
      </p>
      <button className="btn-red !px-4 !py-2 text-sm" onClick={close}>OK</button>
    </div>
  );
}
