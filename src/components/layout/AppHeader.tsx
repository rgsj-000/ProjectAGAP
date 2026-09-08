"use client";

import React from "react";
import { useNavigation } from "@/context/NavigationContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";
import { UserProfileArea } from "./UserProfileArea";
import { ChevronRight } from "lucide-react";

export const AppHeader: React.FC = () => {
  const {
    currentModule,
    prepareSubView,
    selectedBarangay,
    goToPrepare,
    setIsAdvisoryModalOpen,
  } = useNavigation();
  const { language, t } = useLanguage();

  const getSubBreadcrumb = () => {
    if (currentModule !== "prepare") return null;

    if (prepareSubView === "priority-barangays") {
      return (
        <span className="text-xs font-semibold text-slate-700">
          {language === "en" ? "Priority Barangays" : "Priyoridad ng Barangay"}
        </span>
      );
    }

    if (prepareSubView === "barangay-detail") {
      return (
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-700">
          <button
            type="button"
            onClick={() => goToPrepare("priority-barangays")}
            className="text-slate-500 transition-colors hover:text-slate-900 hover:underline"
          >
            {language === "en" ? "Priority Barangays" : "Priyoridad ng Barangay"}
          </button>
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" aria-hidden="true" />
          <span className="truncate">Barangay {selectedBarangay.name}</span>
        </span>
      );
    }

    if (prepareSubView === "advisory-detail") {
      return (
        <span className="text-xs font-semibold text-slate-700">
          {language === "en" ? "Advisory Details" : "Detalye ng Abiso"}
        </span>
      );
    }

    if (prepareSubView === "prep-brief") {
      return (
        <span className="text-xs font-semibold text-slate-700">
          {language === "en" ? "Preparedness Brief" : "Buod ng Paghahanda"}
        </span>
      );
    }

    if (prepareSubView === "action-card") {
      return (
        <span className="text-xs font-semibold text-slate-700">
          {language === "en" ? "Household Action Card" : "Gabay sa Tahanan"}
        </span>
      );
    }

    if (prepareSubView === "barangay-info") {
      return (
        <span className="text-xs font-semibold text-slate-700">
          {language === "en" ? "Barangay Information" : "Impormasyon ng Barangay"}
        </span>
      );
    }

    return null;
  };

  const subBreadcrumb = getSubBreadcrumb();

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white">
      {/* Mobile utility header: branding is retained because the desktop sidebar is hidden. */}
      <div className="flex min-h-[52px] items-center justify-between px-4 py-2.5 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-black text-sm tracking-tight text-slate-900">AGAP</span>
          <span className="truncate text-[11px] font-medium text-slate-400">• Lucena City</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdvisoryModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
            aria-label={language === "en" ? "View active advisory" : "Tingnan ang aktibong abiso"}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            <span>{t("activeAdvisoryBadge")}</span>
          </button>

          <LanguageSelector variant="pill" />
          <UserProfileArea compact />
        </div>
      </div>

      {/* Desktop utility bar: no duplicate primary navigation or Help & Emergency action. */}
      <div className="hidden min-h-[56px] items-center justify-between px-8 py-3.5 lg:flex">
        <div className="min-w-0">
          {subBreadcrumb ?? (
            <span className="text-xs font-medium text-slate-400">
              {language === "en" ? "Lucena City Operations" : "Operasyon ng Lungsod ng Lucena"}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsAdvisoryModalOpen(true)}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
          aria-label={language === "en" ? "View active advisory" : "Tingnan ang aktibong abiso"}
          title={language === "en" ? "View official advisory" : "Tingnan ang opisyal na abiso"}
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
          <span>{t("activeAdvisoryBadge")}</span>
        </button>
      </div>
    </header>
  );
};
