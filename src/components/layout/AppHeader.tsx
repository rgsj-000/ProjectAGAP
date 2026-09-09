"use client";

import React from "react";
import { useNavigation } from "@/context/NavigationContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";
import { UserProfileArea } from "./UserProfileArea";
import { ProjectAgapBrand } from "@/components/branding/ProjectAgapBrand";
import { HelpCircle, ChevronRight, Phone } from "lucide-react";

export const AppHeader: React.FC = () => {
  const {
    currentModule,
    goToHome,
    activeNavItem,
    prepareSubView,
    selectedBarangay,
    setIsHelpOpen,
    goToPrepare,
    setIsAdvisoryModalOpen,
    isBarangayUser,
  } = useNavigation();
  const { language, t } = useLanguage();

  const getSubBreadcrumb = () => {
    if (currentModule !== "prepare") return null;
    if (prepareSubView === "priority-barangays") {
      return (
        <span className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>
            {isBarangayUser
              ? "Barangay Gulang-Gulang"
              : language === "en"
                ? "Barangay Risk Assessments"
                : "Mga Risk Assessment ng Barangay"}
          </span>
        </span>
      );
    }
    if (prepareSubView === "barangay-detail") {
      if (isBarangayUser) {
        return (
          <span className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span>Barangay Gulang-Gulang Risk Assessment</span>
          </span>
        );
      }

      return (
        <span className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <button
            type="button"
            onClick={() => goToPrepare("priority-barangays")}
            className="hover:underline text-slate-500"
          >
            {language === "en" ? "Barangay Risk Assessments" : "Mga Risk Assessment ng Barangay"}
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>Barangay {selectedBarangay.name}</span>
        </span>
      );
    }
    if (prepareSubView === "prep-brief") {
      return (
        <span className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>{language === "en" ? "Preparedness Brief" : "Buod ng Paghahanda"}</span>
        </span>
      );
    }
    if (prepareSubView === "action-card") {
      return (
        <span className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>{language === "en" ? "Household Action Card" : "Gabay sa Tahanan"}</span>
        </span>
      );
    }
    if (prepareSubView === "barangay-info") {
      return (
        <span className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>{language === "en" ? "Barangay Information" : "Impormasyon ng Barangay"}</span>
        </span>
      );
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-white border-b border-slate-200">
      {/* Mobile Top Header */}
      <div className="flex lg:hidden items-center justify-between px-4 py-2.5 min-h-[52px]">
        <div className="flex min-w-0 items-center gap-2">
          <ProjectAgapBrand
            width={110}
            height={34}
            priority
            className="h-7 w-auto shrink-0"
          />
          <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">
            • {isBarangayUser ? "Gulang-Gulang" : "Lucena City"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtle compact advisory pill on mobile */}
          <button
            type="button"
            onClick={goToHome}
            className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-full font-medium transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>{language === "en" ? "Advisories" : "Mga advisory"}</span>
          </button>

          <LanguageSelector variant="pill" />
          <UserProfileArea compact />
        </div>
      </div>

      {/* Desktop Top Header */}
      <div className="hidden lg:flex items-center justify-between px-8 py-3.5 min-h-[56px]">
        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">
            {language === "en" ? activeNavItem.titleEn : activeNavItem.titleFil}
          </span>
          {isBarangayUser ? (
            <>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="font-semibold text-blue-700">Barangay Gulang-Gulang</span>
            </>
          ) : null}
          {getSubBreadcrumb()}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Subtle compact advisory indicator */}
          <button
            type="button"
            onClick={goToHome}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900 text-xs font-medium transition-all"
            title="Click to view full advisory"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{language === "en" ? "Advisories" : "Mga advisory"}</span>
          </button>

          {/* Calm Help & Emergency access */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{t("help")}</span>
          </button>
        </div>
      </div>
    </header>
  );
};