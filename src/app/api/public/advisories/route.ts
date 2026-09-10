import { fail, ok } from "@/lib/server/errors";
import { createPublicDataClient } from "@/lib/server/supabase";

export async function GET() {
  try {
    const db = createPublicDataClient();
    const now = new Date().toISOString();

    const { data, error } = await db
      .from("advisories")
      .select(
        "id,source_agency,advisory_type,bulletin_reference,warning_information,issue_time,validity_start,validity_end,affected_areas,source_link,verification_status",
      )
      .eq("verification_status", "VERIFIED")
      .lte("validity_start", now)
      .gt("validity_end", now)
      .order("issue_time", { ascending: false });

    if (error) throw error;

    return ok(
      (data ?? []).map((advisory) => ({
        id: advisory.id,
        sourceAgency: advisory.source_agency,
        advisoryType: advisory.advisory_type,
        bulletinReference: advisory.bulletin_reference,
        warningInformation: advisory.warning_information,
        issueTime: advisory.issue_time,
        validityStart: advisory.validity_start,
        validityEnd: advisory.validity_end,
        affectedAreas: advisory.affected_areas ?? [],
        sourceLink: advisory.source_link,
        verificationStatus: advisory.verification_status,
      })),
    );
  } catch (error) {
    return fail(error);
  }
}
