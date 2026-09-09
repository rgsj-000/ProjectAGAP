import { createAdminClient } from "@/lib/server/supabase";
import { activeRules, activeVerifiedAdvisory, camelAdvisory } from "@/lib/server/repositories";
import { fail, ok } from "@/lib/server/errors";
import { z } from "zod";

const DEMO_BARANGAYS = [
  "Dalahican",
  "Cotta",
  "Barra",
  "Gulang-gulang",
  "Ibabang Dupay",
  "Mayao Crossing",
  "Ransohan",
];

const DEMO_ADVISORY = {
  id: "demo-public-preparedness",
  source_agency: "Project AGAP",
  advisory_type: "Flood Preparedness",
  bulletin_reference: "DEMO-PUBLIC-PREPAREDNESS",
  warning_information: "This is a synthetic demonstration advisory for the public preparedness preview.",
  issue_time: new Date().toISOString(),
  validity_start: new Date().toISOString(),
  validity_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  affected_areas: DEMO_BARANGAYS,
  source_link: "https://example.invalid",
  verification_status: "VERIFIED",
  is_demo: true,
};

async function getBarangayNames(db: ReturnType<typeof createAdminClient>) {
  try {
    const { data, error } = await db.from("barangays").select("barangay_name").order("barangay_name");
    if (error) throw error;
    const names = (data ?? []).map((b: any) => b.barangay_name ?? b.name).filter(Boolean);
    return names.length ? names : DEMO_BARANGAYS;
  } catch {
    return DEMO_BARANGAYS;
  }
}

export async function GET(request: Request) {
  try {
    const db = createAdminClient();
    const barangay = new URL(request.url).searchParams.get("barangay");
    if (!barangay) {
      return ok(await getBarangayNames(db));
    }

    z.string().trim().min(1).max(150).parse(barangay);

    try {
      const advisory = await activeVerifiedAdvisory(db, barangay);
      const rules = await activeRules(db, "HOUSEHOLD");
      return ok({
        barangay,
        advisory: camelAdvisory(advisory),
        rules,
        lastSyncAt: new Date().toISOString(),
      });
    } catch {
      return ok({
        barangay,
        advisory: camelAdvisory(DEMO_ADVISORY),
        rules: [],
        lastSyncAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    return fail(e);
  }
}
