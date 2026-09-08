export type PrimaryModuleId = "home" | "prepare" | "report-damage" | "recovery";

export type PrepareSubView =
  | "menu"
  | "priority-barangays"
  | "barangay-detail"
  | "advisory-detail"
  | "prep-brief"
  | "action-card"
  | "barangay-info";

export interface NavItemConfig {
  id: PrimaryModuleId;
  titleEn: string;
  titleFil: string;
  shortLabelEn: string;
  shortLabelFil: string;
  descriptionEn: string;
  descriptionFil: string;
  iconName: string;
}

export const PRIMARY_NAV_ITEMS: NavItemConfig[] = [
  {
    id: "home",
    titleEn: "Home",
    titleFil: "Tahanan",
    shortLabelEn: "Home",
    shortLabelFil: "Tahanan",
    descriptionEn:
      "Operational overview of advisories, verified assessment information, connectivity, and data freshness for Lucena City.",
    descriptionFil:
      "Operational na buod ng mga abiso, beripikadong assessment information, koneksyon, at pagiging napapanahon ng datos para sa Lungsod ng Lucena.",
    iconName: "Home",
  },
  {
    id: "prepare",
    titleEn: "Preparedness",
    titleFil: "Paghahanda",
    shortLabelEn: "Preparedness",
    shortLabelFil: "Paghahanda",
    descriptionEn:
      "Review barangay risk assessments, LGU Action Cards, preparedness briefs, and household preparedness guidance.",
    descriptionFil:
      "Suriin ang risk assessment ng barangay, LGU Action Cards, mga buod ng paghahanda, at household preparedness guidance.",
    iconName: "Shield",
  },
  {
    id: "report-damage",
    titleEn: "Damage & Needs",
    titleFil: "Pinsala at Pangangailangan",
    shortLabelEn: "Damage & Needs",
    shortLabelFil: "Pinsala at Kailangan",
    descriptionEn:
      "Record reported damage, urgent needs, verification state, and field information for authorized review.",
    descriptionFil:
      "Itala ang reported na pinsala, agarang pangangailangan, verification state, at field information para sa awtorisadong review.",
    iconName: "FileEdit",
  },
  {
    id: "recovery",
    titleEn: "Post Impact",
    titleFil: "Post Impact",
    shortLabelEn: "Post Impact",
    shortLabelFil: "Post Impact",
    descriptionEn:
      "Review reported versus validated impacts, urgent unmet needs, and source-anchored LGU actions.",
    descriptionFil:
      "Suriin ang reported at validated impacts, agarang hindi natutugunang pangangailangan, at source-anchored LGU actions.",
    iconName: "TrendingUp",
  },
];

export interface EmergencyContact {
  agencyEn: string;
  agencyFil: string;
  contactNumber: string;
  descriptionEn: string;
  descriptionFil: string;
  verificationState: "UNVERIFIED" | "VERIFIED";
  verificationNoteEn: string;
  verificationNoteFil: string;
  isPrimary?: boolean;
}

/**
 * Safety note:
 * Contact numbers are intentionally not populated until they are verified
 * against an authorized LGU/agency directory. Do not replace "—" with
 * remembered, assumed, or search-snippet numbers without source verification.
 */
