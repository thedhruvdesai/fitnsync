"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AskCoach({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(j.error);
    setQ("");
    router.refresh();
  }
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="h-display text-xl">Request a check-in</h2>
        <span className="text-xs text-bone-mute">{remaining} left this month</span>
      </div>
      <textarea className="input mt-3 min-h-[90px]" placeholder="Ask anything, e.g. 'Weight's stuck for 2 weeks, what should I change?' or leave blank for a full review of your last 7 days." value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <p className="mt-2 text-sm text-blood-400">{err}</p>}
      <button className="btn-red mt-3" disabled={busy || remaining <= 0} onClick={go}>{busy ? "Coach is reviewing your week…" : "Get feedback"}</button>
    </div>
  );
}
