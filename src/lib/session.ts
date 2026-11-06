import { cache } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "./auth";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** One auth check + one profile query per request, shared by the layout and the page. */
const loadSession = cache(async () => {
  const supabase = createClient();
  const user = await getAuthUser(supabase);
  if (!user) return { supabase, user: null, profile: null };
  let { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data) {
    // Profile row missing (e.g. user signed up before the schema trigger existed): create it
    // instead of bouncing to /login, which would loop because middleware sends signed-in users to /app.
    await supabase.from("profiles").insert({ id: user.id, email: user.email, full_name: (user.user_metadata?.full_name as string) ?? "" });
    ({ data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle());
  }
  return { supabase, user, profile: data as Profile | null };
});

export async function requireProfile(opts: { onboarded?: boolean } = { onboarded: true }) {
  const { supabase, user, profile } = await loadSession();
  if (!user) redirect("/login");
  if (!profile) throw new Error("Couldn't load your profile. Check that supabase/schema.sql has been run.");
  if (opts.onboarded && (!profile.onboarded || !profile.plan)) redirect("/onboarding");
  return { supabase, user, profile };
}
