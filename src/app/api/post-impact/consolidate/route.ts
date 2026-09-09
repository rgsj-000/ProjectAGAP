import { z } from "zod";
import { requireLguUser } from "@/lib/server/auth";
import { uuid } from "@/lib/server/validation";
import { fail, ok, AppError } from "@/lib/server/errors";
import { buildPostImpact } from "@/lib/server/postImpact";
import { audit } from "@/lib/server/audit";
const schema = z.object({
  barangayId: uuid,
  advisoryId: uuid,
  reportIds: z.array(uuid).min(1).max(100),
  reason: z.string().trim().min(10).max(2000),
  nonOverlapping: z.literal(true),
});
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireLguUser(["admin", "lgu_reviewer"]);
    const v = schema.parse(await request.json());
    const { data: reports, error } = await supabase
      .from("damage_reports")
      .select("*")
      .in("id", [...new Set(v.reportIds)])
      .eq("barangay_id", v.barangayId)
      .eq("advisory_id", v.advisoryId);
    if (error) throw error;
    if (reports.length !== new Set(v.reportIds).size)
      throw new AppError(
        "INVALID_INPUT",
        "Reports must belong to the selected barangay and event.",
        422,
      );
    const { data: advisory, error: ae } = await supabase
      .from("advisories")
      .select("bulletin_reference")
      .eq("id", v.advisoryId)
      .single();
    if (ae) throw ae;
    const total = (field: string, verified = false) =>
      reports
        .filter((r) => !verified || r.verification_status === "VERIFIED")
        .reduce((sum, r) => sum + Number(r[field] ?? 0), 0);
    const summary = (field: string) =>
      reports
        .map((r) => r[field])
        .filter(Boolean)
        .join("; ");
    const { data: needs, error: ne } = await supabase
      .from("needs_reports")
      .select("*")
      .in("damage_report_id", v.reportIds);
    if (ne) throw ne;
    const { data: review, error: re } = await supabase
      .from("post_impact_reviews")
      .insert({
        barangay_id: v.barangayId,
        advisory_id: v.advisoryId,
        event_reference: advisory.bulletin_reference,
        report_ids: v.reportIds,
        reported_population: total("reported_affected_persons"),
        validated_population: total("reported_affected_persons", true),
        reported_households: total("reported_affected_households"),
        validated_households: total("reported_affected_households", true),
        damage_summary: summary("damage_summary"),
        facility_condition: summary("critical_facility_condition"),
        service_disruption: summary("service_disruption"),
        accessibility_constraints: summary("access_condition"),
        vulnerable_groups: reports.reduce(
          (groups, r) => {
            for (const [key, value] of Object.entries(
              r.vulnerable_groups ?? {},
            ))
              groups[key] = (groups[key] ?? 0) + Number(value);
            return groups;
          },
          {} as Record<string, number>,
        ),
        urgent_unmet_needs: [
          "food",
          "water",
          "shelter",
          "medicine",
          "rescue",
          "restoration",
        ]
          .filter((key) => needs.some((n) => n[`${key}_need`]))
          .join(", "),
        validation_status: reports.every(
          (r) => r.verification_status === "VERIFIED",
        )
          ? "VERIFIED"
          : "FOR_REVIEW",
      })
      .select("*,barangays(barangay_name)")
      .single();
    if (re) throw re;
    await audit(supabase, {
      userId: user.id,
      action: "CONSOLIDATION",
      entityType: "post_impact_review",
      entityId: review.id,
      newValue: review,
      reason: v.reason,
    });
    return ok(await buildPostImpact(supabase, review), 201);
  } catch (e) {
    return fail(e);
  }
}
