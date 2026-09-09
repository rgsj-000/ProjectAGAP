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
    en: "Supporting Lucena disaster preparedness, response, and post-impact review using verified and clearly identified information.",
    fil: "Sinusuportahan ang disaster preparedness, response, at post-impact review ng Lucena gamit ang verified at malinaw na identified information.",
  },
  currentAdvisoryLabel: { en: "ADVISORY INFORMATION", fil: "IMPORMASYON NG ADVISORY" },
  advisoryActive: { en: "ADVISORY STATUS", fil: "STATUS NG ADVISORY" },
  viewAdvisory: { en: "View Advisory", fil: "Tingnan ang Advisory" },
  whatDoYouNeedToDo: { en: "WHAT DO YOU NEED TO DO?", fil: "ANO ANG KAILANGAN MONG GAWIN?" },

  actionPrepareTitle: { en: "1. PREPAREDNESS", fil: "1. PAGHAHANDA" },
  actionPrepareDesc: {
    en: "Review barangay risk, exposure, preparedness capacity, evidence, and actions that may need LGU attention.",
    fil: "Suriin ang barangay risk, exposure, preparedness capacity, evidence, at mga aksyong maaaring mangailangan ng LGU attention.",
  },
  actionPrepareBtn: { en: "Open Preparedness", fil: "Buksan ang Paghahanda" },

  actionReportTitle: { en: "2. DAMAGE & NEEDS", fil: "2. PINSALA AT PANGANGAILANGAN" },
  actionReportDesc: {
    en: "Record reported damage, affected population, critical-facility status, access conditions, priority needs, evidence, and verification status.",
    fil: "Itala ang reported damage, affected population, critical-facility status, access conditions, priority needs, evidence, at verification status.",
  },
  actionReportBtn: { en: "Open Report", fil: "Buksan ang Ulat" },

  actionRecoveryTitle: { en: "3. POST IMPACT", fil: "3. POST IMPACT" },
  actionRecoveryDesc: {
    en: "Review reported versus validated impacts, information pending validation, priority needs, and source-based LGU actions.",
    fil: "Suriin ang reported versus validated impacts, information pending validation, priority needs, at source-based LGU actions.",
  },
  actionRecoveryBtn: { en: "Open Post Impact", fil: "Buksan ang Post Impact" },

  needHelp: { en: "Need Help?", fil: "Kailangan ng Tulong?" },
  contactLguHotlines: {
    en: "Contact LGU / Emergency Hotlines",
    fil: "Tawagan ang LGU / Emergency Hotlines",
  },

  // Prepare Screen
  prepareTitle: { en: "PREPAREDNESS", fil: "PAGHAHANDA" },
  currentOfficialAdvisory: {
    en: "Current advisory information:",
    fil: "Kasalukuyang impormasyon ng advisory:",
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
    en: "Review DRRM risk results, supporting evidence, and information gaps",
    fil: "Suriin ang DRRM risk results, supporting evidence, at information gaps",
  },
  taskViewBarangayInfo: {
    en: "View Barangay Information",
    fil: "Tingnan ang Impormasyon ng Barangay",
  },
  taskViewBarangayInfoDesc: {
    en: "Review available population, vulnerable groups, critical facilities, preparedness capacity, and information gaps",
    fil: "Suriin ang available population, vulnerable groups, critical facilities, preparedness capacity, at information gaps",
  },
  taskCreateBrief: {
    en: "Create Preparedness Brief",
    fil: "Gumawa ng Buod ng Paghahanda",
  },
  taskCreateBriefDesc: {
    en: "Prepare a responder brief using verified advisory information and approved action rules",
    fil: "Maghanda ng responder brief gamit ang verified advisory information at approved action rules",
  },
  taskCreateActionCard: {
    en: "Create Household Action Card",
    fil: "Gumawa ng Household Action Card",
  },
  taskCreateActionCardDesc: {
    en: "Use Household Code, Quick Household Profile, or General Barangay Preparedness Card",
    fil: "Gamitin ang Household Code, Quick Household Profile, o Pangkalahatang Barangay Preparedness Card",
  },

  // Priority Barangays
  barangaysNeedingAttention: {
    en: "Barangays Requiring Review",
    fil: "Mga Barangay na Kailangang Suriin",
  },
  basedOnVerifiedAdvisory: {
    en: "Uses verified advisory and assessment information when available; missing or unverified information remains identified.",
    fil: "Gumagamit ng verified advisory at assessment information kapag available; malinaw na minamarkahan ang kulang o unverified information.",
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
  why: { en: "Why this needs review", fil: "Bakit kailangang suriin" },
  backToPrepare: { en: "Back to Preparedness", fil: "Bumalik sa Paghahanda" },

  // Barangay Detail
  whyDoesBarangayNeedAttention: {
    en: "Why does this barangay need LGU review?",
    fil: "Bakit kailangang suriin ng LGU ang barangay na ito?",
  },
  hazardExposure: { en: "Hazard Exposure", fil: "Pagkakalantad sa Hazard" },
  vulnerablePopulation: { en: "Vulnerable Groups", fil: "Vulnerable Groups" },
  criticalFacilities: { en: "Critical Facilities", fil: "Critical Facilities" },
  preparednessGap: { en: "Preparedness Capacity Gap", fil: "Kakulangan sa Preparedness Capacity" },
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
    en: "Report saved as Pending Sync. It remains unverified until synchronization and authorized review are completed.",
    fil: "Na-save ang report bilang Pending Sync. Nananatili itong unverified hanggang matapos ang synchronization at authorized review.",
  },

  // Post Impact
  recoveryTitle: { en: "Post Impact Action Card", fil: "Post Impact Action Card" },
  recoverySubtitle: {
    en: "Review reported and validated impacts, information pending validation, priority needs, and source-based LGU actions.",
    fil: "Suriin ang reported at validated impacts, information pending validation, priority needs, at source-based LGU actions.",
  },
  mainReason: { en: "Why LGU review is needed:", fil: "Bakit kailangan ng LGU review:" },
  viewDetails: { en: "View Details", fil: "Tingnan ang Detalye" },
  howCalculated: { en: "How was this reviewed?", fil: "Paano ito sinuri?" },

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
