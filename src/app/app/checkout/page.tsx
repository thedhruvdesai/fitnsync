import { redirect } from "next/navigation";
import { currentRegion } from "@/lib/region.server";
import { requireProfile } from "@/lib/session";
import { PLANS, TRIAL_DAYS } from "@/lib/tiers";
import CheckoutView from "./CheckoutView";

export default async function CheckoutPage(props: { searchParams: Promise<{ plan?: string }> }) {
  const searchParams = await props.searchParams;
  const { profile } = await requireProfile();
  const plan = PLANS.find((p) => p.id === searchParams.plan);
  if (!plan) redirect("/app/billing");
  const { region } = await currentRegion();
  return (
    <CheckoutView
      planId={plan.id}
      planName={plan.name}
      tagline={plan.tagline}
      features={plan.features}
      regionId={region.id}
      trialDays={!profile.paddle_subscription_id ? TRIAL_DAYS : 0}
      name={profile.full_name ?? ""}
    />
  );
}
