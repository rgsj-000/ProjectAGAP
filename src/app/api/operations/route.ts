import { requireLguUser } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/errors";
export async function GET() {
  try {
    const { supabase, user, role } = await requireLguUser();
    const tables = [
      "barangays",
      "advisories",
      "hazards",
      "methodologies",
      "population_profiles",
      "preparedness_capacities",
      "risk_assessments",
      "population_exposure_estimates",
      "critical_facilities",
    ] as const;
    const results = await Promise.all(
      tables.map((table) => supabase.from(table).select("*").limit(1000)),
    );
    results.forEach((r) => {
      if (r.error) throw r.error;
    });
    return ok({
      userId: user.id,
      role,
      ...Object.fromEntries(tables.map((table, i) => [table, results[i].data])),
      synchronizedAt: new Date().toISOString(),
    });
  } catch (e) {
    return fail(e);
  }
}
