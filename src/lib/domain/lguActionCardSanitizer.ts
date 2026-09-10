import type { ActionRule } from "./actionRuleEngine";

type Row = Record<string, any>;

export const LGU_RECOMMENDATION_UNAVAILABLE =
  "Recommendation unavailable because no approved source-anchored action rule matched the current evidence.";

const VALID_ACTION_STATUSES = new Set([
  "RECOMMENDED",
  "FOR_VALIDATION",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "DEFERRED",
  "OVERRIDDEN",
]);

const PROHIBITED_RECOMMENDATION_PATTERNS = [
  /\bissue\s+(?:an?\s+)?evacuation orders?\b/i,
  /\b(?:select|suggest|recommend|provide|create|give)\s+(?:an?\s+)?evacuation routes?\b/i,
  /\bevacuat(?:e|ion)\s+immediately\b/i,
  /\b(?:this|the)\s+(?:area|location|facility)\s+is\s+safe\b/i,
  /\b(?:residents?|people|community)\s+(?:is|are)\s+safe\b/i,
  /\bsafe\s+to\s+return\b/i,
  /\bguaranteed\s+(?:flooding|safe|safety)\b/i,
  /\bdefinitely\s+affected\b/i,
  /\bmust\s+relocate\b/i,
  /\bautomatically\s+allocate\s+relief\b/i,
  /\b(?:send|distribute)\s+\d+(?:[,.]\d+)?\s+(?:relief|food|water|medicine|packs?|kits?|goods?)\b/i,
  /\bdeploy\s+\d+(?:[,.]\d+)?\s+(?:personnel|responders?|teams?)\b/i,
];

function record(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
}

function list(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function textOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function numericOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map(textOrNull).filter((value): value is string => Boolean(value)))];
}

function canonicalTrigger(rule: ActionRule) {
  return `${rule.field} ${rule.operator} ${JSON.stringify(rule.threshold)}`;
}

function canonicalSource(rule: ActionRule) {
  return `${rule.sourceAgency} — ${rule.sourceDocument}`;
}

function isProhibitedRecommendation(text: string) {
  return PROHIBITED_RECOMMENDATION_PATTERNS.some((pattern) => pattern.test(text));
}

function assertDeterministicRisk(card: Row) {
  const why = record(card.whyAttentionIsNeeded);
  const riskInputs = record(why.riskInputs);
  const likelihood = numericOrNull(riskInputs.likelihood);
  const severity = numericOrNull(riskInputs.severity);
  const riskResult = numericOrNull(why.riskResult);

  if (likelihood !== null && severity !== null && riskResult !== null) {
    const expected = likelihood * severity;
    if (Math.abs(expected - riskResult) > Number.EPSILON) {
      throw new Error("LGU Action Card rejected: deterministic risk result does not match likelihood × severity.");
    }
  }

  const methodology = record(why.methodology);
  const parameters = record(methodology.parameters);
  const categories = list(parameters.categories);
  const situation = record(card.situation);
  const riskCategory = textOrNull(situation.riskCategory);

  if (riskResult !== null && categories.length > 0 && riskCategory) {
    const expectedCategory = categories.find((category) => {
      const item = record(category);
      const min = numericOrNull(item.min);
      const max = numericOrNull(item.max);
      return min !== null && max !== null && riskResult >= min && riskResult <= max;
    });
    const label = textOrNull(record(expectedCategory).label);
    if (!label) {
      throw new Error("LGU Action Card rejected: methodology does not define a category for the risk result.");
    }
    if (label !== riskCategory) {
      throw new Error("LGU Action Card rejected: risk category does not match the documented methodology.");
    }
  }
}

function sanitizeExposure(raw: unknown, gaps: string[]) {
  const exposure = record(raw);
  const estimatedPopulation = numericOrNull(exposure.estimatedPopulation);
  const requiredMetadata = {
    estimationMethod: textOrNull(exposure.estimationMethod),
    source: textOrNull(exposure.source),
    referenceDate: textOrNull(exposure.referenceDate),
    confidenceLevel: textOrNull(exposure.confidenceLevel),
  };
  const missingMetadata = Object.entries(requiredMetadata)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const hasEstimate = estimatedPopulation !== null;
  const metadataComplete = missingMetadata.length === 0;

  if (hasEstimate && !metadataComplete) {
    gaps.push(
      `Potential population exposure withheld pending LGU validation because required metadata is missing: ${missingMetadata.join(", ")}.`,
    );
  }
  if (!hasEstimate) {
    gaps.push("Estimated potentially exposed population is not available from verified exposure data.");
  }

  return {
    estimatedPopulation: hasEstimate && metadataComplete ? exposure.estimatedPopulation : null,
    estimatedHouseholds:
      hasEstimate && metadataComplete ? (exposure.estimatedHouseholds ?? null) : null,
    vulnerableGroupEstimates:
      hasEstimate && metadataComplete ? (exposure.vulnerableGroupEstimates ?? null) : null,
    estimationMethod: requiredMetadata.estimationMethod,
    confidenceLevel: requiredMetadata.confidenceLevel,
    source: requiredMetadata.source,
    referenceDate: requiredMetadata.referenceDate,
    generatedAt: exposure.generatedAt ?? null,
    limitations: uniqueStrings(list(exposure.limitations)),
  };
}

