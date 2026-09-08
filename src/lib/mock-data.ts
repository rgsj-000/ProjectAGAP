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
      "Operational overview of active advisories, barangay priorities, and immediate actions for Lucena City.",
    descriptionFil:
      "Pangkalahatang operational na buod ng mga aktibong abiso, prayoridad na barangay, at agarang hakbang para sa Lungsod ng Lucena.",
    iconName: "Home",
  },
  {
    id: "prepare",
    titleEn: "Preparedness",
    titleFil: "Paghahanda",
    shortLabelEn: "Preparedness",
    shortLabelFil: "Paghahanda",
    descriptionEn:
      "Review barangay risk priorities, preparedness briefs, and household action guidance.",
    descriptionFil:
      "Suriin ang prayoridad sa panganib ng barangay, mga buod ng paghahanda, at gabay sa pagkilos ng sambahayan.",
    iconName: "Shield",
  },
  {
    id: "report-damage",
    titleEn: "Damage & Needs",
    titleFil: "Pinsala at Pangangailangan",
    shortLabelEn: "Damage & Needs",
    shortLabelFil: "Pinsala at Kailangan",
    descriptionEn:
      "Record verified damage, urgent community needs, and field-response requirements.",
    descriptionFil:
      "Itala ang beripikadong pinsala, agarang pangangailangan ng komunidad, at kinakailangang tugon sa field.",
    iconName: "FileEdit",
  },
  {
    id: "recovery",
    titleEn: "Recovery Priorities",
    titleFil: "Mga Priyoridad sa Pagbangon",
    shortLabelEn: "Recovery",
    shortLabelFil: "Pagbangon",
    descriptionEn:
      "Review ranked recovery needs to guide relief allocation, clearing, and rehabilitation.",
    descriptionFil:
      "Suriin ang ranggo ng mga pangangailangan sa pagbangon upang gabayan ang ayuda, clearing, at rehabilitasyon.",
    iconName: "TrendingUp",
  },
];

export interface EmergencyContact {
  agencyEn: string;
  agencyFil: string;
  contactNumber: string;
  descriptionEn: string;
  descriptionFil: string;
  isPrimary?: boolean;
}

export const LUCENA_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    agencyEn: "Lucena City CDRRMO (Disaster Operations Center)",
    agencyFil: "Lucena City CDRRMO (Sentro ng Operasyon sa Sakuna)",
    contactNumber: "(042) 710-7777 / 0922-810-7777",
    descriptionEn: "24/7 City Disaster Risk Reduction & Management Office",
    descriptionFil: "24/7 Tanggapan ng Pamamahala sa Kalamidad ng Lungsod",
    isPrimary: true,
  },
  {
    agencyEn: "National Emergency Hotline",
    agencyFil: "Pambansang Hotline sa Emergency",
    contactNumber: "911",
    descriptionEn: "Direct emergency dispatch for police, rescue, and ambulance",
    descriptionFil: "Pangkalahatang tulong para sa pulis, bumbero, at ambulansya",
    isPrimary: true,
  },
  {
    agencyEn: "Philippine Red Cross — Lucena / Quezon Chapter",
    agencyFil: "Philippine Red Cross — Lucena / Quezon Chapter",
    contactNumber: "(042) 373-3561 / 0917-834-8374",
    descriptionEn: "Blood bank, first aid, search & rescue, and relief support",
    descriptionFil: "Serbisyo sa dugo, paunang lunas, pagsagip, at ayuda",
  },
  {
    agencyEn: "Lucena City Police Station (PNP)",
    agencyFil: "Pulisya ng Lungsod ng Lucena (PNP)",
    contactNumber: "(042) 373-7440 / 0998-598-5683",
    descriptionEn: "Law enforcement, peace and order, checkpoint security",
    descriptionFil: "Pulisya, seguridad, at kaayusan sa komunidad",
  },
  {
    agencyEn: "Bureau of Fire Protection (BFP) Lucena",
    agencyFil: "Kawanihan ng Pamatay-Sunog (BFP) Lucena",
    contactNumber: "(042) 710-2525 / 0932-843-8555",
    descriptionEn: "Fire safety, rescue, flood water evacuation assistance",
    descriptionFil: "Pamatay-sunog, rescue, at pagtulong sa baha",
  },
  {
    agencyEn: "Quezon Medical Center (Lucena City)",
    agencyFil: "Quezon Medical Center (Lungsod ng Lucena)",
    contactNumber: "(042) 373-6130",
    descriptionEn: "Provincial tertiary government hospital and trauma center",
    descriptionFil: "Pangunahing pampublikong ospital sa lalawigan",
  },
];

