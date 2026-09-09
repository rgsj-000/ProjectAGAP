import { z } from "zod";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { damageReportInput } from "@/lib/server/validation";
import { audit } from "@/lib/server/audit";
import { resolveBarangayId } from "@/lib/server/repositories";

const batch = z.object({ records: z.array(damageReportInput).max(100) });
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireLguUser();
    const { records } = batch.parse(await request.json());
    const results: Array<Record<string, unknown>> = [];
    for (const value of records) {
      const { data: existing } = await supabase.from("damage_reports").select("*").eq("client_id", value.clientId).maybeSingle();
      if (existing) {
        const same = JSON.stringify(existing.evidence) === JSON.stringify(value.evidence) && existing.version === value.baseVersion;
        if (!same) {
          const { data: conflict, error } = await supabase.from("sync_conflicts").insert({ client_id: value.clientId, entity_type: "damage_report", entity_id: existing.id, client_payload: value, server_payload: existing }).select().single();
          if (error) throw error;
          await audit(supabase, { userId: user.id, action: "CONFLICT_DETECTED", entityType: "sync_conflict", entityId: conflict.id, metadata: { clientId: value.clientId } });
          results.push({ clientId: value.clientId, status: "ACTION_REQUIRED", conflictId: conflict.id });
        } else results.push({ clientId: value.clientId, status: "SYNCED", deduplicated: true });
        continue;
      }
      const barangayId = await resolveBarangayId(supabase, value);
      const { data, error } = await supabase.from("damage_reports").insert({
        client_id: value.clientId, barangay_id: barangayId, purok: value.purok,
        reported_affected_persons: value.reportedAffectedPersons, reported_affected_households: value.reportedAffectedHouseholds,
        vulnerable_groups: value.vulnerableGroups, damage_type: value.damageType, severity: value.severity,
        critical_facility_condition: value.criticalFacilityCondition, access_condition: value.accessCondition,
        evidence: value.evidence, source: value.source, reported_at: value.deviceTimestamp.toISOString(), device_timestamp: value.deviceTimestamp.toISOString(),
        verification_status: "UNVERIFIED", sync_status: "SYNCED", created_by: user.id,
      }).select().single();
      if (error) throw error;
      results.push({ clientId: value.clientId, status: "SYNCED", id: data.id });
    }
    return ok({ results, lastSyncAt: new Date().toISOString(), pendingSyncCount: 0, conflictCount: results.filter(x => x.status === "ACTION_REQUIRED").length });
  } catch (error) { return fail(error); }
}
