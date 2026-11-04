import Stripe from "stripe";

let _stripe: Stripe | null = null;
export function stripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

import { LOOKUP_KEY } from "./regions";
import { priceIdFor, type Tier } from "./tiers";

/** Price for a tier: explicit env price ID if set, otherwise the price created by /api/admin/stripe-setup. */
export async function resolvePrice(tier: Exclude<Tier, "free">) {
  const envId = priceIdFor(tier);
  if (envId) return envId;
  const list = await stripe().prices.list({ lookup_keys: [LOOKUP_KEY[tier]], active: true, limit: 1 });
  return list.data[0]?.id;
}
