import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export async function requireProfile(opts: { onboarded?: boolean } = { onboarded: true }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  let { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data) {
    // Profile row missing (e.g. user signed up before the schema trigger existed): create it
    // instead of bouncing to /login, which would loop because middleware sends signed-in users to /app.
    await supabase.from("profiles").insert({ id: user.id, email: user.email, full_name: (user.user_metadata?.full_name as string) ?? "" });
    ({ data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle());
  }
  const profile = data as Profile | null;
  if (!profile) throw new Error("Couldn't load your profile. Check that supabase/schema.sql has been run.");
  if (opts.onboarded && (!profile.onboarded || !profile.plan)) redirect("/onboarding");
  return { supabase, user, profile };
}