export const LUCENA_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    agencyEn: "Lucena City CDRRMO",
    agencyFil: "Lucena City CDRRMO",
    contactNumber: "—",
    descriptionEn: "City disaster-response contact entry awaiting official verification.",
    descriptionFil: "City disaster-response contact entry na naghihintay ng opisyal na verification.",
    verificationState: "UNVERIFIED",
    verificationNoteEn: "Verify through an authorized Lucena City directory before operational use.",
    verificationNoteFil: "I-verify sa awtorisadong Lucena City directory bago gamitin sa operasyon.",
    isPrimary: true,
  },
  {
    agencyEn: "National Emergency Hotline",
    agencyFil: "Pambansang Emergency Hotline",
    contactNumber: "—",
    descriptionEn: "Emergency-hotline entry awaiting authoritative verification.",
    descriptionFil: "Emergency-hotline entry na naghihintay ng authoritative verification.",
    verificationState: "UNVERIFIED",
    verificationNoteEn: "Confirm the current official hotline before displaying or dialing.",
    verificationNoteFil: "Kumpirmahin ang kasalukuyang opisyal na hotline bago ipakita o tawagan.",
    isPrimary: true,
  },
  {
    agencyEn: "Philippine Red Cross — Lucena / Quezon",
    agencyFil: "Philippine Red Cross — Lucena / Quezon",
    contactNumber: "—",
    descriptionEn: "Humanitarian-response contact entry awaiting official verification.",
    descriptionFil: "Humanitarian-response contact entry na naghihintay ng opisyal na verification.",
    verificationState: "UNVERIFIED",
    verificationNoteEn: "Verify the current chapter contact through an authorized source.",
    verificationNoteFil: "I-verify ang kasalukuyang chapter contact sa awtorisadong source.",
  },
  {
    agencyEn: "Lucena City Police",
    agencyFil: "Pulisya ng Lungsod ng Lucena",
    contactNumber: "—",
    descriptionEn: "Police contact entry awaiting official verification.",
    descriptionFil: "Police contact entry na naghihintay ng opisyal na verification.",
    verificationState: "UNVERIFIED",
    verificationNoteEn: "Verify through an authorized PNP/LGU directory before operational use.",
    verificationNoteFil: "I-verify sa awtorisadong PNP/LGU directory bago gamitin sa operasyon.",
  },
  {
    agencyEn: "Bureau of Fire Protection — Lucena",
    agencyFil: "Bureau of Fire Protection — Lucena",
    contactNumber: "—",
    descriptionEn: "Fire and rescue contact entry awaiting official verification.",
    descriptionFil: "Fire at rescue contact entry na naghihintay ng opisyal na verification.",
    verificationState: "UNVERIFIED",
    verificationNoteEn: "Verify through an authorized BFP directory before operational use.",
    verificationNoteFil: "I-verify sa awtorisadong BFP directory bago gamitin sa operasyon.",
  },
  {
    agencyEn: "Quezon Medical Center",
    agencyFil: "Quezon Medical Center",
    contactNumber: "—",
    descriptionEn: "Medical-facility contact entry awaiting official verification.",
    descriptionFil: "Medical-facility contact entry na naghihintay ng opisyal na verification.",
    verificationState: "UNVERIFIED",
    verificationNoteEn: "Verify the current facility contact through an authorized directory.",
    verificationNoteFil: "I-verify ang kasalukuyang facility contact sa awtorisadong directory.",
  },
];

export type AssessmentVerificationState =
  | "UNVERIFIED"
  | "FOR_REVIEW"
  | "VERIFIED"
  | "STALE";

export interface RiskAssessmentSnapshot {
  likelihood: string | null;
  severity: string | null;
  riskResult: string | null;
  relativeVulnerability: number | null;
  methodology: string | null;
  assessmentDate: string | null;
  verificationState: AssessmentVerificationState;
  confidenceLevel: string | null;
  evidence: string[];
  limitations: string[];
}

/**
 * Compatibility profile used by the current frontend navigation flow.
 *
 * IMPORTANT:
 * - This no longer stores an arbitrary 0–100 priority score.
 * - It does not assign a risk category in the frontend.
 * - Deterministic risk fields remain empty until supplied by the backend.
 * - Profile/context fields are nullable until verified source data is connected.
 *
 * The name is kept temporarily to avoid breaking NavigationContext while the
 * frontend is migrated one file at a time.
 */
export interface BarangayPriority {
  id: string;
  name: string;
  population: string | null;
  vulnerableCount: string | null;
  evacuationCenter: string | null;
  mainReasonEn: string | null;
  mainReasonFil: string | null;
  recommendedActionEn: string | null;
  recommendedActionFil: string | null;
  riskAssessment: RiskAssessmentSnapshot;
}

const EMPTY_RISK_ASSESSMENT: RiskAssessmentSnapshot = {
  likelihood: null,
  severity: null,
  riskResult: null,
  relativeVulnerability: null,
  methodology: null,
  assessmentDate: null,
  verificationState: "UNVERIFIED",
  confidenceLevel: null,
  evidence: [],
  limitations: [],
};

/**
 * Temporary compatibility exports. These arrays provide barangay identities to
 * the existing UI only; their ordering is NOT an official risk or priority rank.
 * Verified profile and assessment values will come from the backend/Supabase.
 */
