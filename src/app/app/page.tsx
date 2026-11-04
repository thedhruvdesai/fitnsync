import { requireProfile } from "@/lib/session";
import { hasTier } from "@/lib/tiers";
import TodayView from "./TodayView";

export default async function TodayPage() {
  const { profile, user } = await requireProfile();
  return <TodayView plan={profile.plan!} name={profile.full_name ?? ""} userId={user.id} locked={!hasTier(profile.tier, "starter")} />;
}