function sanitizeRecommendations(raw: unknown, rules: ActionRule[], gaps: string[]) {
  const approved = new Map(
    rules
      .filter(
        (rule) =>
          rule.activeStatus &&
          rule.disasterPhase === "PRE_DISASTER" &&
          rule.targetAudience === "LGU",
      )
      .map((rule) => [rule.ruleId, rule] as const),
  );

  const candidates = list(raw);
  const sanitized: Row[] = [];
  let rejected = 0;

  for (const candidateValue of candidates) {
    const candidate = record(candidateValue);
    const actionRuleId = textOrNull(candidate.actionRuleId);
    const rule = actionRuleId ? approved.get(actionRuleId) : undefined;

    if (!rule) {
      rejected += 1;
      continue;
    }

    const evidence = record(candidate.evidence);
    const exactMatch =
      textOrNull(candidate.action) === rule.approvedAction &&
      textOrNull(candidate.whyItApplies) === rule.whyItApplies &&
      textOrNull(candidate.trigger) === canonicalTrigger(rule) &&
      textOrNull(candidate.source) === canonicalSource(rule) &&
      textOrNull(evidence.field) === rule.field &&
      Object.prototype.hasOwnProperty.call(evidence, "value");

    if (!exactMatch || isProhibitedRecommendation(rule.approvedAction)) {
      rejected += 1;
      continue;
    }

    const status = textOrNull(candidate.status);
    sanitized.push({
      actionRuleId: rule.ruleId,
      trigger: canonicalTrigger(rule),
      action: rule.approvedAction,
      whyItApplies: rule.whyItApplies,
      evidence: { field: rule.field, value: evidence.value },
      source: canonicalSource(rule),
      responsibleUnit: textOrNull(rule.responsibleUnit),
      requiresLguConfirmation: Boolean(rule.requiresLguConfirmation),
      status: status && VALID_ACTION_STATUSES.has(status) ? status : "RECOMMENDED",
      version: rule.version,
    });
  }

  if (rejected > 0) {
    gaps.push(
      `${rejected} unsupported or untraceable LGU recommendation${rejected === 1 ? " was" : "s were"} withheld by the sanitizer.`,
    );
  }

  return sanitized;
}

export function sanitizeLGUActionCard(cardValue: unknown, rules: ActionRule[]) {
  const card = record(cardValue);
  if (card.outputType !== "LGU_ACTION_CARD") {
    throw new Error("LGU Action Card rejected: invalid output type.");
  }

  assertDeterministicRisk(card);

  const why = record(card.whyAttentionIsNeeded);
  const capacity = record(card.preparednessCapacity);
  const situation = record(card.situation);
  const gaps = uniqueStrings([
    ...list(why.missingInformation),
    ...list(why.limitations),
    ...list(why.capacityLimitations),
  ]);

  const exposure = sanitizeExposure(card.potentialExposure, gaps);

  if (!textOrNull(capacity.communicationAccess)) {
    gaps.push("Communication capability requires LGU confirmation.");
  }

  const criticalFacilities = list(capacity.criticalFacilities);
  if (
    criticalFacilities.some((facility) => {
      const status = textOrNull(record(facility).operationalStatus);
      return !status || status === "UNVERIFIED";
    })
  ) {
    gaps.push("One or more critical-facility operating statuses require LGU confirmation.");
  }

  const recommendations = sanitizeRecommendations(card.recommendedActions, rules, gaps);

  return {
    ...card,
    situation: {
      ...situation,
      riskCategory: situation.riskCategory ?? null,
      deterministicCalculation: situation.deterministicCalculation ?? null,
      assessmentDate: situation.assessmentDate ?? null,
      verificationState: situation.verificationState ?? "FOR_REVIEW",
    },
    potentialExposure: exposure,
    preparednessCapacity: {
      ...capacity,
      communicationAccess: capacity.communicationAccess ?? null,
      criticalFacilities,
    },
    whyAttentionIsNeeded: {
      ...why,
      missingInformation: uniqueStrings(gaps),
    },
    recommendedActions: recommendations,
    recommendationNotice:
      recommendations.length === 0 ? LGU_RECOMMENDATION_UNAVAILABLE : null,
    sanitization: {
      policy: "LGU_ACTION_CARD_V1",
      rejectedRecommendationCount: list(card.recommendedActions).length - recommendations.length,
    },
  };
}
