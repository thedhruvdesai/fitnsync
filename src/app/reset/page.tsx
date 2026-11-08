"use client";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";

export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().auth.updateUser({ password });
    if (error) return setMsg(error.message.toLowerCase().includes("session") ? "This reset link has expired. Request a new one from Forgot password." : error.message);
    window.location.assign("/app");
  }
  return (
    <AuthShell title="New password." sub="Choose something you'll remember.">
      <form onSubmit={onSubmit} className="space-y-4">
        <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" minLength={8} ariaLabel="New password" />
        {msg && <p className="text-sm text-blood-400">{msg}</p>}
        <button className="btn-red w-full">Save password</button>
      </form>
    </AuthShell>
  );
}
