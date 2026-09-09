export type HelpLanguage = "en" | "fil";

export interface HelpContentDefinition {
  title: string;
  description: string;
}

type LocalizedHelpContent = Record<HelpLanguage, HelpContentDefinition>;

export const HELP_CONTENT = {

  likelihood: {
    en: {
      title: "Likelihood of Occurrence",
      description:
        "How likely the hazard or event is to occur under the adopted DRRM method. Based on documented inputs, not AI judgment.",
    },
    fil: {
      title: "Likelihood of Occurrence",
      description:
        "Gaano kalamang mangyari ang hazard o event ayon sa adopted DRRM method. Batay ito sa documented inputs, hindi AI judgment.",
    },
  },

  severity: {
    en: {
      title: "Severity of Consequence",
      description:
        "How serious the expected consequences may be if the hazard occurs. Used with likelihood to determine the risk result.",
    },
    fil: {
      title: "Severity of Consequence",
      description:
        "Gaano kaseryoso ang maaaring maging epekto kapag nangyari ang hazard. Ginagamit kasama ng likelihood para sa risk result.",
    },
  },

  riskResult: {
    en: {
      title: "Risk Result",
      description:
        "Result of the documented DRRM risk method using likelihood and severity. AGAP displays the result but does not let AI change it.",
    },
    fil: {
      title: "Risk Result",
      description:
        "Result ng documented DRRM risk method gamit ang likelihood at severity. Ipinapakita ito ng AGAP ngunit hindi ito binabago ng AI.",
    },
  },

  relativeVulnerability: {
    en: {
      title: "Relative Vulnerability",
      description:
        "Compares threat level with adaptive capacity when the required inputs are available. Higher values may indicate greater vulnerability.",
    },
    fil: {
      title: "Relative Vulnerability",
      description:
        "Paghahambing ng threat level at adaptive capacity kapag available ang required inputs. Mas mataas na value ay maaaring mangahulugang mas mataas na vulnerability.",
    },
  },

  potentiallyExposedPopulation: {
    en: {
      title: "Estimated Potentially Exposed Population",
      description:
        "Estimated people within the mapped hazard area before the event. Used for planning and not treated as confirmed affected population.",
    },
    fil: {
      title: "Estimated Potentially Exposed Population",
      description:
        "Tantyang bilang ng tao sa mapped hazard area bago ang event. Para ito sa planning at hindi confirmed affected population.",
    },
  },

  preparednessCapacity: {
    en: {
      title: "Preparedness Capacity",
      description:
        "Available readiness and resources such as shelter capacity, responders, equipment, backup power, communications, and critical facilities.",
    },
    fil: {
      title: "Preparedness Capacity",
      description:
        "Available readiness at resources tulad ng shelter capacity, responders, equipment, backup power, communications, at critical facilities.",
    },
  },

  potentialCapacityGap: {
    en: {
      title: "Potential Capacity Gap",
      description:
        "Difference between estimated potentially exposed population and validated capacity. A positive value needs LGU review, not automatic action.",
    },
    fil: {
      title: "Potential Capacity Gap",
      description:
        "Pagkakaiba ng estimated potentially exposed population at validated capacity. Ang positive value ay kailangan ng LGU review, hindi automatic action.",
    },
  },

  dataGaps: {
    en: {
      title: "Information Gaps and Limitations",
      description:
        "Missing, outdated, incomplete, or uncertain information that should be checked before operational use.",
    },
    fil: {
      title: "Information Gaps and Limitations",
      description:
        "Kulang, luma, incomplete, o uncertain na impormasyon na kailangang suriin bago operational use.",
    },
  },

  methodology: {
    en: {
      title: "Assessment Methodology",
      description:
        "Documented DRRM method, source, version, and rules used for the assessment.",
    },
    fil: {
      title: "Assessment Methodology",
      description:
        "Documented DRRM method, source, version, at rules na ginamit sa assessment.",
    },
  },


  reportedFigures: {
    en: {
      title: "Reported Figures",
      description:
        "Counts submitted from the field or barangay before authorized validation. They are not yet confirmed operational figures.",
    },
    fil: {
      title: "Reported Figures",
      description:
        "Mga bilang mula sa field o barangay bago authorized validation. Hindi pa ito confirmed operational figures.",
    },
  },

  fieldReportSeverity: {
    en: {
      title: "Reported Damage Severity",
      description:
        "Preliminary field classification of how serious the reported damage appears. It remains unverified until reviewed.",
    },
    fil: {
      title: "Reported Damage Severity",
      description:
        "Preliminary field classification kung gaano kaseryoso ang reported damage. Nananatili itong unverified hanggang review.",
    },
  },

  verificationStatus: {
    en: {
      title: "Verification Status",
      description:
        "Shows whether information is unverified, reviewed, or validated by an authorized LGU user.",
    },
    fil: {
      title: "Verification Status",
      description:
        "Ipinapakita kung unverified, reviewed, o validated na ang information ng authorized LGU user.",
    },
  },

  pendingSync: {
    en: {
      title: "Pending Sync",
      description:
        "Saved on the device but not yet synchronized with the AGAP server. It remains unverified until sync and review are completed.",
    },
    fil: {
      title: "Pending Sync",
      description:
        "Naka-save sa device ngunit hindi pa synchronized sa AGAP server. Unverified ito hanggang matapos ang sync at review.",
    },
  },

  reportSourceEvidence: {
    en: {
      title: "Report Source and Supporting Evidence",
      description:
        "Source, reference, or supporting material used to help verify the report, such as a team, bulletin, or photo.",
    },
    fil: {
      title: "Report Source and Supporting Evidence",
      description:
        "Source, reference, o supporting material para makatulong sa verification, tulad ng team, bulletin, o photo.",
    },
  },

  essentialServiceCondition: {
    en: {
      title: "Essential Service Condition",
      description:
        "Reported condition of services such as power, water, communications, transport, roads, or health services.",
    },
    fil: {
      title: "Essential Service Condition",
      description:
        "Reported condition ng services tulad ng kuryente, tubig, communications, transport, roads, o health services.",
    },
  },


  householdCode: {
    en: {
      title: "Household Code",
      description:
        "A privacy-friendly code used to retrieve the minimum household preparedness profile without requiring a full name or exact address.",
    },
    fil: {
      title: "Household Code",
      description:
        "Privacy-friendly code para makuha ang minimum household preparedness profile nang hindi kailangan ang full name o exact address.",
    },
  },

  quickHouseholdProfile: {
    en: {
      title: "Quick Household Profile",
      description:
        "Short questionnaire used to prepare household guidance based on members, special needs, housing, and communication methods.",
    },
    fil: {
      title: "Quick Household Profile",
      description:
        "Maikling questionnaire para sa household guidance batay sa members, special needs, housing, at communication methods.",
    },
  },

  genericBarangayCard: {
    en: {
      title: "General Barangay Preparedness Card",
      description:
        "General barangay guidance for residents who prefer not to provide household details.",
    },
    fil: {
      title: "Pangkalahatang Barangay Preparedness Card",
      description:
        "Pangkalahatang barangay guidance para sa residenteng ayaw magbigay ng household details.",
    },
  },

  householdPrivacy: {
    en: {
      title: "Household Privacy",
      description:
        "Full names and exact home addresses are not required. AGAP collects only the minimum information needed for preparedness guidance.",
    },
    fil: {
      title: "Household Privacy",
      description:
        "Hindi kailangan ang full name at exact home address. Minimum information lamang ang kinokolekta para sa preparedness guidance.",
    },
  },

  advisoryVerificationStatus: {
    en: {
      title: "Advisory Verification Status",
      description:
        "Shows whether advisory information has been confirmed against its official source. Unverified, pending, or stale records need caution.",
    },
    fil: {
      title: "Advisory Verification Status",
      description:
        "Ipinapakita kung nakumpirma ang advisory laban sa official source. Kailangan ng pag-iingat sa unverified, pending, o stale records.",
    },
  },

  approvedPreparednessActions: {
    en: {
      title: "Approved Preparedness Actions",
      description:
        "Preparedness guidance matched from approved source-based rules. AI may explain or translate it but cannot invent emergency instructions.",
    },
    fil: {
      title: "Approved Preparedness Actions",
      description:
        "Preparedness guidance mula sa approved source-based rules. Maaaring ipaliwanag o isalin ng AI ngunit hindi ito dapat mag-imbento ng emergency instructions.",
    },
  },


  socialImpactAffectedPopulation: {
    en: {
      title: "Social Impact — Affected Population & Households",
      description:
        "Human impact shown through affected persons, households, and vulnerable groups. Operational counts are kept as reported or validated.",
    },
    fil: {
      title: "Social Impact — Apektadong Populasyon at mga Sambahayan",
      description:
        "Human impact na ipinapakita sa affected persons, households, at vulnerable groups. Hiwalay ang reported at validated counts.",
    },
  },

  reportedAffectedPersons: {
    en: {
      title: "Reported Affected Persons",
      description:
        "Persons reported as affected but not yet confirmed through authorized validation.",
    },
    fil: {
      title: "Reported Affected Persons",
      description:
        "Mga taong naiulat na affected ngunit hindi pa confirmed sa authorized validation.",
    },
  },

  validatedAffectedPersons: {
    en: {
      title: "Validated Affected Persons",
      description:
        "Affected persons whose reported status has been checked and confirmed by authorized personnel.",
    },
    fil: {
      title: "Validated Affected Persons",
      description:
        "Affected persons na nasuri at nakumpirma na ng authorized personnel.",
    },
  },

  affectedPersonsPendingValidation: {
    en: {
      title: "Affected Persons Pending Validation",
      description:
        "Reported affected persons still waiting for checking or confirmation.",
    },
    fil: {
      title: "Affected Persons Pending Validation",
      description:
        "Reported affected persons na hinihintay pa ang checking o confirmation.",
    },
  },

  reportedAffectedHouseholds: {
    en: {
      title: "Reported Affected Households",
      description:
        "Households reported as affected but not yet confirmed through authorized validation.",
    },
    fil: {
      title: "Reported Affected Households",
      description:
        "Mga household na naiulat na affected ngunit hindi pa confirmed sa authorized validation.",
    },
  },

  validatedAffectedHouseholds: {
    en: {
      title: "Validated Affected Households",
      description:
        "Affected households whose reported status has been checked and confirmed by authorized personnel.",
    },
    fil: {
      title: "Validated Affected Households",
      description:
        "Affected households na nasuri at nakumpirma na ng authorized personnel.",
    },
  },

  reportedVulnerableGroups: {
    en: {
      title: "Reported Vulnerable Groups",
      description:
        "Reported affected groups that may need added support, such as children, older persons, PWDs, or people with essential medicine needs.",
    },
    fil: {
      title: "Reported Vulnerable Groups",
      description:
        "Reported affected groups na maaaring mangailangan ng dagdag na support, tulad ng children, older persons, PWDs, o may essential medicine needs.",
    },
  },

  damageLifelinesPriorityNeeds: {
    en: {
      title: "Damage, Status of Lifelines & Priority Needs",
      description:
        "Summary of reported damage, critical facilities, lifeline disruptions, access conditions, and urgent community needs.",
    },
    fil: {
      title: "Damage, Status of Lifelines & Priority Needs",
      description:
        "Buod ng reported damage, critical facilities, lifeline disruptions, access conditions, at urgent community needs.",
    },
  },

  reportedDamage: {
    en: {
      title: "Reported Damage",
      description:
        "Damage reported from the field or barangay that still follows the required verification process.",
    },
    fil: {
      title: "Reported Damage",
      description:
        "Pinsalang naiulat mula sa field o barangay na dadaan pa rin sa required verification process.",
    },
  },

  lifelineServiceDisruptions: {
    en: {
      title: "Lifeline Service Disruptions",
      description:
        "Interruptions to essential systems such as power, water, communications, transport, roads, and health services.",
    },
    fil: {
      title: "Lifeline Service Disruptions",
      description:
        "Mga interruption sa essential systems tulad ng kuryente, tubig, communications, transport, roads, at health services.",
    },
  },

  accessConditions: {
    en: {
      title: "Access Conditions",
      description:
        "Conditions affecting movement to and from the area, including roads, bridges, flooding, landslides, debris, or transport disruption.",
    },
    fil: {
      title: "Access Conditions",
      description:
        "Mga kondisyon na nakaaapekto sa pagpasok at paglabas sa area, kabilang ang roads, bridges, flooding, landslides, debris, o transport disruption.",
    },
  },

  prePostImpactComparison: {
    en: {
      title: "Pre-Disaster Exposure vs Validated Post-Disaster Impact",
      description:
        "Compares the planning estimate made before the event with impact information confirmed after the event.",
    },
    fil: {
      title: "Pre-Disaster Exposure vs Validated Post-Disaster Impact",
      description:
        "Paghahambing ng planning estimate bago ang event at confirmed impact information pagkatapos ng event.",
    },
  },


  currentAdvisory: {
    en: {
      title: "Current Advisory",
      description:
        "Official advisory currently linked to the assessment. Check its source, status, and validity before operational use.",
    },
    fil: {
      title: "Current Advisory",
      description:
        "Official advisory na kasalukuyang naka-link sa assessment. Suriin ang source, status, at validity bago operational use.",
    },
  },

  assessmentVerificationStatus: {
    en: {
      title: "Assessment Verification Status",
      description:
        "Shows whether the assessment has been reviewed and confirmed by an authorized LGU user.",
    },
    fil: {
      title: "Assessment Verification Status",
      description:
        "Ipinapakita kung nasuri at nakumpirma na ang assessment ng authorized LGU user.",
    },
  },

  exposureEstimationMethod: {
    en: {
      title: "Estimation Method",
      description:
        "Method used to estimate population exposure from available hazard and population data.",
    },
    fil: {
      title: "Estimation Method",
      description:
        "Paraan na ginamit upang tantiyahin ang population exposure mula sa available hazard at population data.",
    },
  },

  estimatedExposedHouseholds: {
    en: {
      title: "Estimated Exposed Households",
      description:
        "Estimated households that may be within the mapped hazard area. It is a planning estimate, not a confirmed affected-household count.",
    },
    fil: {
      title: "Estimated Exposed Households",
      description:
        "Tantyang households na maaaring nasa mapped hazard area. Planning estimate ito, hindi confirmed affected-household count.",
    },
  },

  estimatedVulnerableGroups: {
    en: {
      title: "Estimated Vulnerable Groups",
      description:
        "Estimated vulnerable groups within the potentially exposed population when supported by available demographic data.",
    },
    fil: {
      title: "Estimated Vulnerable Groups",
      description:
        "Tantyang vulnerable groups sa potentially exposed population kapag suportado ng available demographic data.",
    },
  },

  validatedShelterCapacity: {
    en: {
      title: "Validated Evacuation / Temporary-Shelter Capacity",
      description:
        "Recorded shelter capacity that has been checked or validated for planning use.",
    },
    fil: {
      title: "Validated Evacuation / Temporary-Shelter Capacity",
      description:
        "Recorded shelter capacity na nasuri o na-validate para sa planning use.",
    },
  },

  communicationCapability: {
    en: {
      title: "Communication Capability",
      description:
        "Available ways to receive, relay, or share emergency information, such as radio, SMS, mobile data, or barangay communication channels.",
    },
    fil: {
      title: "Communication Capability",
      description:
        "Available na paraan para tumanggap o magbahagi ng emergency information, tulad ng radio, SMS, mobile data, o barangay communication channels.",
    },
  },

  assessmentEvidence: {
    en: {
      title: "Assessment Evidence",
      description:
        "Verified records or observations supporting the assessment and recommended LGU review actions.",
    },
    fil: {
      title: "Assessment Evidence",
      description:
        "Verified records o observations na sumusuporta sa assessment at recommended LGU review actions.",
    },
  },

  recommendedLGUActions: {
    en: {
      title: "Recommended LGU Actions for Review",
      description:
        "Source-based actions matched to verified conditions for authorized LGU review. They are recommendations, not automatic orders.",
    },
    fil: {
      title: "Recommended LGU Actions for Review",
      description:
        "Source-based actions na na-match sa verified conditions para sa authorized LGU review. Recommendations ito, hindi automatic orders.",
    },
  },


  advisoryIssuingSource: {
    en: {
      title: "Issuing Source",
      description:
        "Authorized agency or office that issued the advisory, such as PAGASA, DOST, or Lucena CDRRMO.",
    },
    fil: {
      title: "Issuing Source",
      description:
        "Authorized agency o office na naglabas ng advisory, tulad ng PAGASA, DOST, o Lucena CDRRMO.",
    },
  },

  advisoryStatus: {
    en: {
      title: "Advisory Status",
      description:
        "Current operational state of the advisory record, such as active, being monitored, or ended.",
    },
    fil: {
      title: "Advisory Status",
      description:
        "Kasalukuyang operational state ng advisory record, tulad ng active, monitoring, o ended.",
    },
  },

  advisoryIssuedTime: {
    en: {
      title: "Issued / Updated Time",
      description:
        "Official time the advisory was issued or last updated by the source agency.",
    },
    fil: {
      title: "Issued / Updated Time",
      description:
        "Official time kung kailan inilabas o huling in-update ng source agency ang advisory.",
    },
  },

  advisoryBulletinReference: {
    en: {
      title: "Bulletin / Reference Number",
      description:
        "Official bulletin, advisory, or reference number used to trace the record back to its source.",
    },
    fil: {
      title: "Bulletin / Reference Number",
      description:
        "Official bulletin, advisory, o reference number para ma-trace ang record pabalik sa source.",
    },
  },

  advisoryAffectedLocations: {
    en: {
      title: "Affected Locations",
      description:
        "Only locations explicitly identified by the issuing source. Do not add places that are not listed in the official advisory.",
    },
    fil: {
      title: "Affected Locations",
      description:
        "Mga lugar lamang na tahasang tinukoy ng issuing source. Huwag magdagdag ng lugar na wala sa official advisory.",
    },
  },

  advisoryWarningInformation: {
    en: {
      title: "Warning Information",
      description:
        "Official warning details such as level, classification, rainfall range, wind signal, or other source-issued hazard information.",
    },
    fil: {
      title: "Warning Information",
      description:
        "Official warning details tulad ng level, classification, rainfall range, wind signal, o ibang source-issued hazard information.",
    },
  },

  advisorySourceLink: {
    en: {
      title: "Official Source Link",
      description:
        "Direct link to the official page or bulletin used to verify the advisory.",
    },
    fil: {
      title: "Official Source Link",
      description:
        "Direct link sa official page o bulletin na ginamit para i-verify ang advisory.",
    },
  },

  advisoryMainMessage: {
    en: {
      title: "Main Advisory Message",
      description:
        "Short verified summary of the advisory. Keep the meaning consistent with the official source.",
    },
    fil: {
      title: "Main Advisory Message",
      description:
        "Maikling verified summary ng advisory. Panatilihing kapareho ang meaning ng official source.",
    },
  },

  advisoryDirectives: {
    en: {
      title: "Key Directives / Precautions",
      description:
        "Official instructions or precautions stated by the issuing source. Do not add new emergency orders or safety claims.",
    },
    fil: {
      title: "Key Directives / Precautions",
      description:
        "Official instructions o precautions mula sa issuing source. Huwag magdagdag ng bagong emergency orders o safety claims.",
    },
  },

  onlineStatus: {
    en: {
      title: "Internet Connection",
      description:
        "Shows whether the device is online. Being online does not guarantee that AGAP data are current or synchronized.",
    },
    fil: {
      title: "Internet Connection",
      description:
        "Ipinapakita kung online ang device. Hindi garantiya ng pagiging online na current o synchronized ang AGAP data.",
    },
  },

  lastDataSync: {
    en: {
      title: "Last Data Sync",
      description:
        "Most recent successful synchronization with AGAP. Older sync times may mean some information is outdated.",
    },
    fil: {
      title: "Last Data Sync",
      description:
        "Pinakahuling successful synchronization sa AGAP. Kapag luma ang sync time, maaaring outdated ang ilang information.",
    },
  },

  advisoryValidUntil: {
    en: {
      title: "Advisory Valid Until",
      description:
        "Shows until when the current official advisory is valid. Expired or unconfirmed validity should not be treated as current.",
    },
    fil: {
      title: "Advisory Valid Until",
      description:
        "Ipinapakita hanggang kailan valid ang current official advisory. Huwag ituring na current kapag expired o unconfirmed ang validity.",
    },
  },

  affectedPopulationAndHouseholds: {
    en: {
      title: "Affected Population and Households",
      description:
        "Reported and validated counts of affected persons, households, and vulnerable groups. Reported values remain separate until authorized validation.",
    },
    fil: {
      title: "Apektadong Populasyon at mga Sambahayan",
      description:
        "Reported at validated na bilang ng affected persons, households, at vulnerable groups. Hiwalay ang reported values hanggang sa authorized validation.",
    },
  },

  criticalFacilities: {
    en: {
      title: "Status of Critical Facilities",
      description:
        "Operational condition of facilities needed for disaster response and essential services, such as health facilities, evacuation sites, EOCs, water, and communications.",
    },
    fil: {
      title: "Kalagayan ng Critical Facilities",
      description:
        "Operational condition ng mga pasilidad na mahalaga sa disaster response at essential services, tulad ng health facilities, evacuation sites, EOCs, tubig, at communications.",
    },
  },

  essentialServiceDisruptions: {
    en: {
      title: "Status of Lifelines",
      description:
        "Interruptions affecting essential systems such as power, water, communications, transport, roads, and health services.",
    },
    fil: {
      title: "Status of Lifelines",
      description:
        "Mga interruption sa mahahalagang sistema tulad ng kuryente, tubig, communications, transport, roads, at health services.",
    },
  },

  accessConstraints: {
    en: {
      title: "Access Conditions",
      description:
        "Road, bridge, flood, landslide, debris, or transport conditions that may limit movement to and from the affected area.",
    },
    fil: {
      title: "Access Conditions",
      description:
        "Kalagayan ng roads, bridges, baha, landslide, debris, o transport na maaaring magpahirap sa pagpasok at paglabas sa affected area.",
    },
  },

  priorityNeeds: {
    en: {
      title: "Priority Needs",
      description:
        "Urgent community needs reported for LGU review, such as water, shelter, medicines, rescue, or essential services.",
    },
    fil: {
      title: "Priority Needs",
      description:
        "Agarang pangangailangan ng komunidad para sa LGU review, tulad ng tubig, shelter, medicines, rescue, o essential services.",
    },
  },

  preDisasterExposureEstimate: {
    en: {
      title: "Pre-Disaster Exposure Estimate",
      description:
        "Planning estimate of people who may be within the mapped hazard area before the event. It is not a confirmed affected-population count.",
    },
    fil: {
      title: "Pre-Disaster Exposure Estimate",
      description:
        "Planning estimate ng mga taong maaaring nasa mapped hazard area bago ang event. Hindi ito confirmed affected-population count.",
    },
  },

  confidenceLevel: {
    en: {
      title: "Confidence Level",
      description:
        "Indicates how reliable the estimate is based on data quality, completeness, date, and spatial detail.",
    },
    fil: {
      title: "Confidence Level",
      description:
        "Ipinapakita kung gaano ka-reliable ang estimate batay sa data quality, completeness, date, at spatial detail.",
    },
  },

  validatedPostDisasterImpact: {
    en: {
      title: "Validated Post-Disaster Impact",
      description:
        "Post-disaster information checked and confirmed by authorized personnel. It remains separate from pre-disaster estimates.",
    },
    fil: {
      title: "Validated Post-Disaster Impact",
      description:
        "Post-disaster information na nasuri at nakumpirma ng authorized personnel. Hiwalay ito sa pre-disaster estimates.",
    },
  },

  informationPendingValidation: {
    en: {
      title: "Information Pending Validation",
      description:
        "Reported information that still needs checking, confirmation, or supporting evidence before official use.",
    },
    fil: {
      title: "Impormasyong Hinihintay ang Validation",
      description:
        "Reported information na kailangan pang suriin, kumpirmahin, o suportahan ng ebidensya bago official use.",
    },
  },

  stabilizationAndEarlyRecovery: {
    en: {
      title: "Stabilization and Early Recovery",
      description:
        "Actions after immediate response to restore essential services, confirm remaining needs, and support early community recovery.",
    },
    fil: {
      title: "Stabilization at Early Recovery",
      description:
        "Mga hakbang pagkatapos ng immediate response upang maibalik ang essential services, makumpirma ang natitirang needs, at masuportahan ang early recovery.",
    },
  },
} as const satisfies Record<string, LocalizedHelpContent>;

export type HelpContentKey = keyof typeof HELP_CONTENT;

export function getHelpContent(
  key: HelpContentKey,
  language: HelpLanguage = "en",
): HelpContentDefinition {
  return HELP_CONTENT[key][language];
}
