import { cookies, headers } from "next/headers";
import { getRegion, REGION_COOKIE, regionForCountry, type Region } from "./regions";

/** Country from hosting geo headers (Netlify / Vercel / Cloudflare), then browser language. */
export async function detectCountry(): Promise<string | null> {
  const h = await headers();
  const nf = h.get("x-nf-geo");
  if (nf) {
    try {
      const geo = JSON.parse(Buffer.from(nf, "base64").toString("utf8"));
      if (geo?.country?.code) return geo.country.code;
    } catch {
      /* ignore */
    }
  }
  const direct = h.get("x-country") || h.get("x-vercel-ip-country") || h.get("cf-ipcountry");
  if (direct && direct !== "XX") return direct;
  const lang = h.get("accept-language") || "";
  const m = lang.match(/[a-z]{2}-([A-Z]{2})/);
  return m ? m[1] : null;
}

/** The visitor's region: their saved choice first, otherwise auto-detected. */
export async function currentRegion(): Promise<{ region: Region; chosen: boolean; detected: Region }> {
  const detected = regionForCountry(await detectCountry());
  const saved = getRegion((await cookies()).get(REGION_COOKIE)?.value);
  return { region: saved ?? detected, chosen: !!saved, detected };
}
