import { describe, expect, it } from "vitest";
import { normalizeAdvisoryExtraction } from "./advisoryExtraction";

describe("normalizeAdvisoryExtraction", () => {
  it("marks unsupported or absent fields for human review", () => {
    const result = normalizeAdvisoryExtraction({
      title: "Heavy Rainfall Warning",
      source: "DOST-PAGASA",
      issuedTime: "2026-09-10T05:00",
      bulletinNumber: "Warning No. 4",
      validity: null,
      affectedLocations: ["Lucena City"],
      warningInformation: "Orange Rainfall Warning",
      sourceUrl: null,
      message: "Heavy rainfall is expected over the listed area.",
      precautions: [],
      warnings: ["The document does not state a validity end time."],
    });

    expect(result.extractedFields).toContain("title");
    expect(result.extractedFields).toContain("affectedLocations");
    expect(result.missingFields).toContain("validity");
    expect(result.missingFields).toContain("sourceUrl");
    expect(result.missingFields).toContain("precautions");
    expect(result.warnings).toEqual([
      "The document does not state a validity end time.",
    ]);
  });

  it("rejects an invented non-URL source link", () => {
    expect(() =>
      normalizeAdvisoryExtraction({
        title: null,
        source: null,
        issuedTime: null,
        bulletinNumber: null,
        validity: null,
        affectedLocations: [],
        warningInformation: null,
        sourceUrl: "pagasa",
        message: null,
        precautions: [],
        warnings: [],
      }),
    ).toThrow();
  });
});
