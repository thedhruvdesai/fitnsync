import { cookies } from "next/headers";
import { dateInTz, isValidTz, TZ_COOKIE } from "./tz";

/** The user's time zone: this device's (cookie) first, then their saved profile zone. */
export async function userTimeZone(profileTz?: string | null): Promise<string | null> {
  const c = (await cookies()).get(TZ_COOKIE)?.value;
  const fromCookie = c ? decodeURIComponent(c) : null;
  if (isValidTz(fromCookie)) return fromCookie;
  return isValidTz(profileTz) ? profileTz : null;
}

/** Today's date (YYYY-MM-DD) where the user is. */
export async function userToday(profileTz?: string | null): Promise<string> {
  return dateInTz(await userTimeZone(profileTz));
}
