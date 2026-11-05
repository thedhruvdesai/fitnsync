import Anthropic from "@anthropic-ai/sdk";

/**
 * One small wrapper over two AI providers.
 * - GEMINI_API_KEY set → Google Gemini (has a free tier in Google AI Studio)
 * - else ANTHROPIC_API_KEY → Claude
 */
export function aiConfigured() {
  return !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export function aiProvider(): "gemini" | "anthropic" | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export async function generate(opts: { system: string; text: string; image?: { data: string; mediaType: string }; json?: boolean; maxTokens?: number }) {
  const provider = aiProvider();
  if (!provider) throw new Error("No AI key configured");

  if (provider === "gemini") {
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const parts: Record<string, unknown>[] = [];
    if (opts.image) parts.push({ inline_data: { mime_type: opts.image.mediaType, data: opts.image.data } });
    parts.push({ text: opts.text });
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: opts.json ? 0.2 : 0.7, maxOutputTokens: opts.maxTokens ?? 1200, ...(opts.json ? { responseMimeType: "application/json" } : {}) },
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${j?.error?.message ?? res.statusText}`);
    return ((j?.candidates?.[0]?.content?.parts ?? []) as { text?: string }[]).map((p) => p.text ?? "").join("").trim();
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const content: Anthropic.Messages.ContentBlockParam[] = [];
  if (opts.image) content.push({ type: "image", source: { type: "base64", media_type: opts.image.mediaType as "image/jpeg", data: opts.image.data } });
  content.push({ type: "text", text: opts.text });
  const msg = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: opts.maxTokens ?? 1200,
    system: opts.system,
    messages: [{ role: "user", content }],
  });
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
}
