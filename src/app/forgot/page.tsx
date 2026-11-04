"use client";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    await createClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${site}/auth/callback?next=/reset` });
    setDone(true);
  }
  return (
    <AuthShell title="Reset password." sub={done ? "If that email has an account, a reset link is on its way." : "We'll email you a secure link."}>
      {!done && (
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="input" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-red w-full">Send reset link</button>
        </form>
      )}
    </AuthShell>
  );
}