export interface BarangayPriority {
  id: string;
  rank: number;
  name: string;
  priorityLevel: "VERY HIGH" | "HIGH" | "MODERATE" | "LOW";
  priorityLevelFil: "NAPAKATAAS" | "MATAAS" | "KATAMTAMAN" | "MABABA";
  score: number;
  color: "red" | "orange" | "yellow" | "green";
  hazardExposure: "High" | "Moderate" | "Low";
  vulnerablePopulation: "High" | "Moderate" | "Low";
  criticalFacilities: "High" | "Moderate" | "Low";
  preparednessGap: "High" | "Moderate" | "Low";
  mainReasonEn: string;
  mainReasonFil: string;
  population: string;
  vulnerableCount: string;
  evacuationCenter: string;
  recommendedActionEn: string;
  recommendedActionFil: string;
}

export const TOP_BARANGAYS: BarangayPriority[] = [
  {
    id: "dalahican",
    rank: 1,
    name: "Dalahican",
    priorityLevel: "VERY HIGH",
    priorityLevelFil: "NAPAKATAAS",
    score: 82,
    color: "red",
    hazardExposure: "High",
    vulnerablePopulation: "High",
    criticalFacilities: "Moderate",
    preparednessGap: "High",
    mainReasonEn: "High storm surge exposure along coast + large concentration of fisherfolk households.",
    mainReasonFil: "Mataas na daluyong sa baybayin + maraming pamilyang mangingisda.",
    population: "16,400",
    vulnerableCount: "1,120 fisherfolk & infants",
    evacuationCenter: "Dalahican National High School",
    recommendedActionEn: "Secure fishing vessels inland. Confirm all fisherfolk return to shore. Issue forced evacuation for coastal Puroks.",
    recommendedActionFil: "Isampa ang mga bangka sa ligtas na lugar. Tiyakin ang pagbalik ng mga mangingisda. Ipatupad ang paglikas sa baybayin.",
  },
  {
    id: "cotta",
    rank: 2,
    name: "Cotta",
    priorityLevel: "HIGH",
    priorityLevelFil: "MATAAS",
    score: 74,
    color: "orange",
    hazardExposure: "High",
    vulnerablePopulation: "High",
    criticalFacilities: "Moderate",
    preparednessGap: "Moderate",
    mainReasonEn: "1.8m coastal surge during high tide coinciding with Dumacaa river runoff.",
    mainReasonFil: "1.8m daluyong sa high tide kasabay ang pag-apaw ng Ilog Dumacaa.",
    population: "14,820",
    vulnerableCount: "840 seniors & infants",
    evacuationCenter: "Cotta Elementary School",
    recommendedActionEn: "Preposition 2 rescue boats at Landing Zone Alpha. Initiate pre-emptive evacuation for Purok 4 and 5.",
    recommendedActionFil: "Maglagay ng 2 rescue boats sa Landing Zone Alpha. Simulan ang pre-emptive evacuation sa Purok 4 at 5.",
  },
  {
    id: "barra",
    rank: 3,
    name: "Barra",
    priorityLevel: "HIGH",
    priorityLevelFil: "MATAAS",
    score: 69,
    color: "orange",
    hazardExposure: "High",
    vulnerablePopulation: "Moderate",
    criticalFacilities: "Low",
    preparednessGap: "Moderate",
    mainReasonEn: "Low-lying shoreline terrain vulnerable to saltwater inundation.",
    mainReasonFil: "Mababang lupain sa tabi ng dagat na madaling abutin ng tubig-alat.",
    population: "7,950",
    vulnerableCount: "380 vulnerable residents",
    evacuationCenter: "Barra Barangay Hall & Covered Court",
    recommendedActionEn: "Check seawall barriers and clear coastal drainage channels.",
    recommendedActionFil: "Suriin ang seawall at linisin ang daluyan ng tubig sa tabing-dagat.",
  },
  {
    id: "gulang-gulang",
    rank: 4,
    name: "Gulang-gulang",
    priorityLevel: "MODERATE",
    priorityLevelFil: "KATAMTAMAN",
    score: 61,
    color: "yellow",
    hazardExposure: "Moderate",
    vulnerablePopulation: "Moderate",
    criticalFacilities: "High",
    preparednessGap: "Low",
    mainReasonEn: "Flash flood runoff along Iyam riverbanks affecting low-lying subdivisions.",
    mainReasonFil: "Biglaang pagbaha sa tabing-ilog ng Iyam sa mabababang subdibisyon.",
    population: "22,500",
    vulnerableCount: "410 vulnerable residents",
    evacuationCenter: "Gulang-Gulang Covered Court",
    recommendedActionEn: "Clear drainage culverts along Maharlika Highway and monitor river gauge.",
    recommendedActionFil: "Linisin ang mga drainage sa Maharlika Highway at bantayan ang lebel ng ilog.",
  },
  {
    id: "ibabang-dupay",
    rank: 5,
    name: "Ibabang Dupay",
    priorityLevel: "MODERATE",
    priorityLevelFil: "KATAMTAMAN",
    score: 52,
    color: "yellow",
    hazardExposure: "Moderate",
    vulnerablePopulation: "Low",
    criticalFacilities: "Moderate",
    preparednessGap: "Low",
    mainReasonEn: "Street ponding along commercial arteries; high economic activity zone.",
    mainReasonFil: "Pagbaha sa mga kalsadang pangkalakalan; mataas na sentro ng komersyo.",
    population: "18,200",
    vulnerableCount: "290 vulnerable residents",
    evacuationCenter: "Quezon National High School (Standby)",
    recommendedActionEn: "Ensure traffic rerouting plans are ready if underpass floods.",
    recommendedActionFil: "Ihanda ang traffic rerouting kapag may pagbaha sa mga kalsada.",
  },
];

