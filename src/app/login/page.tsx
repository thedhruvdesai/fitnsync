"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { friendlyAuthError, supabaseConfigured } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.get("error"));
  const [info, setInfo] = useState<string | null>(params.get("confirmed") ? "Email confirmed. Sign in to continue." : null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!supabaseConfigured())
    return <p className="rounded-xl border border-blood/40 bg-blood/10 p-4 text-sm">Login isn&apos;t connected yet: <code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are missing. Add them in Netlify → Environment variables, then <strong>redeploy</strong>.</p>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    setUnconfirmed(false);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) {
        setUnconfirmed(error.message.toLowerCase().includes("not confirmed"));
        setError(friendlyAuthError(error.message));
        setBusy(false);
        return;
      }
      const next = params.get("next");
      // full reload so the server/middleware picks up the new session cookie
      window.location.assign(next && next.startsWith("/") ? next : "/app");
    } catch (err) {
      setError(friendlyAuthError((err as Error).message));
      setBusy(false);
    }
  }

  async function resend() {
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await createClient().auth.resend({ type: "signup", email: email.trim().toLowerCase(), options: { emailRedirectTo: `${site}/auth/callback?next=/onboarding` } });
    if (error) setError(friendlyAuthError(error.message));
    else {
      setError(null);
      setInfo("Confirmation email sent again. Check your inbox and spam.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {info && <p className="rounded-xl border border-white/10 bg-ink-2 p-3 text-sm text-bone">{info}</p>}
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" />
      </div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-blood-400">{error}</p>}
      {unconfirmed && <button type="button" onClick={resend} className="text-sm text-bone underline">Resend confirmation email</button>}
      <button className="btn-red w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <div className="flex justify-between text-sm text-bone-dim">
        <Link href="/forgot" className="hover:text-bone">Forgot password?</Link>
        <Link href="/signup" className="hover:text-bone">Create account →</Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back." sub="Sign in to log today and see your plan.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