export const TOP_BARANGAYS: BarangayPriority[] = [
  {
    id: "dalahican",
    name: "Dalahican",
    population: null,
    vulnerableCount: null,
    evacuationCenter: null,
    mainReasonEn: null,
    mainReasonFil: null,
    recommendedActionEn: null,
    recommendedActionFil: null,
    riskAssessment: { ...EMPTY_RISK_ASSESSMENT },
  },
  {
    id: "cotta",
    name: "Cotta",
    population: null,
    vulnerableCount: null,
    evacuationCenter: null,
    mainReasonEn: null,
    mainReasonFil: null,
    recommendedActionEn: null,
    recommendedActionFil: null,
    riskAssessment: { ...EMPTY_RISK_ASSESSMENT },
  },
  {
    id: "barra",
    name: "Barra",
    population: null,
    vulnerableCount: null,
    evacuationCenter: null,
    mainReasonEn: null,
    mainReasonFil: null,
    recommendedActionEn: null,
    recommendedActionFil: null,
    riskAssessment: { ...EMPTY_RISK_ASSESSMENT },
  },
  {
    id: "gulang-gulang",
    name: "Gulang-gulang",
    population: null,
    vulnerableCount: null,
    evacuationCenter: null,
    mainReasonEn: null,
    mainReasonFil: null,
    recommendedActionEn: null,
    recommendedActionFil: null,
    riskAssessment: { ...EMPTY_RISK_ASSESSMENT },
  },
  {
    id: "ibabang-dupay",
    name: "Ibabang Dupay",
    population: null,
    vulnerableCount: null,
    evacuationCenter: null,
    mainReasonEn: null,
    mainReasonFil: null,
    recommendedActionEn: null,
    recommendedActionFil: null,
    riskAssessment: { ...EMPTY_RISK_ASSESSMENT },
  },
];

export const OTHER_BARANGAYS: BarangayPriority[] = [
  {
    id: "mayao-crossing",
    name: "Mayao Crossing",
    population: null,
    vulnerableCount: null,
    evacuationCenter: null,
    mainReasonEn: null,
    mainReasonFil: null,
    recommendedActionEn: null,
    recommendedActionFil: null,
    riskAssessment: { ...EMPTY_RISK_ASSESSMENT },
  },
  {
    id: "ransohan",
    name: "Ransohan",
    population: null,
    vulnerableCount: null,
    evacuationCenter: null,
    mainReasonEn: null,
    mainReasonFil: null,
    recommendedActionEn: null,
    recommendedActionFil: null,
    riskAssessment: { ...EMPTY_RISK_ASSESSMENT },
  },
];

/**
 * @deprecated Compatibility export only.
 * The updated Project AGAP frontend does not use ranked recovery priorities,
 * arbitrary recovery levels, or invented relief quantities. Post-impact
 * decisions must use reported/validated evidence and source-anchored actions.
 */
export const RECOVERY_PRIORITIES: Array<Record<string, never>> = [];

/**
 * Compatibility placeholder used by the current UI until the advisory backend
 * is connected. Despite the legacy export name, this is NOT an official,
 * current, verified, or operational disaster advisory.
 */
export const CURRENT_OFFICIAL_ADVISORY = {
  titleEn: "No Verified Advisory Connected",
  titleFil: "Walang Nakakonektang Beripikadong Advisory",
  source: "Awaiting authorized advisory source",
  issuedTime: "—",
  status: "UNVERIFIED",
  statusFil: "HINDI BERIPIKADO",
  bulletinNumber: "—",
  validity: "—",
  affectedLocations: "—",
  warningInformation: "—",
  sourceUrl: "",
  verificationState: "UNVERIFIED" as const,
  leadParagraphEn:
    "No verified operational advisory is currently connected to this frontend prototype. Refer to the authorized issuing agency and backend-verified record before operational use.",
  leadParagraphFil:
    "Walang beripikadong operational advisory na nakakonekta sa frontend prototype na ito. Sumangguni sa awtorisadong issuing agency at backend-verified record bago gamitin sa operasyon.",
  precautionsEn: [],
  precautionsFil: [],
};

export const MOCK_USER = {
  name: "Demo LGU User",
  roleEn: "Authorized User Placeholder",
  roleFil: "Placeholder ng Awtorisadong User",
  assignedLgu: "Lucena City — Demo Context",
  assignedBarangay: "Not assigned in prototype",
  status: "Demo Only",
};
