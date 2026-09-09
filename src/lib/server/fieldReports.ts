import type { SupabaseClient } from "@supabase/supabase-js";
import { damageReportInput } from "./validation";
import { resolveBarangayId } from "./repositories";
export async function saveFieldReport(db: SupabaseClient, raw: unknown) {
  const v = damageReportInput.parse(raw);
  const barangayId = await resolveBarangayId(db, v);
  const payload = {
    ...v,
    barangayId,
    barangayName: undefined,
    deviceTimestamp: v.deviceTimestamp.toISOString(),
  };
  const { data, error } = await db.rpc("submit_field_report", {
    p_payload: payload,
  });
  if (error) throw error;
  return data;
}
