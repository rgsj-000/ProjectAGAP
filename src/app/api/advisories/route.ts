import { advisoryInput } from "@/lib/server/validation";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { audit } from "@/lib/server/audit";

export async function GET(request: Request) {
  try { const { supabase } = await requireLguUser(); const url = new URL(request.url); let q = supabase.from("advisories").select("*").order("issue_time", { ascending: false }); if (url.searchParams.get("active") === "true") q = q.eq("verification_status", "VERIFIED").lte("validity_start", new Date().toISOString()).gt("validity_end", new Date().toISOString()); const barangay = url.searchParams.get("barangay"); if (barangay) q = q.contains("affected_areas", [barangay]); const { data, error } = await q; if (error) throw error; return ok(data); } catch (e) { return fail(e); }
}
export async function POST(request: Request) {
  try { const { supabase, user } = await requireLguUser(["admin","lgu_reviewer","lgu_encoder"]); const v = advisoryInput.parse(await request.json()); const { data, error } = await supabase.from("advisories").insert({ source_agency:v.sourceAgency, advisory_type:v.advisoryType, bulletin_reference:v.bulletinReference, warning_information:v.warningInformation, issue_time:v.issueTime.toISOString(), validity_start:v.validityStart.toISOString(), validity_end:v.validityEnd.toISOString(), affected_areas:v.affectedAreas, source_link:v.sourceLink, verification_status:"UNVERIFIED", created_by:user.id, raw_content:v.evidence?{evidence:v.evidence}:{} }).select().single(); if(error) throw error; await audit(supabase,{userId:user.id,action:"CREATE",entityType:"advisory",entityId:data.id,newValue:data}); return ok(data,201); } catch(e){ return fail(e); }
}
