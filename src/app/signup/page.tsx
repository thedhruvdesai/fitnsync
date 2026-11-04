"use client";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    setBusy(true);
    setError(null);
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: `${site}/auth/callback?next=/onboarding` },
    });
    setBusy(false);
    if (error) return setError(error.message);
    if (data.session) window.location.href = "/onboarding";
    else setSent(true);
  }

  if (sent)
    return (
      <AuthShell title="Check your inbox." sub={`We sent a confirmation link to ${email}. Tap it to start building your plan.`}>
        <Link href="/login" className="btn-ghost">Back to sign in</Link>
      </AuthShell>
    );

  return (
    <AuthShell title="Start your plan." sub="Two minutes of questions, then a plan built around you.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">First name</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <label className="flex items-start gap-3 text-sm text-bone-dim">
          <input type="checkbox" className="mt-1 accent-[#E11D2E]" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
          <span>
            I agree to the <Link href="/terms" className="underline">Terms</Link> and understand Fit&amp;Sync gives general fitness guidance, not medical advice.
          </span>
        </label>
        {error && <p className="text-sm text-blood-400">{error}</p>}
        <button className="btn-red w-full" disabled={busy || !agree}>{busy ? "Creating account…" : "Create account"}</button>
        <p className="text-center text-sm text-bone-dim">
          Already a member? <Link href="/login" className="text-bone hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
