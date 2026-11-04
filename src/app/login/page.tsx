"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    router.push(params.get("next") || "/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-blood-400">{error}</p>}
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
