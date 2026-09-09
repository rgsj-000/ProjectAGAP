import type { LGUActionCardProps } from "@/components/assessment/LGUActionCard";
import type {
  PostImpactActionCardProps,
  PostImpactActionStatus,
} from "@/components/recovery/PostImpactActionCard";

export const DEMO_TIMESTAMP = "2026-09-09T08:30:00+08:00";
export const DEMO_VALID_UNTIL = "2026-09-10T20:00:00+08:00";

export const DEMO_ADVISORY = {
  sourceAgency: "PAGASA",
  reference: "Tropical Cyclone Bulletin No. 08 (Synthetic)",
  issuedAt: "09 September 2026, 8:00 AM",
  validity: "10 September 2026, 8:00 PM",
  hazard: "Typhoon · heavy rainfall and strong winds",
  affectedArea: "Lucena City, Quezon",
  verificationState: "VERIFIED" as const,
  summary:
    "Synthetic PAGASA-style demonstration advisory covering Lucena City. Heavy rainfall, strong winds, and localized flooding are used only to demonstrate AGAP's verified-information workflow.",
};

export type DemoPriority = {
  id: string;
  priority: number;
  barangay: string;
  risk: "HIGH" | "MODERATE" | "LOW";
  exposure: number;
  households: number;
  capacity: number;
  gap: number;
  verification: "VERIFIED" | "FOR_REVIEW";
  likelihood: number;
  severity: number;
  vulnerable: number;
  communications: string;
  facility: string;
};

export const DEMO_PRIORITIES: DemoPriority[] = [
  {
    id: "dalahican",
    priority: 1,
    barangay: "Dalahican",
    risk: "HIGH",
    exposure: 4_820,
    households: 1_146,
    capacity: 2_100,
    gap: 2_720,
    verification: "VERIFIED",
    likelihood: 4,
    severity: 4,
    vulnerable: 612,
    communications: "VHF radio and barangay announcements; mobile signal intermittent",
    facility: "Health center ready; two school shelters require utility confirmation",
  },
  {
    id: "cotta",
    priority: 2,
    barangay: "Cotta",
    risk: "HIGH",
    exposure: 3_260,
    households: 776,
    capacity: 1_900,
    gap: 1_360,
    verification: "FOR_REVIEW",
    likelihood: 4,
    severity: 4,
    vulnerable: 401,
    communications: "SMS and barangay announcements available",
    facility: "Health center ready; shelter sanitation requires confirmation",
  },
  {
    id: "gulang-gulang",
    priority: 3,
    barangay: "Gulang-Gulang",
    risk: "MODERATE",
    exposure: 2_180,
    households: 519,
    capacity: 2_400,
    gap: 0,
    verification: "VERIFIED",
    likelihood: 3,
    severity: 3,
    vulnerable: 286,
    communications: "VHF radio, SMS, and barangay announcements available",
    facility: "Health center and designated shelters recorded operational",
  },
  {
    id: "ibabang-iyam",
    priority: 4,
    barangay: "Ibabang Iyam",
    risk: "MODERATE",
    exposure: 1_430,
    households: 340,
    capacity: 1_200,
    gap: 230,
    verification: "FOR_REVIEW",
    likelihood: 3,
    severity: 3,
    vulnerable: 172,
    communications: "Mobile internet and barangay announcements available",
    facility: "Shelter generator status awaiting confirmation",
  },
  {
    id: "mayao-kanluran",
    priority: 5,
    barangay: "Mayao Kanluran",
    risk: "LOW",
    exposure: 610,
    households: 145,
    capacity: 900,
    gap: 0,
    verification: "VERIFIED",
    likelihood: 2,
    severity: 2,
    vulnerable: 73,
    communications: "Barangay announcements and radio available",
    facility: "Recorded operational",
  },
];

const action = (
  id: string,
  title: string,
  trigger: string,
  reason: string,
  unit: string,
): NonNullable<LGUActionCardProps["recommendations"]>[number] => ({
  id,
  action: title,
  trigger,
  whyItApplies: reason,
  evidence: `${DEMO_ADVISORY.reference}; synthetic Lucena preparedness baseline dated 08 September 2026`,
  sourceRule: `${id} · AGAP Approved Action Rule Library v1.2`,
  confirmationRequired: true,
  responsibleUnit: unit,
  status: "FOR_VALIDATION",
});

