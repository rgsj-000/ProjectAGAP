import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "./errors";
import type { ActionRule } from "@/lib/domain/actionRuleEngine";

export async function activeVerifiedAdvisory(supabase: SupabaseClient, barangay?: string) {
  let query = supabase.from("advisories").select("*").eq("verification_status", "VERIFIED").lte("validity_start", new Date().toISOString()).gt("validity_end", new Date().toISOString()).order("issue_time", { ascending: false }).limit(1);
  if (barangay) query = query.contains("affected_areas", [barangay]);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("ADVISORY_NOT_VERIFIED", "No current verified advisory is available for this barangay.", 409);
  return data;
}

export async function activeRules(supabase: SupabaseClient, audience?: string): Promise<ActionRule[]> {
  let query = supabase.from("action_rules").select("*").eq("active_status", true);
  if (audience) query = query.eq("target_audience", audience);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ruleId: r.rule_id, disasterPhase: r.disaster_phase, field: r.fact_field, operator: r.operator, threshold: r.threshold, approvedAction: r.approved_action, whyItApplies: r.why_it_applies, sourceAgency: r.source_agency, sourceDocument: r.source_document, targetAudience: r.target_audience, responsibleUnit: r.responsible_unit, requiresLguConfirmation: r.requires_lgu_confirmation, version: r.version, activeStatus: r.active_status }));
}

export function camelAdvisory(a: any) {
  return { id: a.id, sourceAgency: a.source_agency, advisoryType: a.advisory_type, bulletinReference: a.bulletin_reference, warningInformation: a.warning_information, issueTime: a.issue_time, validityStart: a.validity_start, validityEnd: a.validity_end, affectedAreas: a.affected_areas, sourceLink: a.source_link, verificationStatus: a.verification_status, isDemo: a.is_demo };
}

export async function resolveBarangayId(supabase: SupabaseClient, input: { barangayId?: string; barangayName?: string }) {
  if (input.barangayId) return input.barangayId;
  const { data, error } = await supabase.from("barangays").select("id").ilike("barangay_name", input.barangayName!).single();
  if (error || !data) throw new AppError("RECORD_NOT_FOUND", "Barangay was not found.", 404);
  return data.id as string;
}
