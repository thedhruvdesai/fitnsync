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
    const parts: Record<string, unknown>[] = [];
    if (opts.image) parts.push({ inline_data: { mime_type: opts.image.mediaType, data: opts.image.data } });
    parts.push({ text: opts.text });
    // try the configured model first, then common fallbacks (model names change over time)
    const models = [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"].filter(Boolean) as string[];
    let lastErr = "";
    for (const model of Array.from(new Set(models))) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: opts.system }] },
          contents: [{ role: "user", parts }],
          // generous output budget: newer Gemini models spend part of it on internal "thinking"
          generationConfig: { temperature: opts.json ? 0.2 : 0.7, maxOutputTokens: 8192, ...(opts.json ? { responseMimeType: "application/json" } : {}) },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 404) {
        lastErr = `model ${model} not found`;
        continue;
      }
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${j?.error?.message ?? res.statusText}`);
      const cand = j?.candidates?.[0];
      const text = ((cand?.content?.parts ?? []) as { text?: string; thought?: boolean }[])
        .filter((p) => !p.thought)
        .map((p) => p.text ?? "")
        .join("")
        .trim();
      if (!text) throw new Error(`Gemini returned no text (finish: ${cand?.finishReason ?? j?.promptFeedback?.blockReason ?? "unknown"})`);
      return text;
    }
    throw new Error(`Gemini: ${lastErr || "no model available"}. Set GEMINI_MODEL in Netlify.`);
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
