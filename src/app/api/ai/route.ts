import { z } from "zod";
import { AppError, fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { explainWithGemini } from "@/lib/server/gemini";
import { uuid } from "@/lib/server/validation";

const fallbackReasons = new Set(["timeout", "provider_error", "invalid_response", "unavailable"]);

function safeFallbackReason(error: unknown) {
 const details = error instanceof AppError && error.details && typeof error.details === "object"
  ? error.details as Record<string, unknown>
  : null;
 const reason = details?.reason;
 return typeof reason === "string" && fallbackReasons.has(reason) ? reason : "unavailable";
}

function fallbackMessage(reason: string) {
 return reason === "timeout"
  ? "Gemini took too long to respond. This brief uses persisted verified data and approved actions."
  : "Gemini wording is unavailable. This brief uses persisted verified data and approved actions.";
}

function deterministicBrief(content: unknown) {
 const card = content && typeof content === "object" ? content as Record<string, any> : {};
 const situation = card.situation ?? {};
 const advisory = situation.currentVerifiedAdvisory ?? {};
 const exposure = card.potentialExposure ?? {};
 const capacity = card.preparednessCapacity ?? {};
 const rationale = card.whyAttentionIsNeeded ?? {};
 const actions = Array.isArray(card.recommendedActions) ? card.recommendedActions : [];
 const display = (value: unknown) => value === null || value === undefined || value === "" ? "Not recorded" : String(value);
 const actionText = actions.length
  ? actions.map((action: Record<string, any>) => `- ${display(action.action)}`).join("\n")
  : "- No approved actions recorded";
 return [
  `Situation: ${display(advisory.warningInformation)}`,
  `Why attention is needed: ${display(situation.riskCategory)} risk; likelihood ${display(rationale.riskInputs?.likelihood)} and severity ${display(rationale.riskInputs?.severity)}.`,
  `Preparedness capacity: ${display(capacity.validatedCapacity)} recorded capacity with a potential gap of ${display(capacity.capacityGap)}.`,
  `Priority checks: Confirm current barangay conditions, capacity, access, utilities, critical facilities, communications, and vulnerable-household readiness.`,
  `Information still needed: ${display(rationale.missingInformation?.join?.(", "))}.`,
  `LGU actions:\n${actionText}`,
 ].join("\n\n");
}

export async function POST(r: Request) {
 try { const { supabase } = await requireLguUser();
 const v=z.object({outputId:uuid,language:z.enum(["en","fil"]).default("en"),mode:z.enum(["explain","brief"]).default("explain")}).parse(await r.json());
 const {data,error}=await supabase.from("generated_outputs").select("content,source_snapshot").eq("id",v.outputId).single();
 if(error)throw error;
 const task = v.mode === "brief"
	 ? "Create a concise operational barangay preparedness brief from only the supplied persisted output and source snapshot. Organize it as Situation, Why Attention Is Needed, Preparedness Capacity, Priority Checks, Information Still Needed, and LGU Actions. Preserve every supplied value exactly. Use only supplied recommendations and label missing values as not recorded. Do not create new facts, estimates, warnings, instructions, evacuation decisions, or actions."
	 : "Explain only the supplied output without adding actions or changing any values";
 try {return ok({...await explainWithGemini({task,verifiedInput:data,language:v.language}),fallback:false});}
 catch (error) {
  const fallbackReason = safeFallbackReason(error);
  return ok({text:deterministicBrief(data.content),fallback:true,fallbackReason,fallbackMessage:fallbackMessage(fallbackReason),content:data.content});
 }
 } catch(e){return fail(e);}
}
