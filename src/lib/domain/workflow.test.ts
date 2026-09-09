import { describe, expect, it } from "vitest";
import { assertCurrentAdvisory } from "./advisory";
import { postImpactFacts } from "./postImpact";
import {
  generatePostImpactActionCard,
  generateHouseholdCard,
} from "./actionCards";
describe("operational workflow boundaries", () => {
  const advisory = {
    verificationStatus: "VERIFIED",
    validityStart: "2026-09-09T00:00:00Z",
    validityEnd: "2026-09-10T00:00:00Z",
    affectedAreas: ["Dalahican"],
  };
  const now = new Date("2026-09-09T12:00:00Z");
  it("rejects an advisory for another locality", () =>
    expect(() => assertCurrentAdvisory(advisory, "Ibabang Dupay", now)).toThrow(
      "cover",
    ));
  it("rejects not-yet-effective and expired advisories", () => {
    expect(() =>
      assertCurrentAdvisory(
        { ...advisory, validityStart: "2026-09-09T13:00:00Z" },
        "Dalahican",
        now,
      ),
    ).toThrow("not yet");
    expect(() =>
      assertCurrentAdvisory(
        { ...advisory, validityEnd: now.toISOString() },
        "Dalahican",
        now,
      ),
    ).toThrow("expired");
  });
  it("preserves 10 reported, 4 validated, and 6 awaiting validation from route-shaped records", () => {
    const facts = postImpactFacts(
      {
        reported_population: 10,
        validated_population: 4,
        reported_households: 3,
        validated_households: 1,
        validation_status: "FOR_REVIEW",
      },
      [],
    );
    const card = generatePostImpactActionCard({
      barangay: "Dalahican",
      eventReference: "TEST",
      facts,
      rules: [],
    });
    expect(card).toMatchObject({
      reportedAffectedPersons: 10,
      validatedAffectedPersons: 4,
      populationAwaitingValidation: 6,
    });
  });
  it("never treats unverified or negated text as a validated water need", () => {
    const review = {
      reported_population: 1,
      validated_population: 0,
      urgent_unmet_needs: "No water need",
      validation_status: "UNVERIFIED",
    };
    expect(postImpactFacts(review, []).waterNeedValidated).toBe(false);
    expect(
      postImpactFacts(review, [
        { water_need: true, verification_status: "UNVERIFIED" },
      ]).waterNeedValidated,
    ).toBe(false);
    expect(
      postImpactFacts(review, [
        { water_need: true, verification_status: "VERIFIED" },
      ]).waterNeedValidated,
    ).toBe(true);
  });
  it("uses only a stored approved Filipino translation", () => {
    const card = generateHouseholdCard({
      barangay: "Dalahican",
      profile: { hasPets: true },
      advisory: {
        ...advisory,
        validityStart: "2020-01-01",
        validityEnd: "2099-01-01",
      },
      language: "fil",
      rules: [
        {
          ruleId: "PET",
          disasterPhase: "HOUSEHOLD",
          field: "hasPets",
          operator: "TRUTHY",
          threshold: true,
          approvedAction: "Prepare pet supplies.",
          approvedActionFil: "Ihanda ang gamit ng alagang hayop.",
          whyItApplies: "Pets reported.",
          whyItAppliesFil: "May alagang hayop.",
          sourceAgency: "SYNTHETIC",
          sourceDocument: "Test",
          targetAudience: "HOUSEHOLD",
          responsibleUnit: "Household",
          requiresLguConfirmation: false,
          version: "1",
          activeStatus: true,
        },
      ],
    });
    expect(card.actions[0].title).toBe("Ihanda ang gamit ng alagang hayop.");
    expect(card.actions[0].sourceRule).toContain("PET");
  });
});
