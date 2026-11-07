import { PricingCards } from "@/components/PricingCards";
import { PhoneVerify } from "@/components/PhoneVerify";
import { paymentRegion } from "@/lib/pay-region.server";
import { requireProfile } from "@/lib/session";
import { AccountActions } from "./AccountActions";

export default async function BillingPage(props: { searchParams: Promise<{ success?: string; welcome?: string; plan?: string }> }) {
  const searchParams = await props.searchParams;
  const { profile, user } = await requireProfile();
  const pay = await paymentRegion(user.id);
  const { region } = pay;
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
       <div>
        <p className="eyebrow">{user.email}</p>
        <h1 className="h-display mt-1 text-4xl md:text-5xl">{searchParams.welcome ? "Unlock your plan" : "Plan & account"}</h1>
       </div>
       <span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase text-bone-dim">{region.flag} {region.currency}</span>
      </div>
      <PhoneVerify needed={pay.needPhone} phone={pay.phone} note={pay.note} plan={searchParams.plan} />
      {profile.subscription_status === "canceled_country_mismatch" && (
        <div className="card border-blood/50 bg-blood/10 text-sm">
          <strong>Subscription cancelled.</strong> <span className="text-bone-dim">The billing country entered at checkout didn&apos;t match where you are, so it was cancelled and nothing was charged during the free trial. Subscribe again using your own country.</span>
        </div>
      )}
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
