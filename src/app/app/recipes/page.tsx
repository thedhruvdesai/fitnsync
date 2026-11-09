import { requireProfile } from "@/lib/session";
import { userToday } from "@/lib/tz.server";
import { RecipesView } from "./RecipesView";

export const metadata = { title: "Recipes · PlateLift" };

export default async function RecipesPage(props: { searchParams: Promise<{ r?: string; tab?: string }> }) {
  const searchParams = await props.searchParams;
  const { profile, user } = await requireProfile();
  return <RecipesView diet={profile.diet ?? "non_veg"} userId={user.id} today={await userToday(profile.timezone)} open={searchParams.r} initialTab={searchParams.tab} />;
}
