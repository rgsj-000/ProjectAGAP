function positiveCount(value: unknown) {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0;
}

function vulnerableGroupCount(groups: unknown, keys: string[]) {
  if (!groups || typeof groups !== "object") return 0;
  const record = groups as Record<string, unknown>;
  return keys.reduce((sum, key) => {
    const value = Number(record[key] ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

export function postImpactFacts(
  review: Record<string, any>,
  needs: Array<Record<string, any>>,
) {
  const vulnerableGroups = review.vulnerable_groups ?? {};
  const validatedNeeds = needs.filter(
    (need) => need.verification_status === "VERIFIED",
  );
  const need = (field: string) =>
    validatedNeeds.some((record) => record[field] === true);

  const children = vulnerableGroupCount(vulnerableGroups, [
    "children",
    "children_under5",
  ]);
  const olderPersons = vulnerableGroupCount(vulnerableGroups, [
    "older_persons",
    "olderPersons",
    "older_persons_60plus",
  ]);
  const personsWithDisabilities = vulnerableGroupCount(vulnerableGroups, [
    "persons_with_disabilities",
    "pwd",
    "pwd_count",
  ]);

  const reportedAffectedPersons = Number(review.reported_population ?? 0);
  const validatedAffectedPersons = Number(review.validated_population ?? 0);
  const reportedHouseholds = Number(review.reported_households ?? 0);
  const validatedHouseholds = Number(review.validated_households ?? 0);

  const populationAwaitingValidation = Math.max(
    0,
    reportedAffectedPersons - validatedAffectedPersons,
  );
  const householdsAwaitingValidation = Math.max(
    0,
    reportedHouseholds - validatedHouseholds,
  );

  const hasServiceDisruption = Boolean(
    String(review.service_disruption ?? "").trim(),
  );
  const hasAccessibilityConstraints = Boolean(
    String(review.accessibility_constraints ?? "").trim(),
  );

  return {
    reportedAffectedPersons,
    validatedAffectedPersons,
    populationAwaitingValidation,
    reportedHouseholds,
    validatedHouseholds,
    householdsAwaitingValidation,
    hasValidatedAffectedPopulation: positiveCount(validatedAffectedPersons),
    hasValidatedAffectedHouseholds: positiveCount(validatedHouseholds),
    waterNeedValidated: need("water_need"),
    foodNeedValidated: need("food_need"),
    shelterNeedValidated: need("shelter_need"),
    medicineNeedValidated: need("medicine_need"),
    rescueNeedValidated: need("rescue_need"),
    restorationNeedValidated: need("restoration_need"),
    hasAnyValidatedNeed: validatedNeeds.some((record) =>
      [
        "food_need",
        "water_need",
        "shelter_need",
        "medicine_need",
        "rescue_need",
        "restoration_need",
      ].some((field) => record[field] === true),
    ),
    childrenReported: children,
    olderPersonsReported: olderPersons,
    personsWithDisabilitiesReported: personsWithDisabilities,
    hasVulnerableGroups:
      children > 0 || olderPersons > 0 || personsWithDisabilities > 0,
    hasServiceDisruption,
    serviceDisruption: hasServiceDisruption,
    hasAccessibilityConstraints,
    accessibilityConstraints: hasAccessibilityConstraints,
    validationIncomplete:
      review.validation_status !== "VERIFIED" ||
      populationAwaitingValidation > 0 ||
      householdsAwaitingValidation > 0,
  };
}
