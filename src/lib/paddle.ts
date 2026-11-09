import crypto from "crypto";
import { EURO_COUNTRIES, REGIONS } from "./regions";
import type { Tier } from "./tiers";

/**
 * Minimal Paddle Billing (v2) client.
 * Paddle is the merchant of record: it charges customers, and collects and pays sales tax / VAT / GST worldwide.
 */
export type Paid = Exclude<Tier, "free">;

const isSandbox = () => (process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox") !== "production";
const base = () => (isSandbox() ? "https://sandbox-api.paddle.com" : "https://api.paddle.com");

export async function paddle<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY is missing");
  const res = await fetch(base() + path, {
    method: init.method || "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.error?.detail || json?.error?.code || res.statusText;
    throw new Error(`Paddle ${res.status}: ${detail}`);
  }
  return json as T;
}

interface PaddlePrice {
  id: string;
  status: string;
  custom_data?: Record<string, string> | null;
  unit_price: { amount: string; currency_code: string };
}

const toMinor = (n: number) => String(Math.round(n * 100));

/** Unit price + per-country overrides for one tier, built from src/lib/regions.ts. Base price = rest of world (USD). */
export function priceSpec(tier: Paid) {
  const intl = REGIONS.find((r) => r.id === "INTL")!;
  const unit_price = { amount: toMinor(intl.prices[tier]), currency_code: intl.currency.toUpperCase() };
  const unit_price_overrides = REGIONS.filter((r) => r.id !== "INTL" && !(r.currency === intl.currency && r.prices[tier] === intl.prices[tier])).map((r) => ({
    country_codes: r.id === "EU" ? EURO_COUNTRIES : [r.id],
    unit_price: { amount: toMinor(r.prices[tier]), currency_code: r.currency.toUpperCase() },
  }));
  return { unit_price, unit_price_overrides };
}

/** Find the active PlateLift price for a tier (env override first, then by custom_data set during setup). */
export async function findPriceId(tier: Paid): Promise<string | null> {
  const env = { starter: process.env.PADDLE_PRICE_STARTER, pro: process.env.PADDLE_PRICE_PRO, elite: process.env.PADDLE_PRICE_ELITE }[tier];
  if (env) return env;
  const all = await listFitsyncPrices();
  return all.find((p) => p.custom_data?.fitsync_tier === tier)?.id ?? null;
}

export async function listFitsyncPrices() {
  const res = await paddle<{ data: PaddlePrice[] }>("/prices?status=active&per_page=200");
  return res.data.filter((p) => p.custom_data?.fitsync_tier);
}

export function tierFromPrice(price?: { id?: string; custom_data?: Record<string, string> | null } | null): Tier {
  const t = price?.custom_data?.fitsync_tier;
  if (t === "starter" || t === "pro" || t === "elite") return t;
  if (price?.id && price.id === process.env.PADDLE_PRICE_ELITE) return "elite";
  if (price?.id && price.id === process.env.PADDLE_PRICE_PRO) return "pro";
  if (price?.id && price.id === process.env.PADDLE_PRICE_STARTER) return "starter";
  return "free";
}

/** Verify the Paddle-Signature header: "ts=...;h1=..." where h1 = HMAC-SHA256(secret, `${ts}:${rawBody}`). */
export function verifyWebhook(rawBody: string, header: string | null, secret: string | undefined) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(";").map((kv) => kv.split("=") as [string, string]));
  const ts = parts.ts;
  const sigs = header
    .split(";")
    .filter((kv) => kv.startsWith("h1="))
    .map((kv) => kv.slice(3));
  if (!ts || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 60 * 5) return false; // replay protection
  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export const ACTIVE_STATUSES = ["active", "trialing", "past_due"];
