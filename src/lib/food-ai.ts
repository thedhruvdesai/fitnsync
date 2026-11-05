import { generate } from "./llm";
import type { Tier } from "./tiers";

export const DAILY_SCANS: Record<Tier, number> = { free: 3, starter: 15, pro: 25, elite: 50 };

export interface FoodItem {
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
}

const SYSTEM = `You are a nutrition estimator inside the Fit&Sync app. You identify foods from a photo and/or a description and estimate calories and macros per item.

Rules:
- Recognise cuisines from everywhere, including Indian (Gujarati, Punjabi, South Indian), Asian, Middle Eastern, Western and Australian meals, home cooking and takeaway.
- Split the meal into separate items (e.g. "2 rotis", "1 bowl dal", "rice"). Estimate realistic portions from visual cues (plate size, cutlery, hand) or the user's words. If they give quantities, use them exactly.
- Use standard nutrition values (e.g. USDA / AUSNUT / IFCT style) and include cooking oil or ghee when it's clearly used.
- Round kcal to the nearest 5 and macros to whole grams.
- confidence: "high" when the food and portion are clear, "medium" when the portion is a guess, "low" when the food itself is unclear.
- If the image isn't food, return an empty items list with a short note.
- Reply with JSON only, no markdown, in exactly this shape:
{"items":[{"name":"","portion":"","kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":"high"}],"note":""}
The note is one short, friendly sentence (e.g. a tip or what you assumed), or "".`;

export async function analyzeFood(input: { text?: string; image?: { data: string; mediaType: string } }) {
  const raw = await generate({
    system: SYSTEM,
    text: input.text?.trim() ? `What I ate: ${input.text.trim().slice(0, 800)}` : "Estimate everything on this plate.",
    image: input.image,
    json: true,
    maxTokens: 900,
  });
  const cleaned = raw.replace(/```(?:json)?/g, "");
  const json = cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1);
  let parsed: { items?: Partial<FoodItem>[]; note?: string };
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`Couldn't parse the AI reply: ${raw.slice(0, 120)}`);
  }
  const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
  const items: FoodItem[] = (parsed.items ?? []).slice(0, 15).map((i) => ({
    name: String(i.name ?? "Food").slice(0, 80),
    portion: String(i.portion ?? "").slice(0, 60),
    kcal: num(i.kcal),
    protein: num(i.protein),
    carbs: num(i.carbs),
    fat: num(i.fat),
    confidence: i.confidence === "high" || i.confidence === "low" ? i.confidence : "medium",
  }));
  return { items, note: String(parsed.note ?? "").slice(0, 200) };
}