export function getDemoLguCard(row: DemoPriority): LGUActionCardProps {
  const riskScore = row.likelihood * row.severity;
  return {
    barangayName: row.barangay,
    hazard: DEMO_ADVISORY.hazard,
    advisory: {
      title: DEMO_ADVISORY.summary,
      reference: DEMO_ADVISORY.reference,
      issuedAt: DEMO_ADVISORY.issuedAt,
      validity: DEMO_ADVISORY.validity,
      verificationState: DEMO_ADVISORY.verificationState,
    },
    assessment: {
      likelihood: String(row.likelihood),
      severity: String(row.severity),
      riskResult: `${riskScore} · ${row.risk}`,
      relativeVulnerability: Number((row.vulnerable / row.exposure).toFixed(2)),
      methodology: "Lucena DRRM Deterministic Risk Matrix · v1.2 · CDRRMO",
      assessmentDate: "09 September 2026, 8:30 AM",
      verificationState: row.verification === "VERIFIED" ? "VERIFIED" : "FOR_REVIEW",
    },
    exposure: {
      estimatedPersons: row.exposure.toLocaleString("en-PH"),
      estimatedHouseholds: row.households.toLocaleString("en-PH"),
      vulnerableGroups: `${row.vulnerable.toLocaleString("en-PH")} estimated persons`,
      estimationMethod: "Population baseline × inhabited-area exposure ratio",
      confidenceLevel: row.verification === "VERIFIED" ? "MEDIUM" : "LOW — field validation pending",
      source: "Synthetic PSA-style population baseline + LGU exposure layer",
      referenceDate: "08 September 2026",
      generatedAt: "09 September 2026, 8:30 AM",
    },
    capacity: {
      recordedCapacity: `${row.capacity.toLocaleString("en-PH")} persons`,
      potentialCapacityGap:
        row.gap > 0 ? `${row.gap.toLocaleString("en-PH")} persons` : "No modeled gap",
      criticalFacilityReadiness: row.facility,
      communicationCapability: row.communications,
    },
    evidence: [
      `Likelihood ${row.likelihood} and severity ${row.severity} produce ${riskScore} under the adopted matrix.`,
      `${row.exposure.toLocaleString("en-PH")} potentially exposed persons are estimated from the recorded population baseline.`,
      row.gap > 0
        ? `Modeled exposure exceeds recorded temporary-shelter capacity by ${row.gap.toLocaleString("en-PH")} persons.`
        : "Recorded temporary-shelter capacity meets the current modeled exposure estimate.",
    ],
    dataGaps: [
      "Current shelter occupancy has not been field-validated.",
      "Road access and utility continuity must be confirmed by the LGU.",
      "All population figures are estimates, not validated post-impact counts.",
    ],
    recommendations: [
      action("AR-PRE-001", "Validate current barangay conditions", `Risk category is ${row.risk}`, "The deterministic assessment requires a current field check.", "Barangay DRRM Committee"),
      action("AR-CAP-004", "Verify shelter readiness", row.gap > 0 ? "Possible capacity gap detected" : "Shelter use may be required", "Capacity, utilities, accessibility, and occupancy must be confirmed.", "City Social Welfare and Development Office"),
      action("AR-FAC-002", "Confirm critical facility readiness", "Barangay is inside the verified advisory area", row.facility, "City Health Office / Engineering Office"),
      action("AR-COM-003", "Prepare a verified public communication brief", "Verified advisory is active", "Residents need source-anchored preparedness information without automated evacuation decisions.", "Public Information Office"),
    ],
  };
}

export type DemoReport = {
  id: string;
  barangay: string;
  type: string;
  summary: string;
  reportedPersons: number;
  validatedPersons: number;
  needs: string[];
  source: string;
  status: "UNVERIFIED" | "REVIEWED" | "VALIDATED";
};

