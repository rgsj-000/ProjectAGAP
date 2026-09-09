import { z } from "zod";
import { assertSafeAiWording } from "@/lib/domain/aiGuard";
import { AppError } from "./errors";

const output = z.object({
  text: z.string().min(1).max(5000),
  warnings: z.array(z.string()).max(10),
  sourceFields: z.array(z.string()).max(50),
});

function parseJson(text: string) {
  const normalized = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(normalized);
}

export async function explainWithGemini(input: {
  task: string;
  verifiedInput: Record<string, unknown>;
  language: "en" | "fil";
}) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

  if (!key) {
    throw new AppError(
      "GEMINI_UNAVAILABLE",
      "Gemini is not configured. Deterministic output remains available.",
      503,
    );
  }

  const prompt = `You are Project AGAP's constrained wording assistant. You may only explain, simplify, translate, or summarize the supplied verified JSON. Never calculate or change risk, invent facts, issue warnings, evacuation orders/routes, safety declarations, relief allocations, or infrastructure decisions. Return JSON only: {"text":string,"warnings":string[],"sourceFields":string[]}. Task: ${input.task}. Language: ${input.language}. Verified input: ${JSON.stringify(input.verifiedInput)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
        cache: "no-store",
      },
    );
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        `Gemini HTTP ${response.status}${body?.error?.status ? ` (${body.error.status})` : ""}`,
      );
    }

    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Gemini returned no text candidate");
    }

    const parsed = output.parse(parseJson(text));
    assertSafeAiWording(parsed.text);
    return parsed;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown Gemini failure";
    console.error("AGAP Gemini request failed", { model, reason });
    throw new AppError(
      "GEMINI_UNAVAILABLE",
      "Gemini response failed validation. Use the deterministic template.",
      503,
      reason,
    );
  } finally {
    clearTimeout(timeout);
  }
}
