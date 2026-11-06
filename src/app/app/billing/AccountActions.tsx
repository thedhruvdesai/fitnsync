"use client";
import { useState } from "react";

export function AccountActions({ hasCustomer, weeklyEmail }: { hasCustomer: boolean; weeklyEmail: boolean }) {
  const [email, setEmail] = useState(weeklyEmail);
  const [del, setDel] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function deleteAccount() {
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) window.location.href = "/?deleted=1";
    else {
      setErr(j.error || "Couldn't delete your account");
      setBusy(false);
    }
  }
  async function portal() {
    const res = await fetch("/api/paddle/portal", { method: "POST" });
    const j = await res.json();
    if (j.url) window.location.href = j.url;
  }
  async function toggle() {
    const v = !email;
    setEmail(v);
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekly_email: v }) });
  }
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold">Weekly email</div>
          <div className="text-sm text-bone-dim">Monday summary of your week and what to focus on</div>
        </div>
        <button onClick={toggle} className={`relative h-7 w-12 rounded-full transition ${email ? "bg-blood" : "bg-ink-4"}`} aria-label="Toggle weekly email">
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${email ? "left-6" : "left-1"}`} />
        </button>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-white/5 pt-4">
        {hasCustomer && <button className="btn-ghost !py-2" onClick={portal}>Manage subscription &amp; invoices</button>}
        <a href="/onboarding" className="btn-ghost !py-2">Update my details</a>
        <form action="/auth/signout" method="post"><button className="btn-ghost !py-2">Sign out</button></form>
      </div>
      <div className="border-t border-white/5 pt-4">
        <div className="font-semibold">Your data</div>
        <p className="text-sm text-bone-dim">Download a copy of everything you&apos;ve logged, or delete your account for good.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="/api/account/export" className="btn-ghost !py-2">⬇ Download my data</a>
          <button className="btn-ghost !py-2 !text-blood-400" onClick={() => setDel(!del)}>Delete account</button>
        </div>
        {del && (
          <div className="mt-4 rounded-2xl border border-blood/40 bg-blood/10 p-4 text-sm">
            <p className="font-semibold">This permanently deletes your account.</p>
            <p className="mt-1 text-bone-dim">Your plan, logs, coach feedback, body check-ins and progress photos are erased and can&apos;t be recovered. Any active subscription is cancelled immediately.</p>
            <label className="mt-3 block text-xs text-bone-mute">Type <strong className="text-bone">DELETE</strong> to confirm</label>
            <input className="input mt-1 !py-2" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoCapitalize="characters" />
            {err && <p className="mt-2 text-blood-400">{err}</p>}
            <button className="btn-red mt-3 w-full !py-2.5" disabled={confirm !== "DELETE" || busy} onClick={deleteAccount}>{busy ? "Deleting…" : "Permanently delete my account"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
