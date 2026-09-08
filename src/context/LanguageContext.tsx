"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "fil";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<string, { en: string; fil: string }> = {
  // Brand & Subtitle
  appTitle: { en: "PROJECT AGAP", fil: "PROYEKTO AGAP" },
  appTagline: {
    en: "AI-Assisted Disaster Decision Support",
    fil: "AI-Assisted na Suporta sa Desisyon sa Sakuna",
  },
  pilotBadge: {
    en: "Pilot: Lucena City, Quezon",
    fil: "Pilot: Lungsod ng Lucena, Quezon",
  },

  // Primary Navigation
  navHome: { en: "Home", fil: "Tahanan" },
  navPrepare: { en: "Preparedness", fil: "Paghahanda" },
  navReport: { en: "Damage & Needs", fil: "Pinsala at Pangangailangan" },
  navRecovery: { en: "Post Impact", fil: "Post Impact" },
  help: { en: "Help & Emergency", fil: "Tulong at Emergency" },

  // Home Screen
  homeGreeting: { en: "Magandang araw.", fil: "Magandang araw." },
  homeSubtitle: {
    en: "Supporting Lucena preparedness, response, and post-impact review using verified disaster information.",
    fil: "Sinusuportahan ang paghahanda, pagtugon, at post-impact review ng Lucena gamit ang beripikadong disaster information.",
  },
  currentAdvisoryLabel: { en: "ADVISORY STATUS", fil: "STATUS NG ADVISORY" },
  advisoryActive: { en: "ADVISORY RECORD", fil: "ADVISORY RECORD" },
  viewAdvisory: { en: "View Advisory", fil: "Tingnan ang Babala" },
  whatDoYouNeedToDo: { en: "WHAT DO YOU NEED TO DO?", fil: "ANO ANG KAILANGAN MONG GAWIN?" },

  actionPrepareTitle: { en: "1. PREPARE", fil: "1. PAGHAHANDA" },
  actionPrepareDesc: {
    en: "See which barangays may need attention and prepare appropriate actions.",
    fil: "Tingnan kung aling mga barangay ang nangangailangan ng atensyon at ihanda ang mga kaukulang hakbang.",
  },
  actionPrepareBtn: { en: "Start Preparing", fil: "Magsimula sa Paghahanda" },

  actionReportTitle: { en: "2. DAMAGE & NEEDS", fil: "2. PINSALA AT PANGANGAILANGAN" },
  actionReportDesc: {
    en: "Record reported damage, urgent needs, evidence, and verification state.",
    fil: "Itala ang reported na pinsala, agarang pangangailangan, ebidensya, at verification state.",
  },
  actionReportBtn: { en: "Open Report", fil: "Buksan ang Ulat" },

  actionRecoveryTitle: { en: "3. POST IMPACT", fil: "3. POST IMPACT" },
  actionRecoveryDesc: {
    en: "Review reported versus validated impacts, unmet needs, and source-anchored LGU actions.",
    fil: "Suriin ang reported versus validated impacts, unmet needs, at source-anchored LGU actions.",
  },
  actionRecoveryBtn: { en: "View Post Impact", fil: "Tingnan ang Post Impact" },

  needHelp: { en: "Need Help?", fil: "Kailangan ng Tulong?" },
  contactLguHotlines: {
    en: "Contact LGU / Emergency Hotlines",
    fil: "Tawagan ang LGU / Emergency Hotlines",
  },

  // Prepare Screen
  prepareTitle: { en: "PREPARE", fil: "PAGHAHANDA" },
  currentOfficialAdvisory: {
    en: "Current advisory record:",
    fil: "Kasalukuyang advisory record:",
  },
  whatWouldYouLikeToDo: {
    en: "What would you like to do?",
    fil: "Ano ang nais mong gawin?",
  },
  taskSeePriorities: {
    en: "Review Barangay Assessments",
    fil: "Suriin ang Barangay Assessments",
  },
  taskSeePrioritiesDesc: {
    en: "Review risk categories, supporting evidence, and data gaps",
    fil: "Suriin ang risk categories, supporting evidence, at data gaps",
  },
  taskViewBarangayInfo: {
    en: "View Barangay Information",
    fil: "Tingnan ang Impormasyon ng Barangay",
  },
  taskViewBarangayInfoDesc: {
    en: "Review available baseline demographics, facilities, and data gaps",
    fil: "Suriin ang available na baseline demographics, facilities, at data gaps",
  },
  taskCreateBrief: {
    en: "Create Preparedness Brief",
    fil: "Gumawa ng Buod ng Paghahanda",
  },
  taskCreateBriefDesc: {
    en: "Prepare a source-anchored responder brief from verified data",
    fil: "Maghanda ng source-anchored responder brief mula sa beripikadong data",
  },
  taskCreateActionCard: {
    en: "Create Household Action Card",
    fil: "Gumawa ng Gabay sa Tahanan",
  },
  taskCreateActionCardDesc: {
    en: "Use household code, quick profile, or barangay-only preparedness mode",
    fil: "Gamitin ang household code, quick profile, o barangay-only preparedness mode",
  },

  // Priority Barangays
  barangaysNeedingAttention: {
    en: "Barangays Needing Attention",
    fil: "Mga Barangay na Nangangailangan ng Atensyon",
  },
  basedOnVerifiedAdvisory: {
    en: "Uses verified advisory and assessment data when available.",
    fil: "Gumagamit ng verified advisory at assessment data kapag available.",
  },
  topPriorityBarangays: {
    en: "Barangays for Review",
    fil: "Mga Barangay para sa Review",
  },
  viewAllBarangays: {
    en: "View All Barangays",
    fil: "Tingnan Lahat ng Barangay",
  },
  showTopOnly: {
    en: "Show Top Only",
    fil: "Ipakita Lamang ang Nangunguna",
  },
  why: { en: "Why?", fil: "Bakit?" },
  backToPrepare: { en: "Back to Prepare", fil: "Bumalik sa Paghahanda" },

  // Barangay Detail
  whyDoesBarangayNeedAttention: {
    en: "Why does this barangay need attention?",
    fil: "Bakit kailangan ng atensyon ng barangay na ito?",
  },
  hazardExposure: { en: "Hazard Exposure", fil: "Banta ng Panganib" },
  vulnerablePopulation: { en: "Vulnerable Population", fil: "Bulnerableng Sektor" },
  criticalFacilities: { en: "Critical Facilities", fil: "Mahalagang Pasilidad" },
  preparednessGap: { en: "Preparedness Gap", fil: "Kulang sa Kahandaan" },
  viewFullScore: {
    en: "View Assessment Explanation",
    fil: "Tingnan ang Paliwanag ng Assessment",
  },
  hideScore: {
    en: "Hide Assessment Explanation",
    fil: "Itago ang Paliwanag ng Assessment",
  },

  // Report Damage
  reportDamageTitle: {
    en: "Damage & Needs Report",
    fil: "Ulat ng Pinsala at Pangangailangan",
  },
  next: { en: "Next", fil: "Susunod" },
  back: { en: "Back", fil: "Bumalik" },
  submitReport: { en: "Save Report", fil: "I-save ang Ulat" },
  reportSubmittedSuccess: {
    en: "Report saved locally as Pending Sync. It remains unverified.",
    fil: "Na-save locally ang ulat bilang Pending Sync. Nananatili itong unverified.",
  },

  // Post Impact
  recoveryTitle: { en: "Post Impact Action Card", fil: "Post Impact Action Card" },
  recoverySubtitle: {
    en: "Review reported and validated impacts, data gaps, and source-anchored LGU actions.",
    fil: "Suriin ang reported at validated impacts, data gaps, at source-anchored LGU actions.",
  },
  mainReason: { en: "Why it needs review:", fil: "Bakit kailangan ng review:" },
  viewDetails: { en: "View Details", fil: "Tingnan ang Detalye" },
  howCalculated: { en: "How was this assessed?", fil: "Paano ito in-assess?" },

  // Deterministic Risk Categories
  priorityVeryHigh: { en: "VERY HIGH RISK", fil: "NAPAKATAAS NA PANGANIB" },
  priorityHigh: { en: "HIGH RISK", fil: "MATAAS NA PANGANIB" },
  priorityModerate: { en: "MODERATE RISK", fil: "KATAMTAMANG PANGANIB" },
  priorityLow: { en: "LOW RISK", fil: "MABABANG PANGANIB" },

  // General Actions
  close: { en: "Close", fil: "Isara" },
  activeAdvisoryBadge: { en: "Advisory Status", fil: "Status ng Advisory" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("project-agap-lang") as Language;
      if (saved === "en" || saved === "fil") {
        setLanguage(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem("project-agap-lang", lang);
    } catch {
      // Ignore
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "fil" : "en";
    handleSetLanguage(nextLang);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
