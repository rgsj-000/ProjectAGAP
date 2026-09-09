import { damageReportInput } from "@/lib/server/validation";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { audit } from "@/lib/server/audit";
import { resolveBarangayId } from "@/lib/server/repositories";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireLguUser();
    const barangayId = new URL(request.url).searchParams.get("barangayId");
    let query = supabase.from("damage_reports").select("*").order("reported_at", { ascending: false });
    if (barangayId) query = query.eq("barangay_id", barangayId);
    const { data, error } = await query; if (error) throw error; return ok(data);
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireLguUser();
    const value = damageReportInput.parse(await request.json());
    const barangayId = await resolveBarangayId(supabase, value);
    const { data: existing } = await supabase.from("damage_reports").select("*").eq("client_id", value.clientId).maybeSingle();
    if (existing) return ok({ record: existing, deduplicated: true });
    const { data, error } = await supabase.from("damage_reports").insert({
      client_id: value.clientId, barangay_id: barangayId, purok: value.purok,
      reported_affected_persons: value.reportedAffectedPersons, reported_affected_households: value.reportedAffectedHouseholds,
      vulnerable_groups: value.vulnerableGroups, damage_type: value.damageType, severity: value.severity,
      critical_facility_condition: value.criticalFacilityCondition, access_condition: value.accessCondition,
      evidence: value.evidence, source: value.source, reported_at: value.deviceTimestamp.toISOString(),
      device_timestamp: value.deviceTimestamp.toISOString(), verification_status: "UNVERIFIED", sync_status: "SYNCED", created_by: user.id,
    }).select().single();
    if (error) throw error;
    await audit(supabase, { userId: user.id, action: "SYNCHRONIZATION", entityType: "damage_report", entityId: data.id, newValue: data, metadata: { clientId: value.clientId } });
    return ok({ record: data, deduplicated: false }, 201);
  } catch (error) { return fail(error); }
}
