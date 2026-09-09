export function postImpactFacts(
  review: Record<string, any>,
  needs: Array<Record<string, any>>,
) {
  return {
    reportedAffectedPersons: review.reported_population,
    validatedAffectedPersons: review.validated_population,
    populationAwaitingValidation: Math.max(
      0,
      review.reported_population - review.validated_population,
    ),
    reportedHouseholds: review.reported_households,
    validatedHouseholds: review.validated_households,
    waterNeedValidated: needs.some(
      (n) => n.verification_status === "VERIFIED" && n.water_need === true,
    ),
    serviceDisruption: Boolean(review.service_disruption),
    accessibilityConstraints: Boolean(review.accessibility_constraints),
    validationIncomplete: review.validation_status !== "VERIFIED",
  };
}
