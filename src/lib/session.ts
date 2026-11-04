import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export async function requireProfile(opts: { onboarded?: boolean } = { onboarded: true }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as Profile | null;
  if (!profile) redirect("/login");
  if (opts.onboarded && (!profile.onboarded || !profile.plan)) redirect("/onboarding");
  return { supabase, user, profile };
}
