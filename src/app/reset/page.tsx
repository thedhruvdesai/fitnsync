"use client";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().auth.updateUser({ password });
    if (error) return setMsg(error.message);
    window.location.href = "/app";
  }
  return (
    <AuthShell title="New password." sub="Choose something you'll remember.">
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="input" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        {msg && <p className="text-sm text-blood-400">{msg}</p>}
        <button className="btn-red w-full">Save password</button>
      </form>
    </AuthShell>
  );
}
