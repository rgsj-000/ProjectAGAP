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
    en: "AI-Guided Assessment & Prioritization",
    fil: "Pagtatasa at Pag-uuna Gamit ang AI",
  },
  pilotBadge: {
    en: "Pilot: Lucena City, Quezon",
    fil: "Pilot: Lungsod ng Lucena, Quezon",
  },

  // Primary Navigation
  navHome: { en: "Home", fil: "Home" },
  navPrepare: { en: "Preparedness", fil: "Paghahanda" },
  navReport: { en: "Damage & Needs", fil: "Pinsala at Pangangailangan" },
  navRecovery: { en: "Recovery Priorities", fil: "Priyoridad sa Pagbangon" },
  help: { en: "Help & Emergency", fil: "Tulong at Emergency" },

  // Home Screen
  homeGreeting: { en: "Magandang araw.", fil: "Magandang araw." },
  homeSubtitle: {
    en: "Helping Lucena prepare and recover using verified disaster information.",
    fil: "Tumutulong sa Lucena na maghanda at bumangon gamit ang beripikadong impormasyon.",
  },
  currentAdvisoryLabel: { en: "CURRENT ADVISORY", fil: "KASALUKUYANG BABALA" },
  advisoryActive: { en: "ACTIVE", fil: "AKTIBO" },
  viewAdvisory: { en: "View Advisory", fil: "Tingnan ang Babala" },
  whatDoYouNeedToDo: { en: "WHAT DO YOU NEED TO DO?", fil: "ANO ANG KAILANGAN MONG GAWIN?" },

  actionPrepareTitle: { en: "1. PREPARE", fil: "1. PAGHAHANDA" },
  actionPrepareDesc: {
    en: "See which barangays may need attention and prepare appropriate actions.",
    fil: "Tingnan kung aling mga barangay ang nangangailangan ng atensyon at ihanda ang mga kaukulang hakbang.",
  },
  actionPrepareBtn: { en: "Start Preparing", fil: "Magsimula sa Paghahanda" },

  actionReportTitle: { en: "2. REPORT DAMAGE", fil: "2. MAG-ULAT NG PINSALA" },
  actionReportDesc: {
    en: "Record damage and urgent community needs.",
    fil: "Magtala ng mga pinsala at agarang pangangailangan ng komunidad.",
  },
  actionReportBtn: { en: "Report Damage", fil: "Mag-ulat ng Pinsala" },

  actionRecoveryTitle: { en: "3. RECOVERY", fil: "3. PAGBANGON" },
  actionRecoveryDesc: {
    en: "See where assistance may be needed first.",
    fil: "Tingnan kung saan unang kailangan ang tulong at ayuda.",
  },
  actionRecoveryBtn: { en: "View Recovery", fil: "Tingnan ang Pagbangon" },

  needHelp: { en: "Need Help?", fil: "Kailangan ng Tulong?" },
  contactLguHotlines: {
    en: "Contact LGU / Emergency Hotlines",
    fil: "Tawagan ang LGU / Emergency Hotlines",
  },

  // Prepare Screen
  prepareTitle: { en: "PREPAREDNESS", fil: "PAGHAHANDA" },
  currentOfficialAdvisory: {
    en: "Current official advisory:",
    fil: "Kasalukuyang opisyal na babala:",
  },
  whatWouldYouLikeToDo: {
    en: "What would you like to do?",
    fil: "Ano ang nais mong gawin?",
  },
  taskSeePriorities: {
    en: "See Priority Barangays",
    fil: "Tingnan ang Priyoridad ng Barangay",
  },
  taskSeePrioritiesDesc: {
    en: "Identify which communities need immediate preparation",
    fil: "Tukuyin kung aling komunidad ang unang kailangang maghanda",
  },
  taskViewBarangayInfo: {
    en: "View Barangay Information",
    fil: "Tingnan ang Impormasyon ng Barangay",
  },
  taskViewBarangayInfoDesc: {
    en: "Check baseline demographics and evacuation centers",
    fil: "Suriin ang populasyon at mga evacuation center",
  },
  taskCreateBrief: {
    en: "Create Preparedness Brief",
    fil: "Gumawa ng Buod ng Paghahanda",
  },
  taskCreateBriefDesc: {
    en: "Generate action checklist for responders",
    fil: "Bumuo ng listahan ng hakbang para sa mga responder",
  },
  taskCreateActionCard: {
    en: "Create Household Action Card",
    fil: "Gumawa ng Gabay sa Tahanan",
  },
  taskCreateActionCardDesc: {
    en: "Family go-bag and safety instructions",
    fil: "Laman ng Go-Bag at mga paalala sa kaligtasan ng pamilya",
  },

  // Priority Barangays
  barangaysNeedingAttention: {
    en: "Barangays Needing Attention",
    fil: "Mga Barangay na Nangangailangan ng Atensyon",
  },
  basedOnVerifiedAdvisory: {
    en: "Based on the current verified advisory.",
    fil: "Batay sa kasalukuyang beripikadong babala.",
  },
  topPriorityBarangays: {
    en: "Top Priority Barangays",
    fil: "Mga Nangungunang Barangay",
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
  backToPrepare: { en: "Back to Preparedness", fil: "Bumalik sa Paghahanda" },

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
    en: "View Full Score Explanation",
    fil: "Tingnan ang Buong Paliwanag sa Score",
  },
  hideScore: {
    en: "Hide Score Explanation",
    fil: "Itago ang Paliwanag",
  },

  // Report Damage
  reportDamageTitle: {
    en: "Report Damage & Needs",
    fil: "Mag-ulat ng Pinsala at Pangangailangan",
  },
  next: { en: "Next", fil: "Susunod" },
  back: { en: "Back", fil: "Bumalik" },
  submitReport: { en: "Submit Report", fil: "Ipasa ang Ulat" },
  reportSubmittedSuccess: {
    en: "Report submitted successfully to Lucena CDRRMO EOC.",
    fil: "Matagumpay na naipasa ang ulat sa Lucena CDRRMO EOC.",
  },

  // Recovery
  recoveryTitle: { en: "Recovery Priorities", fil: "Priyoridad sa Pagbangon" },
  recoverySubtitle: {
    en: "Based on verified damage and needs reports.",
    fil: "Batay sa mga beripikadong ulat ng pinsala at pangangailangan.",
  },
  mainReason: { en: "Main reason:", fil: "Pangunahing dahilan:" },
  viewDetails: { en: "View Details", fil: "Tingnan ang Detalye" },
  howCalculated: { en: "How was this calculated?", fil: "Paano ito kinalkula?" },

  // Priority Levels
  priorityVeryHigh: { en: "VERY HIGH PRIORITY", fil: "NAPAKATAAS NA PRIYORIDAD" },
  priorityHigh: { en: "HIGH PRIORITY", fil: "MATAAS NA PRIYORIDAD" },
  priorityModerate: { en: "MODERATE", fil: "KATAMTAMAN" },
  priorityLow: { en: "LOWER", fil: "MABABANG PRIYORIDAD" },

  // General Actions
  close: { en: "Close", fil: "Isara" },
  activeAdvisoryBadge: { en: "1 Active Advisory", fil: "1 Aktibong Babala" },
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
