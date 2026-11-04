import { PricingCards } from "@/components/PricingCards";
import { requireProfile } from "@/lib/session";
import { AccountActions } from "./AccountActions";

export default async function BillingPage({ searchParams }: { searchParams: { success?: string; welcome?: string; plan?: string } }) {
  const { profile, user } = await requireProfile();
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">{user.email}</p>
        <h1 className="h-display mt-1 text-4xl md:text-5xl">{searchParams.welcome ? "Unlock your plan" : "Plan & account"}</h1>
      </div>
      {searchParams.success && (
        <div className="card border-blood/50 bg-blood/10">
          <strong>You&apos;re in.</strong> <span className="text-bone-dim">Your subscription is active (including any free trial days). It can take a few seconds to show here, so refresh if it hasn&apos;t updated.</span>
        </div>
      )}
      <PricingCards current={profile.tier} mode="app" highlight={searchParams.plan} trialEligible={!(profile as { stripe_subscription_id?: string | null }).stripe_subscription_id} />
      <AccountActions hasCustomer={!!profile.stripe_customer_id} weeklyEmail={profile.weekly_email} />
    </div>
  );
}
