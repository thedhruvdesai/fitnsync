"use client";
import { useState } from "react";

export function AccountActions({ hasCustomer, weeklyEmail }: { hasCustomer: boolean; weeklyEmail: boolean }) {
  const [email, setEmail] = useState(weeklyEmail);
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
    </div>
  );
}
