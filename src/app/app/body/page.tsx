import { userToday } from "@/lib/tz.server";
import { requireProfile } from "@/lib/session";
import { BodyView, type Checkin } from "./BodyView";

export const metadata = { title: "Body · PlateLift" };

export default async function BodyPage() {
  const { profile, user, supabase } = await requireProfile();
  const { data, error } = await supabase.from("body_checkins").select("*").order("checkin_date", { ascending: false }).limit(200);
  return <BodyView userId={user.id} initial={(data ?? []) as Checkin[]} setupNeeded={!!error} goalWeight={profile.goal_weight_kg ?? null} today={await userToday(profile.timezone)} />;
}
