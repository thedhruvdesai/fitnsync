/** Time-zone helpers. Users' "today" is always their local calendar date, never the server's (UTC on Netlify). */
export const TZ_COOKIE = "fs_tz";
export const DEFAULT_TZ = "Australia/Brisbane";

export function isValidTz(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** YYYY-MM-DD for `d` in the given IANA time zone. */
export function dateInTz(tz: string | null | undefined, d: Date = new Date()): string {
  const zone = isValidTz(tz) ? tz : DEFAULT_TZ;
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Local hour (0–23) and weekday (0 = Sunday) in the given zone. */
export function clockInTz(tz: string | null | undefined, d: Date = new Date()) {
  const zone = isValidTz(tz) ? tz : DEFAULT_TZ;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", hourCycle: "h23", weekday: "short" }).formatToParts(d);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.find((p) => p.type === "weekday")?.value ?? "Sun");
  return { hour, weekday: wd };
}
