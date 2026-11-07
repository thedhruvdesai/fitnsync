import { headers } from "next/headers";
import { regionForCountry, type Region } from "./regions";

/** Country from the hosting network's geo headers only (Netlify / Vercel / Cloudflare). Used for prices. */
export async function detectGeoCountry(): Promise<string | null> {
  const h = await headers();
  if (process.env.DEV_GEO_COUNTRY && (process.env.NEXT_PUBLIC_SITE_URL || "").includes("localhost")) return process.env.DEV_GEO_COUNTRY;
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
  return null;
}

/** Geo headers, then browser language (only for display hints, never for prices). */
export async function detectCountry(): Promise<string | null> {
  const geo = await detectGeoCountry();
  if (geo) return geo;
  const h = await headers();
  const lang = h.get("accept-language") || "";
  const m = lang.match(/[a-z]{2}-([A-Z]{2})/);
  return m ? m[1] : null;
}

/** Prices shown to visitors: always from where they are (no manual country switch). */
export async function currentRegion(): Promise<{ region: Region; detected: Region }> {
  const detected = regionForCountry(await detectGeoCountry());
  return { region: detected, detected };
}
