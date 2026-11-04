import type { Tier } from "./tiers";

type Paid = Exclude<Tier, "free">;

export interface Region {
  id: string;
  label: string;
  flag: string;
  currency: string; // ISO, lowercase for Stripe
  locale: string;
  prices: Record<Paid, number>; // monthly, in major units
}

/**
 * Launch prices per market. Set from local purchasing power and competitor pricing
 * (not straight FX conversion) and rounded to familiar local price points.
 * AUD is the base currency in Stripe; every other currency is a currency option on the same price.
 */
export const REGIONS: Region[] = [
  { id: "AU", label: "Australia", flag: "🇦🇺", currency: "aud", locale: "en-AU", prices: { starter: 9.99, pro: 19.99, elite: 39 } },
  { id: "NZ", label: "New Zealand", flag: "🇳🇿", currency: "nzd", locale: "en-NZ", prices: { starter: 10.99, pro: 21.99, elite: 42.99 } },
  { id: "US", label: "United States", flag: "🇺🇸", currency: "usd", locale: "en-US", prices: { starter: 6.99, pro: 12.99, elite: 24.99 } },
  { id: "CA", label: "Canada", flag: "🇨🇦", currency: "cad", locale: "en-CA", prices: { starter: 8.99, pro: 17.99, elite: 34.99 } },
  { id: "GB", label: "United Kingdom", flag: "🇬🇧", currency: "gbp", locale: "en-GB", prices: { starter: 5.99, pro: 10.99, elite: 19.99 } },
  { id: "EU", label: "Europe", flag: "🇪🇺", currency: "eur", locale: "en-IE", prices: { starter: 6.99, pro: 12.99, elite: 22.99 } },
  { id: "IN", label: "India", flag: "🇮🇳", currency: "inr", locale: "en-IN", prices: { starter: 199, pro: 399, elite: 799 } },
  { id: "SG", label: "Singapore", flag: "🇸🇬", currency: "sgd", locale: "en-SG", prices: { starter: 8.99, pro: 16.99, elite: 32.99 } },
  { id: "AE", label: "UAE", flag: "🇦🇪", currency: "aed", locale: "en-AE", prices: { starter: 24.99, pro: 44.99, elite: 89 } },
  { id: "ZA", label: "South Africa", flag: "🇿🇦", currency: "zar", locale: "en-ZA", prices: { starter: 79, pro: 149, elite: 299 } },
  { id: "INTL", label: "Rest of world", flag: "🌍", currency: "usd", locale: "en-US", prices: { starter: 6.99, pro: 12.99, elite: 24.99 } },
];

export const DEFAULT_REGION = "INTL";
export const REGION_COOKIE = "fs_region";

const EURO = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"];

export function regionForCountry(country?: string | null): Region {
  const c = (country || "").toUpperCase();
  const byId = REGIONS.find((r) => r.id === c);
  if (byId) return byId;
  if (EURO.includes(c)) return REGIONS.find((r) => r.id === "EU")!;
  return REGIONS.find((r) => r.id === DEFAULT_REGION)!;
}

export function getRegion(id?: string | null): Region | null {
  return REGIONS.find((r) => r.id === id) ?? null;
}

export function formatMoney(amount: number, region: Region) {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency.toUpperCase(),
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

/** Currencies that Stripe needs and the minor-unit amount for each, per tier. */
export function stripeCurrencyOptions(tier: Paid) {
  const out: Record<string, number> = {};
  for (const r of REGIONS) out[r.currency] = Math.round(r.prices[tier] * 100);
  return out;
}

export const LOOKUP_KEY: Record<Paid, string> = {
  starter: "fitsync_starter_monthly",
  pro: "fitsync_pro_monthly",
  elite: "fitsync_elite_monthly",
};
