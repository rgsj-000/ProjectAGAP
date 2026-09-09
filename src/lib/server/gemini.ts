import { z } from "zod";
import { assertSafeAiWording } from "@/lib/domain/aiGuard";
import { AppError } from "./errors";

const output = z.object({
  text: z.string().min(1).max(5000),
  warnings: z.array(z.string()).max(10),
  sourceFields: z.array(z.string()).max(50),
});

const GEMINI_TIMEOUT_MS = 60_000;

function failureMetadata(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return { category: "timeout", stage: "request_timeout" };
  }
  if (error instanceof Error && error.message.startsWith("Gemini HTTP")) {
    return { category: "provider_error", stage: "provider_http" };
  }
  if (error instanceof SyntaxError) {
    return { category: "invalid_response", stage: "malformed_json" };
  }
  if (error instanceof z.ZodError) {
    return { category: "invalid_response", stage: "schema_mismatch" };
  }
  if (error instanceof Error && error.message === "Gemini returned no text candidate") {
    return { category: "invalid_response", stage: "missing_candidate" };
  }
  if (error instanceof Error && error.message === "Prohibited AI content detected.") {
    return { category: "invalid_response", stage: "safety_rejection" };
  }
  return { category: "unavailable", stage: "transport_error" };
}

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
  const startedAt = Date.now();
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

  if (!key) {
    const details = { reason: "unavailable", stage: "configuration", elapsedMs: Date.now() - startedAt };
    console.error("AGAP Gemini request failed", { model, category: details.reason, stage: details.stage, elapsedMs: details.elapsedMs });
    throw new AppError(
      "GEMINI_UNAVAILABLE",
      "Gemini is not configured. Deterministic output remains available.",
      503,
      details,
    );
  }

  const prompt = `You are Project AGAP's constrained wording assistant. You may only explain, simplify, translate, or summarize the supplied verified JSON. Never calculate or change risk, invent facts, issue warnings, evacuation orders/routes, safety declarations, relief allocations, or infrastructure decisions. Return JSON only: {"text":string,"warnings":string[],"sourceFields":string[]}. Task: ${input.task}. Language: ${input.language}. Verified input: ${JSON.stringify(input.verifiedInput)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

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
    let body: any = null;
    let bodyParseError: unknown;
    try {
      body = await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      bodyParseError = error;
    }

    if (!response.ok) {
      const providerStatus =
        typeof body?.error?.status === "string" ? body.error.status : undefined;
      const providerMessage =
        typeof body?.error?.message === "string"
          ? body.error.message.slice(0, 1200)
          : undefined;

      console.error("AGAP Gemini provider HTTP error", {
        model,
        status: response.status,
        statusText: response.statusText,
        providerStatus,
        providerMessage,
        elapsedMs: Date.now() - startedAt,
      });

      throw new Error(
        `Gemini HTTP ${response.status}${providerStatus ? ` (${providerStatus})` : ""}`,
      );
    }
    if (bodyParseError) throw bodyParseError;

    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Gemini returned no text candidate");
    }

    const parsed = output.parse(parseJson(text));
    assertSafeAiWording(parsed.text);
    return parsed;
  } catch (error) {
    const { category, stage } = failureMetadata(error);
    const elapsedMs = Date.now() - startedAt;
    console.error("AGAP Gemini request failed", { model, category, stage, elapsedMs });
    throw new AppError(
      "GEMINI_UNAVAILABLE",
      "Gemini response failed validation. Use the deterministic template.",
      503,
      { reason: category, stage, elapsedMs },
    );
  } finally {
    clearTimeout(timeout);
  }
}
