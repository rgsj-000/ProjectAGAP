import { describe, expect, it } from "vitest";
import { inferCoverageLevel, resolveAdvisoryApplicability } from "./advisoryCoverage";

const barangays = [
  { barangay_name: "Dalahican", city: "Lucena City" },
  { barangay_name: "Cotta", city: "Lucena City" },
  { barangay_name: "Gulang-gulang", city: "Lucena City" },
];

describe("resolveAdvisoryApplicability", () => {
  it("maps a Quezon province advisory to all Lucena City barangays", () => {
    expect(
      resolveAdvisoryApplicability({
        coverageLevel: "PROVINCE",
        sourceAreas: ["Quezon"],
        barangays,
      }),
    ).toEqual(["Dalahican", "Cotta", "Gulang-gulang"]);
  });

  it("maps a Lucena City advisory to all local barangays", () => {
    expect(
      resolveAdvisoryApplicability({
        coverageLevel: "CITY_MUNICIPALITY",
        sourceAreas: ["Lucena City"],
        barangays,
      }),
    ).toEqual(["Dalahican", "Cotta", "Gulang-gulang"]);
  });

  it("keeps barangay-specific coverage narrow", () => {
    expect(
      resolveAdvisoryApplicability({
        coverageLevel: "BARANGAY",
        sourceAreas: ["Barangay Cotta"],
        barangays,
      }),
    ).toEqual(["Cotta"]);
  });

  it("does not map unrelated province coverage into Lucena", () => {
    expect(
      resolveAdvisoryApplicability({
        coverageLevel: "PROVINCE",
        sourceAreas: ["Laguna"],
        barangays,
      }),
    ).toEqual([]);
  });

  it("infers Quezon as province coverage", () => {
    expect(inferCoverageLevel(["Quezon"], barangays)).toBe("PROVINCE");
  });
});