export const DEMO_REPORTS: DemoReport[] = [
  { id: "RPT-104", barangay: "Dalahican", type: "Localized flooding", summary: "Floodwater reported in two low-lying sitios; road access remains passable to light vehicles.", reportedPersons: 286, validatedPersons: 214, needs: ["Potable water", "Medicine verification"], source: "Barangay field team", status: "VALIDATED" },
  { id: "RPT-107", barangay: "Dalahican", type: "Roof damage", summary: "Cluster of light-material homes reported with partial roof damage.", reportedPersons: 94, validatedPersons: 0, needs: ["Temporary shelter", "Tarpaulins"], source: "Community responder", status: "REVIEWED" },
  { id: "RPT-112", barangay: "Cotta", type: "Service disruption", summary: "Intermittent power and low water pressure reported near the coastal zone.", reportedPersons: 168, validatedPersons: 0, needs: ["Water assessment", "Utility coordination"], source: "Barangay operations desk", status: "UNVERIFIED" },
  { id: "RPT-116", barangay: "Gulang-Gulang", type: "Access constraint", summary: "Fallen branches reduced one access road to a single lane.", reportedPersons: 42, validatedPersons: 42, needs: ["Clearing team"], source: "City engineering field unit", status: "VALIDATED" },
];

const postAction = (
  id: string,
  phase: "IMMEDIATE" | "STABILIZATION" | "MITIGATION",
  title: string,
  unit: string,
  status: PostImpactActionStatus,
): NonNullable<PostImpactActionCardProps["actions"]>[number] => ({
  id,
  phase,
  action: title,
  whyItApplies: "Matched against validated and pending-validation impact information; authorized review remains required.",
  evidence: "Synthetic damage and needs reports RPT-104 and RPT-107",
  sourceRule: `${id} · AGAP Post-Impact Rule Library v1.1`,
  responsibleUnit: unit,
  confirmationRequired: true,
  status,
});

export const DEMO_POST_IMPACT: PostImpactActionCardProps = {
  barangayName: "Dalahican",
  eventName: DEMO_ADVISORY.reference,
  observedImpacts: {
    reportedAffectedPersons: "380",
    validatedAffectedPersons: "214",
    awaitingValidationPersons: "166",
    reportedAffectedHouseholds: "91",
    validatedAffectedHouseholds: "51",
    vulnerableGroupsReported: "63 reported; 41 validated",
    damageSummary: "Localized flooding and partial roof damage reported in low-lying sitios.",
    criticalFacilityCondition: "Health center operational; school shelter utilities awaiting confirmation.",
    serviceDisruption: "Intermittent power; water pressure under review.",
    accessibilityConstraints: "One local road passable only to light vehicles.",
    urgentUnmetNeeds: "Potable water confirmation, temporary shelter assessment, and medicine requirements validation.",
    verificationState: "PARTIALLY_VERIFIED",
    lastValidatedAt: "09 September 2026, 10:15 AM",
  },
  preEventComparison: {
    estimatedPotentiallyExposedPopulation: "4,820 persons (estimate)",
    estimateMethod: "Population baseline × inhabited-area exposure ratio",
    estimateConfidence: "MEDIUM",
  },
  dataGaps: [
    "166 reported affected persons remain pending validation.",
    "Temporary shelter requirements and current occupancy are not yet confirmed.",
    "Potable water and essential medicine quantities require field validation.",
  ],
  actions: [
    postAction("AR-PI-001", "IMMEDIATE", "Validate remaining affected households", "Barangay DRRM Committee", "IN_PROGRESS"),
    postAction("AR-PI-002", "IMMEDIATE", "Confirm potable water and medicine requirements", "City Health Office", "FOR_VALIDATION"),
    postAction("AR-PI-003", "IMMEDIATE", "Assess temporary shelter requirements", "CSWDO", "ASSIGNED"),
    postAction("AR-ST-002", "STABILIZATION", "Verify critical facility and utility status", "Engineering Office", "RECOMMENDED"),
    postAction("AR-ST-005", "STABILIZATION", "Validate road and access conditions", "Engineering Office", "IN_PROGRESS"),
    postAction("AR-MIT-004", "MITIGATION", "Review drainage and shelter-capacity gaps", "CDRRMO / Planning Office", "RECOMMENDED"),
  ],
};
