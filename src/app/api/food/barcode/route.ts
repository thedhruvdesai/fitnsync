import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Barcode → product nutrition via Open Food Facts (free, open database, ODbL).
 * Called server-side so we can send a proper User-Agent as their API asks.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const code = new URL(req.url).searchParams.get("code")?.replace(/\D/g, "") ?? "";
  if (code.length < 6 || code.length > 14) return NextResponse.json({ error: "That doesn't look like a barcode number." }, { status: 400 });

  const fields = "product_name,product_name_en,generic_name,brands,quantity,serving_size,serving_quantity,image_front_small_url,nutriments";
  let j: { status?: number; product?: Record<string, unknown> } = {};
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${fields}`, {
      headers: { "User-Agent": "FitSync/1.0 (fitness app; contact via website)" },
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (res.status === 404) return NextResponse.json({ error: "not_found" }, { status: 404 });
    j = await res.json();
  } catch {
    return NextResponse.json({ error: "The food database didn't respond. Try again in a moment." }, { status: 502 });
  }
  const p = j.product;
  if (!p || j.status === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const n = (p.nutriments ?? {}) as Record<string, number | string | undefined>;
  const num = (...keys: string[]) => {
    for (const k of keys) {
      const v = Number(n[k]);
      if (Number.isFinite(v)) return v;
    }
    return null;
  };
  const kcal = num("energy-kcal_100g") ?? (num("energy_100g") != null ? num("energy_100g")! / 4.184 : null);
  const sodiumG = num("sodium_100g") ?? (num("salt_100g") != null ? num("salt_100g")! / 2.5 : null);
  const per100 = {
    kcal: kcal ?? 0,
    protein: num("proteins_100g") ?? 0,
    carbs: num("carbohydrates_100g") ?? 0,
    sugar: num("sugars_100g") ?? 0,
    fat: num("fat_100g") ?? 0,
    sat_fat: num("saturated-fat_100g") ?? 0,
    fibre: num("fiber_100g") ?? 0,
    sodium: sodiumG != null ? sodiumG * 1000 : 0,
  };
  const servingG = Number(p.serving_quantity);
  const name = String(p.product_name_en || p.product_name || p.generic_name || "").trim();

  return NextResponse.json({
    code,
    name: name || `Product ${code}`,
    brand: String(p.brands ?? "").split(",")[0].trim(),
    image: (p.image_front_small_url as string) || null,
    quantity: String(p.quantity ?? ""),
    serving: Number.isFinite(servingG) && servingG > 0 ? { grams: servingG, label: String(p.serving_size ?? `${servingG} g`) } : null,
    per100,
    complete: kcal != null,
  });
}
