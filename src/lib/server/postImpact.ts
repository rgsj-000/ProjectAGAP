import type { SupabaseClient } from "@supabase/supabase-js";
import { postImpactFacts } from "@/lib/domain/postImpact";
import { generatePostImpactActionCard } from "@/lib/domain/actionCards";
import { activeRules } from "./repositories";
import { persistOutput } from "./output";

export async function buildPostImpact(
  db: SupabaseClient,
  review: Record<string, any>,
) {
  const { data: needs, error } = await db
    .from("needs_reports")
    .select("*")
    .in("damage_report_id", review.report_ids ?? []);
  if (error) throw error;
  const rules = await activeRules(db, "LGU");

  const { data: latestRisk, error: riskError } = await db
    .from("risk_assessments")
    .select("hazard_id")
    .eq("barangay_id", review.barangay_id)
    .eq("advisory_id", review.advisory_id)
    .order("assessment_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (riskError) throw riskError;

  let exposure: Record<string, any> | null = null;
  if (latestRisk?.hazard_id) {
    const { data, error: exposureError } = await db
      .from("population_exposure_estimates")
      .select("*")
      .eq("barangay_id", review.barangay_id)
      .eq("hazard_id", latestRisk.hazard_id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (exposureError) throw exposureError;
    exposure = data;
  }

  const card = generatePostImpactActionCard({
    barangay: review.barangays.barangay_name,
    eventReference: review.event_reference,
    facts: postImpactFacts(review, needs ?? []),
    rules,
  });
  return {
    review,
    preEventComparison: exposure
      ? {
          estimatedPotentiallyExposedPopulation:
            exposure.estimated_exposed_population,
          estimateMethod: exposure.estimation_method,
          estimateConfidence: exposure.confidence_level,
          referenceDate: exposure.reference_date,
          isDemo: exposure.is_demo,
        }
      : null,
    card: await persistOutput(db, review.barangay_id, card, {
      review,
      needs,
      rules,
      exposure,
    }),
  };
}
