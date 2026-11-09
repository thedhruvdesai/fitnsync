export type Tier = "free" | "starter" | "pro" | "elite";

/** Free trial for first-time subscribers (set to 0 to turn off). */
export const TRIAL_DAYS = 7;

export const fmtPrice = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

export const TIER_RANK: Record<Tier, number> = { free: 0, starter: 1, pro: 2, elite: 3 };

export const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 9.99,
    tagline: "Your plan, built around you.",
    features: [
      "Personal calorie, protein & macro targets",
      "Weekly meal plan for your diet",
      "Training program for your goal & equipment",
      "Daily food, workout, water & weight logging",
      "Progress charts & streaks",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 19.99,
    tagline: "Reports that show what's working.",
    highlight: true,
    features: [
      "Everything in Starter",
      "Weekly progress report emailed every Monday",
      "Full reports: adherence, trends & PR tracking",
      "Downloadable / printable PDF reports",
      "Monthly plan refresh as your body changes",
    ],
  },
  {
    id: "elite" as const,
    name: "Elite",
    price: 39,
    tagline: "A coach in your corner every week.",
    features: [
      "Everything in Pro",
      "Weekly in-depth review from PlateLift Coach (AI)",
      "On-demand check-ins: up to 8 a month",
      "Specific fixes for food, training, sleep & recovery",
      "Plan adjustments written for your week",
    ],
  },
];

export function hasTier(userTier: string | null | undefined, needed: Tier) {
  return TIER_RANK[(userTier as Tier) ?? "free"] >= TIER_RANK[needed];
}