export const OTHER_BARANGAYS: BarangayPriority[] = [
  {
    id: "mayao-crossing",
    rank: 6,
    name: "Mayao Crossing",
    priorityLevel: "LOW",
    priorityLevelFil: "MABABA",
    score: 38,
    color: "green",
    hazardExposure: "Low",
    vulnerablePopulation: "Low",
    criticalFacilities: "Low",
    preparednessGap: "Low",
    mainReasonEn: "Higher elevation terrain with stable infrastructure.",
    mainReasonFil: "Mataas na lugar na may maayos na mga kanal at daan.",
    population: "9,800",
    vulnerableCount: "120 vulnerable residents",
    evacuationCenter: "Mayao Crossing Elementary School",
    recommendedActionEn: "Routine patrol and debris check along highway.",
    recommendedActionFil: "Regular na pagpapatrolya at pagsusuri sa kalsada.",
  },
  {
    id: "ransohan",
    rank: 7,
    name: "Ransohan",
    priorityLevel: "LOW",
    priorityLevelFil: "MABABA",
    score: 34,
    color: "green",
    hazardExposure: "Low",
    vulnerablePopulation: "Low",
    criticalFacilities: "Low",
    preparednessGap: "Low",
    mainReasonEn: "Minimal inland flood risk; agricultural zone.",
    mainReasonFil: "Mababang banta ng baha; sonang pansakahan.",
    population: "5,400",
    vulnerableCount: "80 vulnerable residents",
    evacuationCenter: "Ransohan Barangay Hall",
    recommendedActionEn: "Maintain communication with Barangay Tanods.",
    recommendedActionFil: "Panatilihin ang komunikasyon sa mga Tanod.",
  },
];

export interface RecoveryPriorityItem {
  rank: number;
  barangayName: string;
  priorityLevel: "VERY HIGH" | "HIGH" | "MODERATE" | "LOW";
  priorityLevelFil: string;
  color: "red" | "orange" | "yellow" | "green";
  mainReasonEn: string;
  mainReasonFil: string;
  waterNeeded: string;
  foodPacks: string;
  medicalTeam: string;
  clearingRequired: string;
}

