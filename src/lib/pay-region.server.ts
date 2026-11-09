import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { detectGeoCountry } from "./region.server";
import { DEFAULT_REGION, getRegion, regionForCountry, type Region } from "./regions";
import { createAdminClient } from "./supabase/server";

/** Mobile verification is OFF for now. Set NEXT_PUBLIC_PHONE_VERIFY=1 to switch it on (needs an SMS provider such as Twilio in Supabase → Auth → Phone). */
export const phoneVerifyRequired = () => process.env.NEXT_PUBLIC_PHONE_VERIFY === "1";

/** Rough USD value of one unit of each currency. Only used to tell which of two prices is higher. */
const USD: Record<string, number> = { usd: 1, aud: 0.65, nzd: 0.6, cad: 0.73, gbp: 1.27, eur: 1.08, inr: 0.012, sgd: 0.75, zar: 0.055 };
const usdValue = (r: Region) => r.prices.pro * (USD[r.currency] ?? 1);
export const pricier = (a: Region, b: Region) => (usdValue(a) >= usdValue(b) ? a : b);

export function phoneCountry(phone?: string | null): string | null {
  if (!phone) return null;
  const p = parsePhoneNumberFromString(phone.startsWith("+") ? phone : `+${phone}`);
  return p?.country ?? null;
}

export interface PayRegion {
  region: Region;
  /** Two-letter country sent to Paddle as the billing country (Paddle prices by this). */
  country: string | null;
  /** Country from the network location (null when it can't be told). */
  locationCountry: string | null;
  /** Country of the verified mobile number (null when none is verified). */
  phoneCountry: string | null;
  phone: string | null;
  needPhone: boolean;
  /** Short explanation shown next to the prices. */
  note: string;
}

/**
 * The only place that decides what a signed-in user pays.
 * - Price follows where the person is (network location), never a country they pick.
 * - With phone verification on, a verified mobile number is required too. If the number's country and the
 *   location agree, that country's price applies; if they differ (travel, VPN), the higher of the two applies.
 */
export async function paymentRegion(userId: string): Promise<PayRegion> {
  const locationCountry = await detectGeoCountry();
  const location = locationCountry ? regionForCountry(locationCountry) : null;

  let phone: string | null = null;
  let pc: string | null = null;
  try {
    const { data } = await createAdminClient().auth.admin.getUserById(userId);
    if (data.user?.phone && data.user.phone_confirmed_at) {
      phone = data.user.phone;
      pc = phoneCountry(phone);
    }
  } catch {
    /* no phone */
  }
  const fromPhone = pc ? regionForCountry(pc) : null;
  const fallback = getRegion(DEFAULT_REGION)!;
  const where = (r: Region) => `${r.flag} ${r.label}`;

  if (phoneVerifyRequired() && !fromPhone) {
    const region = location ?? fallback;
    return { region, country: locationCountry, locationCountry, phoneCountry: null, phone: null, needPhone: true, note: `Prices for ${where(region)}, based on your location. Verify your mobile number to subscribe.` };
  }
  if (fromPhone && location && fromPhone.id !== location.id) {
    const region = pricier(fromPhone, location);
    return { region, country: region === fromPhone ? pc : locationCountry, locationCountry, phoneCountry: pc, phone, needPhone: false, note: `Your number is from ${where(fromPhone)} but you're in ${where(location)}, so ${where(region)} prices apply.` };
  }
  const region = fromPhone ?? location ?? fallback;
  return {
    region,
    country: fromPhone ? pc : locationCountry,
    locationCountry,
    phoneCountry: pc,
    phone,
    needPhone: false,
    note: fromPhone ? `Prices for ${where(region)}, matched to your location and verified number.` : `Prices for ${where(region)}, based on your location.`,
  };
}
