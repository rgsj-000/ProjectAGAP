import { describe, expect, it } from "vitest";
import { evaluateActionRules, type ActionRule } from "./actionRuleEngine";
import {
  LGU_RECOMMENDATION_UNAVAILABLE,
  sanitizeLGUActionCard,
} from "./lguActionCardSanitizer";

const rule: ActionRule = {
  ruleId: "PREP-RISK-001",
  disasterPhase: "PRE_DISASTER",
  field: "riskCategory",
  operator: "EQ",
  threshold: "HIGH",
  approvedAction: "Validate current barangay conditions.",
  whyItApplies: "The documented risk category requires priority LGU review.",
  sourceAgency: "Test LGU",
  sourceDocument: "Approved action register",
  targetAudience: "LGU",
  responsibleUnit: "CDRRMO",
  requiresLguConfirmation: true,
  version: "1.0",
  activeStatus: true,
};

function card() {
  return {
    outputType: "LGU_ACTION_CARD",
    situation: {
      barangay: "Dalahican",
      hazard: "Flood",
      riskCategory: "HIGH",
      deterministicCalculation: "3 × 4 = 12",
      assessmentDate: "2026-09-10T00:00:00Z",
      verificationState: "VERIFIED",
    },
    potentialExposure: {
      estimatedPopulation: 1200,
      estimatedHouseholds: 300,
      vulnerableGroupEstimates: { olderPersons: 80 },
      estimationMethod: "Population grid intersection",
      confidenceLevel: "HIGH",
      source: "Authorized population grid",
      referenceDate: "2025-01-01",
      generatedAt: "2026-09-10T00:00:00Z",
      affectedPopulation: 999999,
      limitations: [],
    },
    preparednessCapacity: {
      validatedCapacity: 900,
      capacityGap: 300,
      communicationAccess: "AVAILABLE",
      criticalFacilities: [{ name: "Health Center", operationalStatus: "VERIFIED" }],
    },
    whyAttentionIsNeeded: {
      riskInputs: { likelihood: 3, severity: 4 },
      riskResult: 12,
      methodology: {
        name: "Test 5x5",
        version: "1",
        source: "Documented methodology",
        parameters: {
          categories: [
            { min: 1, max: 4, label: "LOW" },
            { min: 5, max: 9, label: "MODERATE" },
            { min: 10, max: 16, label: "HIGH" },
            { min: 17, max: 25, label: "VERY_HIGH" },
          ],
        },
      },
      limitations: [],
      capacityLimitations: [],
      missingInformation: [],
    },
    recommendedActions: evaluateActionRules(
      [rule],
      { riskCategory: "HIGH" },
      "PRE_DISASTER",
    ),
  };
}

describe("LGU Action Card sanitizer", () => {
  it("preserves a source-anchored approved recommendation", () => {
    const result = sanitizeLGUActionCard(card(), [rule]);
    expect(result.recommendedActions).toHaveLength(1);
    expect(result.recommendedActions[0]).toMatchObject({
      actionRuleId: "PREP-RISK-001",
      action: "Validate current barangay conditions.",
      responsibleUnit: "CDRRMO",
      requiresLguConfirmation: true,
    });
    expect(result.recommendationNotice).toBeNull();
  });

  it("drops a recommendation that does not have an approved action-rule id", () => {
    const input: any = card();
    input.recommendedActions = [
      {
        action: "Evacuate immediately.",
        trigger: "riskCategory EQ \"HIGH\"",
        whyItApplies: "AI generated",
        source: "AI",
        evidence: { field: "riskCategory", value: "HIGH" },
      } as any,
    ];

    const result = sanitizeLGUActionCard(input, [rule]);
    expect(result.recommendedActions).toEqual([]);
    expect(result.recommendationNotice).toBe(LGU_RECOMMENDATION_UNAVAILABLE);
    expect(result.whyAttentionIsNeeded.missingInformation.join(" ")).toContain("withheld");
  });

  it("drops a recommendation whose text was changed after rule matching", () => {
    const input: any = card();
    input.recommendedActions[0].action = "Immediately evacuate all residents.";

    const result = sanitizeLGUActionCard(input, [rule]);
    expect(result.recommendedActions).toEqual([]);
    expect(result.recommendationNotice).toBe(LGU_RECOMMENDATION_UNAVAILABLE);
  });

  it("withholds population estimates when provenance metadata is incomplete", () => {
    const input: any = card();
    input.potentialExposure.source = null;

    const result = sanitizeLGUActionCard(input, [rule]);
    expect(result.potentialExposure.estimatedPopulation).toBeNull();
    expect(result.potentialExposure.estimatedHouseholds).toBeNull();
    expect(result.whyAttentionIsNeeded.missingInformation.join(" ")).toContain(
      "required metadata is missing",
    );
  });

  it("does not carry pre-disaster affected-population fields into the sanitized output", () => {
    const result = sanitizeLGUActionCard(card(), [rule]);
    expect("affectedPopulation" in result.potentialExposure).toBe(false);
  });

  it("rejects a risk result that does not equal likelihood × severity", () => {
    const input: any = card();
    input.whyAttentionIsNeeded.riskResult = 13;
    expect(() => sanitizeLGUActionCard(input, [rule])).toThrow(
      /deterministic risk result/,
    );
  });

  it("rejects a risk category that disagrees with the documented methodology", () => {
    const input: any = card();
    input.situation.riskCategory = "LOW";
    expect(() => sanitizeLGUActionCard(input, [rule])).toThrow(
      /risk category does not match/,
    );
  });
});
