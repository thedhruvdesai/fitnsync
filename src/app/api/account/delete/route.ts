import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ACTIVE_STATUSES, paddle } from "@/lib/paddle";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * Permanently delete the signed-in user's account: cancel any active subscription immediately,
 * remove progress photos, then delete the auth user (all tables cascade on auth.users).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== "DELETE") return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("paddle_subscription_id, subscription_status").eq("id", user.id).single();

  if (profile?.paddle_subscription_id && ACTIVE_STATUSES.includes(profile.subscription_status ?? "")) {
    try {
      await paddle(`/subscriptions/${profile.paddle_subscription_id}/cancel`, { method: "POST", body: { effective_from: "immediately" } });
    } catch (e) {
      return NextResponse.json({ error: `Couldn't cancel your subscription automatically (${(e as Error).message}). Cancel it under "Manage subscription" first, then try again.` }, { status: 502 });
    }
  }

  // progress photos live in storage under <user-id>/
  try {
    const { data: files } = await admin.storage.from("progress-photos").list(user.id, { limit: 1000 });
    if (files?.length) await admin.storage.from("progress-photos").remove(files.map((f) => `${user.id}/${f.name}`));
  } catch {
    /* bucket may not exist */
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.auth.signOut().catch(() => {});
  return NextResponse.json({ ok: true });
}
