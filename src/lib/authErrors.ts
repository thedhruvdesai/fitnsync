export function friendlyAuthError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox (and spam).";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Can't reach the login server. Check your connection, or the site's Supabase settings.";
  if (m.includes("password") && m.includes("6")) return "Password is too short.";
  return msg;
}

export function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes("YOUR-PROJECT") && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
