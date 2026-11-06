import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}

/**
 * Fast auth check. With Supabase's asymmetric JWT signing keys, getClaims() verifies the session
 * token locally (no network round trip). On older projects it falls back to a server check.
 */
export async function getAuthUser(supabase: SupabaseClient): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase.auth.getClaims();
    const c = data?.claims;
    if (!error && c?.sub) return { id: c.sub, email: c.email as string | undefined, user_metadata: (c.user_metadata as Record<string, unknown>) ?? {} };
  } catch {
    /* fall through */
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email, user_metadata: user.user_metadata ?? {} } : null;
}
