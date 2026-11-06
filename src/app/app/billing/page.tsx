import { PricingCards } from "@/components/PricingCards";
import { RegionPicker } from "@/components/RegionPicker";
import { currentRegion } from "@/lib/region.server";
import { requireProfile } from "@/lib/session";
import { AccountActions } from "./AccountActions";

export default async function BillingPage(props: { searchParams: Promise<{ success?: string; welcome?: string; plan?: string }> }) {
  const searchParams = await props.searchParams;
  const { profile, user } = await requireProfile();
  const { region } = await currentRegion();
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
       <div>
        <p className="eyebrow">{user.email}</p>
        <h1 className="h-display mt-1 text-4xl md:text-5xl">{searchParams.welcome ? "Unlock your plan" : "Plan & account"}</h1>
       </div>
       <RegionPicker region={region} />
      </div>
      {searchParams.success && (
        <div className="card border-blood/50 bg-blood/10">
          <strong>You&apos;re in.</strong> <span className="text-bone-dim">Your subscription is active (including any free trial days). It can take a few seconds to show here, so refresh if it hasn&apos;t updated.</span>
        </div>
      )}
      <PricingCards current={profile.tier} mode="app" highlight={searchParams.plan} trialEligible={!profile.paddle_subscription_id} region={region} />
      <AccountActions hasCustomer={!!profile.paddle_customer_id} weeklyEmail={profile.weekly_email} />
    </div>
  );
}
