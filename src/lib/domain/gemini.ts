import { z } from "zod";
import { AppError } from "@/lib/server/errors";

const responseSchema = z.object({ text: z.string().min(1).max(6000), warnings: z.array(z.string()).default([]) });
const forbidden = [/calculate risk/i, /change risk/i, /evacuation route/i, /declare.*safe/i, /allocate relief/i];

export async function controlledGemini(input: { task: "SIMPLIFY" | "TRANSLATE" | "EXPLAIN" | "SUMMARIZE" | "CLASSIFY"; verifiedFacts: unknown; deterministicResults?: unknown; language?: "English" | "Filipino" }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AppError("GEMINI_UNAVAILABLE", "Gemini is not configured; deterministic templates remain available.", 503);
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const prompt = `You are AGAP's restricted language assistant. Task: ${input.task}. Use only VERIFIED_FACTS. Never calculate or alter risk, invent facts, issue evacuation orders/routes, declare safety, allocate relief, or create recommendations. Return JSON with keys text and warnings.\nVERIFIED_FACTS=${JSON.stringify(input.verifiedFacts)}\nIMMUTABLE_DETERMINISTIC_RESULTS=${JSON.stringify(input.deterministicResults ?? null)}\nLANGUAGE=${input.language ?? "English"}`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }), cache: "no-store" });
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
    const raw = await response.json();
    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = responseSchema.parse(JSON.parse(text));
    if (forbidden.some(rule => rule.test(parsed.text))) throw new Error("Unsafe AI output rejected");
    return parsed;
  } catch (error) { throw new AppError("GEMINI_UNAVAILABLE", "Gemini output was unavailable or rejected. Use the deterministic template.", 503, String(error)); }
}
