import { z } from "zod";
import { AppError } from "./errors";

const fieldKeys = [
  "title",
  "source",
  "issuedTime",
  "bulletinNumber",
  "validity",
  "affectedLocations",
  "warningInformation",
  "sourceUrl",
  "message",
  "precautions",
] as const;

const nullableText = z.string().trim().min(1).max(8000).nullable();

const modelExtraction = z.object({
  title: nullableText,
  source: nullableText,
  issuedTime: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).nullable(),
  bulletinNumber: nullableText,
  validity: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).nullable(),
  affectedLocations: z.array(z.string().trim().min(1).max(300)).max(100),
  warningInformation: nullableText,
  sourceUrl: z.string().trim().url().nullable(),
  message: nullableText,
  precautions: z.array(z.string().trim().min(1).max(2000)).max(20),
  warnings: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
});

export type AdvisoryExtractionField = (typeof fieldKeys)[number];

export interface AdvisoryExtractionResult {
  fields: {
    title: string | null;
    source: string | null;
    issuedTime: string | null;
    bulletinNumber: string | null;
    validity: string | null;
    affectedLocations: string[];
    warningInformation: string | null;
    sourceUrl: string | null;
    message: string | null;
    precautions: string[];
  };
  extractedFields: AdvisoryExtractionField[];
  missingFields: AdvisoryExtractionField[];
  warnings: string[];
}

const GEMINI_TIMEOUT_MS = 60_000;
const MAX_ADVISORY_FILE_BYTES = 6 * 1024 * 1024;

function resolveGeminiModel() {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (!configured || configured === "gemini-2.5-flash") return "gemini-3.6-flash";
  return configured;
}

function parseJson(text: string) {
  const normalized = text
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/i, "");
  return JSON.parse(normalized);
}

function hasValue(result: z.infer<typeof modelExtraction>, field: AdvisoryExtractionField) {
  const value = result[field];
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeAdvisoryExtraction(raw: unknown): AdvisoryExtractionResult {
  const parsed = modelExtraction.parse(raw);
  const fields = {
    title: parsed.title,
    source: parsed.source,
    issuedTime: parsed.issuedTime,
    bulletinNumber: parsed.bulletinNumber,
    validity: parsed.validity,
    affectedLocations: parsed.affectedLocations,
    warningInformation: parsed.warningInformation,
    sourceUrl: parsed.sourceUrl,
    message: parsed.message,
    precautions: parsed.precautions,
  };

  const extractedFields = fieldKeys.filter((field) => hasValue(parsed, field));
  const missingFields = fieldKeys.filter((field) => !hasValue(parsed, field));

  return {
    fields,
    extractedFields: [...extractedFields],
    missingFields: [...missingFields],
    warnings: parsed.warnings,
  };
}

export async function extractAdvisoryWithGemini(input: {
  bytes: Uint8Array;
  mimeType: "application/pdf" | "image/png" | "image/jpeg";
  fileName: string;
}): Promise<AdvisoryExtractionResult> {
  const startedAt = Date.now();
  const key = process.env.GEMINI_API_KEY;
  const model = resolveGeminiModel();

  if (!key) {
    throw new AppError(
      "GEMINI_UNAVAILABLE",
      "AI extraction is unavailable because Gemini is not configured.",
      503,
      { reason: "unavailable", stage: "configuration" },
    );
  }

  if (input.bytes.byteLength > MAX_ADVISORY_FILE_BYTES) {
    throw new AppError("INVALID_INPUT", "Advisory file exceeds the 6 MB limit.", 413);
  }

  const prompt = [
    "You are Project AGAP's constrained official-advisory extraction assistant.",
    "Read only the attached official advisory file and extract fields for human validation.",
    "Never invent, estimate, complete, or infer a fact that is not supported by the file.",
    "If a field is absent, illegible, uncertain, or ambiguous, return null or an empty array and add a short warning.",
    "Preserve official measurements, warning classifications, place names, bulletin references, and directives exactly in meaning.",
    "Dates must be returned as local Philippine datetime strings in YYYY-MM-DDTHH:mm only when the date and time are explicitly resolvable from the document. Do not invent an end time.",
    "sourceUrl may be populated only when a complete http:// or https:// URL is visibly present in the document.",
    "message must be a concise extractive summary of the advisory content only. Do not add instructions.",
    "precautions must contain only directives or precautions explicitly stated by the issuing source.",
    "affectedLocations must list only locations explicitly named by the source.",
    "Return JSON only with exactly these keys:",
    JSON.stringify({
      title: "string|null",
      source: "string|null",
      issuedTime: "YYYY-MM-DDTHH:mm|null",
      bulletinNumber: "string|null",
      validity: "YYYY-MM-DDTHH:mm|null",
      affectedLocations: ["string"],
      warningInformation: "string|null",
      sourceUrl: "https://...|null",
      message: "string|null",
      precautions: ["string"],
      warnings: ["string"],
    }),
    `File name: ${input.fileName}`,
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: input.mimeType,
                    data: Buffer.from(input.bytes).toString("base64"),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
          },
        }),
        signal: controller.signal,
        cache: "no-store",
      },
    );

    let body: any = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const providerStatus =
        typeof body?.error?.status === "string" ? body.error.status : undefined;
      const providerMessage =
        typeof body?.error?.message === "string"
          ? body.error.message.slice(0, 1200)
          : undefined;

      console.error("AGAP advisory extraction provider HTTP error", {
        model,
        status: response.status,
        statusText: response.statusText,
        providerStatus,
        providerMessage,
        elapsedMs: Date.now() - startedAt,
      });

      throw new AppError(
        "GEMINI_UNAVAILABLE",
        "AI extraction could not read the advisory file. You can still enter the fields manually.",
        503,
        { reason: "provider_error", stage: "provider_http" },
      );
    }

    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new AppError(
        "GEMINI_UNAVAILABLE",
        "AI extraction returned no usable data. You can still enter the fields manually.",
        503,
        { reason: "invalid_response", stage: "missing_candidate" },
      );
    }

    return normalizeAdvisoryExtraction(parseJson(text));
  } catch (error) {
    if (error instanceof AppError) throw error;

    const timedOut = error instanceof Error && error.name === "AbortError";
    console.error("AGAP advisory extraction failed", {
      model,
      category: timedOut ? "timeout" : "invalid_response",
      elapsedMs: Date.now() - startedAt,
    });

    throw new AppError(
      "GEMINI_UNAVAILABLE",
      timedOut
        ? "AI extraction timed out. You can still enter the advisory fields manually."
        : "AI extraction could not validate the advisory file. You can still enter the fields manually.",
      503,
      {
        reason: timedOut ? "timeout" : "invalid_response",
        stage: timedOut ? "request_timeout" : "schema_validation",
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