export const RECOVERY_PRIORITIES: RecoveryPriorityItem[] = [
  {
    rank: 1,
    barangayName: "Dalahican",
    priorityLevel: "VERY HIGH",
    priorityLevelFil: "NAPAKATAAS",
    color: "red" as const,
    mainReasonEn: "Severe shoreline damage, 42 damaged fishing boats, urgent clean drinking water needed.",
    mainReasonFil: "Malubhang pinsala sa baybayin, 42 sirang bangka, agarang malinis na inuming tubig ang kailangan.",
    waterNeeded: "Urgent (2,000 Liters)",
    foodPacks: "850 Family Food Packs",
    medicalTeam: "Deployed",
    clearingRequired: "Debris along shoreline access road",
  },
  {
    rank: 2,
    barangayName: "Cotta",
    priorityLevel: "HIGH",
    priorityLevelFil: "MATAAS",
    color: "orange" as const,
    mainReasonEn: "High number of flooded households in Purok 4 and 5; silt deposit in community water lines.",
    mainReasonFil: "Maraming binahang kabahayan sa Purok 4 at 5; putik sa daluyan ng tubig.",
    waterNeeded: "High (1,200 Liters)",
    foodPacks: "600 Family Food Packs",
    medicalTeam: "Scheduled 2:00 PM",
    clearingRequired: "Mud clearing at riverbank alleyways",
  },
  {
    rank: 3,
    barangayName: "Barra",
    priorityLevel: "HIGH",
    priorityLevelFil: "MATAAS",
    color: "orange" as const,
    mainReasonEn: "Saltwater damage to 85 homes; displaced families needing dry clothing and hygiene kits.",
    mainReasonFil: "Pinsala ng tubig-alat sa 85 kabahayan; kailangan ng tuyong damit at hygiene kits.",
    waterNeeded: "Moderate (800 Liters)",
    foodPacks: "350 Family Food Packs",
    medicalTeam: "On Standby",
    clearingRequired: "Roadway clearing near coastal bridge",
  },
];

export const CURRENT_OFFICIAL_ADVISORY = {
  titleEn: "Severe Rainfall Advisory",
  titleFil: "Babala sa Malakas na Ulan",
  source: "PAGASA • DOST",
  issuedTime: "Updated 11:00 AM Today",
  status: "ACTIVE",
  statusFil: "AKTIBO",
  bulletinNumber: "Bulletin #4",
  leadParagraphEn:
    "Heavy to intense rainfall (15-30 mm/hr) expected over Quezon province including Lucena City due to Southwest Monsoon enhanced by Tropical Depression. A 1.8-meter high tide is forecasted in Tayabas Bay at 2:30 PM.",
  leadParagraphFil:
    "Katamtaman hanggang sa malakas na buhos ng ulan (15-30 mm/hr) ang inaasahan sa Quezon kabilang ang Lungsod ng Lucena dahil sa Habagat. Inaasahan din ang 1.8-metrong high tide sa Tayabas Bay pagsapit ng 2:30 PM.",
  precautionsEn: [
    "Residents in low-lying coastal and riverine barangays (Dalahican, Cotta, Barra, Gulang-Gulang) must prepare for possible water swelling.",
    "Small sea vessels and fisherfolk are advised not to venture out to sea.",
    "Barangay Disaster Committees are instructed to activate emergency monitoring.",
  ],
  precautionsFil: [
    "Ang mga residente sa tabing-dagat at tabing-ilog (Dalahican, Cotta, Barra, Gulang-Gulang) ay pinapayuhang maghanda sa posibleng pagtaas ng tubig.",
    "Pinapayuhan ang mga mangingisda at maliliit na sasakyang-pandagat na huwag munang pumalaot.",
    "Inaatasan ang mga Barangay Disaster Committee na simulan ang emergency monitoring.",
  ],
};

export const MOCK_USER = {
  name: "Engr. Maria Santos",
  roleEn: "CDRRMO Operations Officer",
  roleFil: "Opisyal ng Operasyon ng CDRRMO",
  assignedLgu: "Lucena City CDRRMO",
  assignedBarangay: "City EOC (All 33 Barangays)",
  status: "On Duty",
};
