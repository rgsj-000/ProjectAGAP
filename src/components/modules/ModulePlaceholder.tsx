"use client";

import React, { useEffect, useState } from "react";
import { useNavigation } from "@/context/NavigationContext";
import { useLanguage } from "@/context/LanguageContext";
import { AdvisoryForm } from "@/components/advisory/AdvisoryForm";
import {
  TOP_BARANGAYS,
  OTHER_BARANGAYS,
  RECOVERY_PRIORITIES,
  CURRENT_OFFICIAL_ADVISORY,
} from "@/lib/mock-data"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Radio,
  Shield,
} from "lucide-react";

export const ModulePlaceholder: React.FC = () => {
  const {
    currentModule,
    prepareSubView,
    setPrepareSubView,
    selectedBarangay,
    setSelectedBarangayId,
    goToPriorityBarangays,
    goToBarangayDetail,
    setIsAdvisoryModalOpen,
  } = useNavigation();
  const { language, t } = useLanguage();

  // State for Dashboard advisory input
  const [isAdvisoryFormOpen, setIsAdvisoryFormOpen] = useState(false);

  // Close the dashboard advisory editor when the user navigates to another module.
  useEffect(() => {
    if (currentModule !== "home") {
      setIsAdvisoryFormOpen(false);
    }
  }, [currentModule]);

  // State for Priority Barangays View
  const [showAllBarangays, setShowAllBarangays] = useState(false);

  // State for Barangay Detail View
  const [showScoreExplanation, setShowScoreExplanation] = useState(false);

  // State for Report Damage Form (6 Steps)
  const [reportStep, setReportStep] = useState(1);
  const [selectedReportBarangay, setSelectedReportBarangay] = useState("Dalahican");
  const [selectedIncident, setSelectedIncident] = useState("Severe Flooding / Storm Surge");
  const [selectedSeverity, setSelectedSeverity] = useState("Severe / Urgent");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([
    "Drinking Water",
    "Food Packs",
  ]);
  const [photoNote, setPhotoNote] = useState("");
  const [isReportSubmitted, setIsReportSubmitted] = useState(false);

  // State for Recovery View
  const [showRecoveryFormula, setShowRecoveryFormula] = useState(false);
  const [selectedRecoveryDetail, setSelectedRecoveryDetail] = useState<number | null>(null);

  // --- Priority Badge Helper ---
  const renderPriorityBadge = (
    level: "VERY HIGH" | "HIGH" | "MODERATE" | "LOW" | string,
    levelFil: string
  ) => {
    const text = language === "en" ? level : levelFil;
    switch (level) {
      case "VERY HIGH":
        return (
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
            {text}
          </span>
        );
      case "HIGH":
        return (
          <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
            {text}
          </span>
        );
      case "MODERATE":
        return (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            {text}
          </span>
        );
      case "LOW":
        return (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            {text}
          </span>
        );
    }
  };

  // =========================================================================
  // VIEW 1: DASHBOARD
  // =========================================================================
  const renderHomeScreen = () => {
    const advisory = CURRENT_OFFICIAL_ADVISORY;
    const advisoryTitle = language === "en" ? advisory.titleEn : advisory.titleFil;

    if (isAdvisoryFormOpen) {
      return (
        <div className="animate-in fade-in duration-200">
          <AdvisoryForm
            initialValues={{
              title: advisoryTitle,
              source: advisory.source,
              status: "ACTIVE",
              issuedTime: advisory.issuedTime,
              bulletinNumber: advisory.bulletinNumber,
              message:
                language === "en"
                  ? advisory.leadParagraphEn
                  : advisory.leadParagraphFil,
              precautions:
                language === "en"
                  ? advisory.precautionsEn
                  : advisory.precautionsFil,
            }}
            onCancel={() => setIsAdvisoryFormOpen(false)}
          />
        </div>
      );
    }

    return (
      <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-200">
        {/* Dashboard identity — intentionally spacious and minimal */}
        <header className="pt-1 sm:pt-2">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
              {language === "en" ? "City Operations Overview" : "Buod ng Operasyon ng Lungsod"}
            </span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              PROJECT AGAP
            </h1>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-500">
              {language === "en"
                ? "A calm overview of current advisories and verified risk information for Lucena City responders."
                : "Isang malinaw na buod ng kasalukuyang abiso at beripikadong impormasyon sa panganib para sa mga responder ng Lungsod ng Lucena."}
            </p>
          </div>
        </header>

        {/* Active advisory — one clear status band rather than a dense information card */}
        <section
          aria-label={language === "en" ? "Active advisory" : "Aktibong abiso"}
          className="rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-4 sm:px-5 sm:py-4.5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-700">
                <Radio className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    {t("advisoryActive")}
                  </span>
                  <span className="text-xs text-slate-400">{advisory.source}</span>
                </div>
                <p className="mt-0.5 truncate text-sm sm:text-base font-bold text-slate-900">
                  {advisoryTitle}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{advisory.issuedTime}</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsAdvisoryModalOpen(true)}
                className="min-h-[40px] rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                {t("viewAdvisory")}
              </button>
              <button
                type="button"
                onClick={() => setIsAdvisoryFormOpen(true)}
                className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                {language === "en" ? "Update Advisory" : "I-update ang Babala"}
              </button>
            </div>
          </div>
        </section>

        {/* Visual-first overview. No sample series are plotted while verified data is unavailable. */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {language === "en" ? "City Risk Overview" : "Buod ng Panganib sa Lungsod"}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  {language === "en"
                    ? "Barangay risk visualization will appear here once verified operational data is connected."
                    : "Lalabas dito ang visualization ng panganib ng barangay kapag nakakonekta na ang beripikadong operational data."}
                </p>
              </div>
              <span className="self-start rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {language === "en" ? "Awaiting data" : "Naghihintay ng datos"}
              </span>
            </div>

            <div className="relative mt-5 min-h-[290px] overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50/55">
              {/* Empty chart grid: visual structure only, no fabricated values */}
              <div className="pointer-events-none absolute inset-x-6 bottom-10 top-8 flex flex-col justify-between" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((line) => (
                  <div key={line} className="border-t border-slate-200/80" />
                ))}
              </div>
              <div className="pointer-events-none absolute bottom-10 left-8 top-8 border-l border-slate-200/80" aria-hidden="true" />

              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-xs">
                    <Shield className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-800">
                    {language === "en" ? "No verified risk data yet" : "Wala pang beripikadong risk data"}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {language === "en"
                      ? "AGAP will visualize barangay risk, preparedness, and priority patterns here without using fabricated values."
                      : "Ivi-visualize ng AGAP dito ang panganib, paghahanda, at mga prayoridad ng barangay nang hindi gumagamit ng gawa-gawang halaga."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-[11px] text-slate-400">
                {language === "en" ? "Verified data only" : "Beripikadong datos lamang"}
              </p>
              <button
                type="button"
                onClick={goToPriorityBarangays}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                <span>{language === "en" ? "Open Risk Assessment" : "Buksan ang Risk Assessment"}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Priority-score visualization remains empty until verified scoring data is available */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {language === "en" ? "Priority Score" : "Priority Score"}
            </span>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              {language === "en" ? "Explainable Priority" : "Paliwanag sa Priyoridad"}
            </h2>

            <div className="mt-7 flex justify-center">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-slate-100 bg-slate-50/60">
                <div className="text-center">
                  <span className="block text-4xl font-black tracking-tight text-slate-300">--</span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">/ 100</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm font-bold text-slate-800">
                {language === "en" ? "No barangay score available" : "Wala pang available na score ng barangay"}
              </p>
              <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
                {language === "en"
                  ? "When verified scoring data becomes available, this panel will explain why a barangay is prioritized."
                  : "Kapag available na ang beripikadong scoring data, ipapaliwanag dito kung bakit prayoridad ang isang barangay."}
              </p>
            </div>
          </aside>
        </section>

        {/* Navigation-specific workflows stay in the persistent sidebar.
            Home remains focused on overview and decision-support information only. */}
      </div>
    );
  };

  // =========================================================================
  // VIEW 2: PREPARE SCREEN (Vertical Action List)
  // =========================================================================
  const renderPrepareMenu = () => {
    const advisory = CURRENT_OFFICIAL_ADVISORY;
    const advisoryTitle = language === "en" ? advisory.titleEn : advisory.titleFil;

    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("prepareTitle")}
          </h1>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>{t("currentOfficialAdvisory")}</span>
            <button
              type="button"
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="font-bold text-slate-800 hover:text-blue-700 underline"
            >
              {advisoryTitle}
            </button>
            <span className="text-slate-400">• {advisory.source}</span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3">
            {t("whatWouldYouLikeToDo")}
          </h2>

          <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Action 1: See Priority Barangays */}
            <button
              type="button"
              onClick={goToPriorityBarangays}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group"
            >
              <div>
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-2">
                  <span>→</span>
                  <span>{t("taskSeePriorities")}</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5 ml-4">
                  {t("taskSeePrioritiesDesc")}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Action 2: View Barangay Information */}
            <button
              type="button"
              onClick={() => setPrepareSubView("barangay-info")}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group"
            >
              <div>
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-2">
                  <span>→</span>
                  <span>{t("taskViewBarangayInfo")}</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5 ml-4">
                  {t("taskViewBarangayInfoDesc")}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Action 3: Create Preparedness Brief */}
            <button
              type="button"
              onClick={() => setPrepareSubView("prep-brief")}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group"
            >
              <div>
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-2">
                  <span>→</span>
                  <span>{t("taskCreateBrief")}</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5 ml-4">
                  {t("taskCreateBriefDesc")}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Action 4: Create Household Action Card */}
            <button
              type="button"
              onClick={() => setPrepareSubView("action-card")}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group"
            >
              <div>
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-2">
                  <span>→</span>
                  <span>{t("taskCreateActionCard")}</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5 ml-4">
                  {t("taskCreateActionCardDesc")}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 3: PRIORITY BARANGAYS PAGE
  // =========================================================================
  const renderPriorityBarangaysView = () => {
    const listToDisplay = showAllBarangays
      ? [...TOP_BARANGAYS, ...OTHER_BARANGAYS]
      : TOP_BARANGAYS;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Back Link & Header */}
        <div>
          <button
            type="button"
            onClick={() => setPrepareSubView("menu")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("backToPrepare")}</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t("barangaysNeedingAttention")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("basedOnVerifiedAdvisory")}
          </p>
        </div>

        {/* Clean, Simple Ranked List */}
        <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {listToDisplay.map((b) => (
            <div
              key={b.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="font-mono text-sm font-bold text-slate-400 w-5 shrink-0">
                  {b.rank}
                </span>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => goToBarangayDetail(b.id)}
                    className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-700 transition-colors text-left truncate block"
                  >
                    {b.name}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {renderPriorityBadge(b.priorityLevel, b.priorityLevelFil)}
                <span className="text-xs font-mono font-bold text-slate-500">
                  {b.score} / 100
                </span>
                <button
                  type="button"
                  onClick={() => goToBarangayDetail(b.id)}
                  className="px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                >
                  {t("why")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Optional: View All Barangays */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowAllBarangays(!showAllBarangays)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
          >
            {showAllBarangays ? t("showTopOnly") : t("viewAllBarangays")}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 4: BARANGAY DETAIL PAGE
  // =========================================================================
  const renderBarangayDetailView = () => {
    const b = selectedBarangay;

    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        {/* Back Link & Header */}
        <div>
          <button
            type="button"
            onClick={() => setPrepareSubView("priority-barangays")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Back to Priority List" : "Bumalik sa Listahan"}</span>
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              BARANGAY {b.name}
            </h1>
            <div className="flex items-center gap-2">
              {renderPriorityBadge(b.priorityLevel, b.priorityLevelFil)}
              <span className="text-sm font-mono font-bold text-slate-700">
                {b.score} / 100
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Why does this barangay need attention? */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            {t("whyDoesBarangayNeedAttention")}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px]">
                {t("hazardExposure")}
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {b.hazardExposure}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px]">
                {t("vulnerablePopulation")}
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {b.vulnerablePopulation}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px]">
                {t("criticalFacilities")}
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {b.criticalFacilities}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px]">
                {t("preparednessGap")}
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {b.preparednessGap}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            {language === "en" ? b.mainReasonEn : b.mainReasonFil}
          </p>

          {/* Full Score Explanation (Collapsible) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowScoreExplanation(!showScoreExplanation)}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>
                {showScoreExplanation ? t("hideScore") : t("viewFullScore")}
              </span>
              {showScoreExplanation ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showScoreExplanation && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-2 animate-in fade-in duration-150">
                <p>
                  <strong>Score Calculation (82/100):</strong> Hazard exposure (35%) +
                  Vulnerability density (30%) + Facility proximity (20%) + Resource gap (15%).
                </p>
                <p>
                  Data verified from PAGASA storm surge bulletin #4 and Lucena City 2024 local census records.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: What would you like to do? */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3">
            {t("whatWouldYouLikeToDo")}
          </h2>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setPrepareSubView("prep-brief")}
              className="w-full p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-left transition-colors flex items-center justify-between"
            >
              <span>{t("taskCreateBrief")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setPrepareSubView("barangay-info")}
              className="w-full p-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold text-left transition-colors flex items-center justify-between"
            >
              <span>{t("taskViewBarangayInfo")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setPrepareSubView("action-card")}
              className="w-full p-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold text-left transition-colors flex items-center justify-between"
            >
              <span>{t("taskCreateActionCard")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 5: SECONDARY SUB-MODULES (Preparedness Brief, Info, Action Card)
  // =========================================================================
  const renderPrepBriefView = () => {
    const b = selectedBarangay;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <button
            type="button"
            onClick={() => setPrepareSubView("menu")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("backToPrepare")}</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === "en" ? "Preparedness Brief" : "Buod ng Paghahanda"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Barangay {b.name} • Priority Score {b.score}/100
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 font-medium">
            {language === "en" ? b.recommendedActionEn : b.recommendedActionFil}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === "en" ? "Responder Prepositioning Checklist" : "Listahan ng Ihahandang Gamit"}
            </h3>
            <div className="space-y-2 text-xs text-slate-700">
              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>Preposition 2 rescue boats at Landing Zone Alpha</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>Verify evacuation generator fuel at {b.evacuationCenter}</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" className="rounded text-blue-600" />
                <span>Confirm radio comms with Lucena CDRRMO EOC frequency</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => alert("Printable brief generated for Barangay Tanods.")}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              {language === "en" ? "Print / Export Brief" : "I-print ang Buod"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHouseholdActionCardView = () => {
    const b = selectedBarangay;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <button
            type="button"
            onClick={() => setPrepareSubView("menu")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("backToPrepare")}</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === "en" ? "Household Action Card" : "Gabay sa Tahanan"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === "en"
              ? "Simple instructions for families in Barangay " + b.name
              : "Malinaw na gabay para sa bawat pamilya sa Barangay " + b.name}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === "en" ? "1. Designated Evacuation Center" : "1. Itinalagang Evacuation Center"}
            </h3>
            <p className="text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {b.evacuationCenter}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === "en" ? "2. Essential Family Go-Bag" : "2. Laman ng Family Go-Bag"}
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Drinking water (1 gallon per person for 3 days)</li>
              <li>Ready-to-eat canned goods and biscuits</li>
              <li>Flashlight, extra batteries, and whistle</li>
              <li>Important documents in waterproof plastic envelope</li>
              <li>First aid kit and maintenance medicines</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => alert("Action Card ready for distribution.")}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {language === "en" ? "Print Action Card" : "I-print ang Gabay"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBarangayInfoView = () => {
    const b = selectedBarangay;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <button
            type="button"
            onClick={() => setPrepareSubView("menu")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("backToPrepare")}</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === "en" ? "Barangay Information" : "Impormasyon ng Barangay"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Barangay {b.name}, Lucena City, Quezon
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px] uppercase">
                {language === "en" ? "Total Population" : "Kabuuang Populasyon"}
              </span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {b.population}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px] uppercase">
                {language === "en" ? "Vulnerable Sector" : "Bulnerableng Sektor"}
              </span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {b.vulnerableCount}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px] uppercase">
                {language === "en" ? "Evacuation Site" : "Lugar ng Paglikas"}
              </span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                {b.evacuationCenter}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="font-bold text-slate-800 block">
              {language === "en" ? "Terrain & Exposure Profile" : "Anyo ng Lupa at Panganib"}
            </span>
            <p className="text-slate-600 leading-relaxed">
              {language === "en" ? b.mainReasonEn : b.mainReasonFil}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 6: REPORT DAMAGE (Guided 6-Step Form, 1 Question Per Step)
  // =========================================================================
  const renderReportDamageScreen = () => {
    if (isReportSubmitted) {
      return (
        <div className="max-w-xl mx-auto py-8 text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {language === "en" ? "Report Submitted" : "Naipasa ang Ulat"}
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {t("reportSubmittedSuccess")}
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => {
                setIsReportSubmitted(false);
                setReportStep(1);
              }}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              {language === "en" ? "Submit Another Report" : "Magpasa ng Isa Pang Ulat"}
            </button>
          </div>
        </div>
      );
    }

    const lucenaBarangays = [
      "Dalahican",
      "Cotta",
      "Barra",
      "Gulang-gulang",
      "Ibabang Dupay",
      "Mayao Crossing",
      "Ransohan",
      "Talao-Talao",
    ];

    const incidentTypes = [
      "Severe Flooding / Storm Surge",
      "Structural Damage (Roof / Wall)",
      "Blocked Access Road / Debris",
      "Power / Water Line Failure",
      "Medical Emergency / Trapped Residents",
    ];

    const severityLevels = [
      { id: "Minor", label: "Minor", desc: "Passable, localized ponding" },
      { id: "Moderate", label: "Moderate", desc: "Knee-deep water, needs clearing" },
      { id: "Severe / Urgent", label: "Severe / Urgent", desc: "Life safety risk, evacuation required" },
    ];

    const needsOptions = [
      "Rescue Boats",
      "Drinking Water",
      "Food Packs",
      "Medical Assistance",
      "Road Clearing Team",
      "Temporary Shelter Tents",
    ];

    return (
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step {reportStep} of 6
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t("reportDamageTitle")}
          </h1>
        </div>

        {/* STEP 1: Which Barangay? */}
        {reportStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {language === "en" ? "1. Which barangay are you reporting from?" : "1. Aling barangay ang iyong iniuulat?"}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {lucenaBarangays.map((bName) => (
                <button
                  key={bName}
                  type="button"
                  onClick={() => setSelectedReportBarangay(bName)}
                  className={`p-3.5 rounded-xl border text-xs font-bold text-left transition-all min-h-[48px] ${
                    selectedReportBarangay === bName
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {bName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: What Happened? */}
        {reportStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {language === "en" ? "2. What incident occurred?" : "2. Anong uri ng insidente ang naganap?"}
            </h2>
            <div className="space-y-2">
              {incidentTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedIncident(type)}
                  className={`w-full p-4 rounded-xl border text-xs font-bold text-left transition-all min-h-[48px] ${
                    selectedIncident === type
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: How Serious Is It? */}
        {reportStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {language === "en" ? "3. How serious is the situation?" : "3. Gaano kalubha ang kalagayan?"}
            </h2>
            <div className="space-y-2.5">
              {severityLevels.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedSeverity(lvl.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedSeverity === lvl.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-bold block">{lvl.label}</span>
                  <span
                    className={`text-[11px] block mt-0.5 ${
                      selectedSeverity === lvl.id ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {lvl.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: What Is Needed? */}
        {reportStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {language === "en" ? "4. What urgent assistance is needed?" : "4. Anong agarang tulong ang kailangan?"}
            </h2>
            <p className="text-xs text-slate-500">
              {language === "en" ? "Select all that apply:" : "Piliin ang lahat ng kailangan:"}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {needsOptions.map((need) => {
                const isChecked = selectedNeeds.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => {
                      if (isChecked) {
                        setSelectedNeeds(selectedNeeds.filter((n) => n !== need));
                      } else {
                        setSelectedNeeds([...selectedNeeds, need]);
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-xs font-bold text-left transition-all min-h-[48px] flex items-center justify-between ${
                      isChecked
                        ? "bg-blue-50 text-blue-900 border-blue-400"
                        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{need}</span>
                    {isChecked && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Add Photo (Optional) */}
        {reportStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {language === "en" ? "5. Add photo or notes (Optional)" : "5. Magdagdag ng larawan o paalala (Opsyonal)"}
            </h2>
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                {language === "en" ? "Tap to upload or take a photo" : "Pindutin para kumuha ng larawan"}
              </p>
              <p className="text-[11px] text-slate-400">
                {language === "en" ? "Photos help responders verify water depth and debris." : "Tumutulong ang litrato upang makita ang taas ng baha."}
              </p>
            </div>
            <textarea
              value={photoNote}
              onChange={(e) => setPhotoNote(e.target.value)}
              placeholder={language === "en" ? "Add specific landmark or notes (optional)..." : "Karagdagang detalye o palatandaan (opsyonal)..."}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 min-h-[80px]"
            />
          </div>
        )}

        {/* STEP 6: Review & Submit */}
        {reportStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {language === "en" ? "6. Review and Submit" : "6. Suriin at Ipasa"}
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Barangay:</span>
                <span className="font-bold text-slate-900">{selectedReportBarangay}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Incident:</span>
                <span className="font-bold text-slate-900">{selectedIncident}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Severity:</span>
                <span className="font-bold text-red-700">{selectedSeverity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Urgent Needs:</span>
                <span className="font-bold text-slate-900 text-right">
                  {selectedNeeds.join(", ") || "None specified"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3">
          {reportStep > 1 ? (
            <button
              type="button"
              onClick={() => setReportStep(reportStep - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {t("back")}
            </button>
          ) : (
            <div></div>
          )}

          {reportStep < 6 ? (
            <button
              type="button"
              onClick={() => setReportStep(reportStep + 1)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {t("next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsReportSubmitted(true)}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {t("submitReport")}
            </button>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 7: RECOVERY SCREEN
  // =========================================================================
  const renderRecoveryScreen = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("recoveryTitle")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t("recoverySubtitle")}
          </p>
        </div>

        {/* Clean Top Priorities List */}
        <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {RECOVERY_PRIORITIES.map((item) => {
            const isDetailOpen = selectedRecoveryDetail === item.rank;
            const reason = language === "en" ? item.mainReasonEn : item.mainReasonFil;

            return (
              <div key={item.rank} className="p-5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-400">
                      {item.rank} —
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      {item.barangayName}
                    </h2>
                  </div>
                  {renderPriorityBadge(item.priorityLevel, item.priorityLevelFil)}
                </div>

                <div className="text-xs text-slate-600 pl-6">
                  <span className="text-slate-400 font-medium block">
                    {t("mainReason")}
                  </span>
                  <p className="mt-0.5 text-slate-800 font-medium">{reason}</p>
                </div>

                <div className="pl-6 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedRecoveryDetail(isDetailOpen ? null : item.rank)
                    }
                    className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{isDetailOpen ? "Hide Details" : t("viewDetails")}</span>
                    {isDetailOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isDetailOpen && (
                    <div className="mt-3 p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Water Allocation:</span>
                        <span className="font-bold text-slate-900">{item.waterNeeded}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Relief Packs:</span>
                        <span className="font-bold text-slate-900">{item.foodPacks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Medical Team:</span>
                        <span className="font-bold text-slate-900">{item.medicalTeam}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Clearing Status:</span>
                        <span className="font-bold text-slate-900">{item.clearingRequired}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible: How was this calculated? */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowRecoveryFormula(!showRecoveryFormula)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 underline flex items-center gap-1"
          >
            <span>{t("howCalculated")}</span>
            {showRecoveryFormula ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showRecoveryFormula && (
            <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 animate-in fade-in duration-150">
              <p className="font-bold text-slate-800">
                Recovery Ranking Formula:
              </p>
              <p>
                Calculated by weighting verified field damage reports (40%) + density of affected displaced families (35%) + critical lifeline interruption (water/health, 25%).
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // RENDER SWITCHER BASED ON CURRENT MODULE & SUB-VIEW
  // =========================================================================
  if (currentModule === "home") {
    return renderHomeScreen();
  }

  if (currentModule === "prepare") {
    switch (prepareSubView) {
      case "priority-barangays":
        return renderPriorityBarangaysView();
      case "barangay-detail":
        return renderBarangayDetailView();
      case "prep-brief":
        return renderPrepBriefView();
      case "action-card":
        return renderHouseholdActionCardView();
      case "barangay-info":
        return renderBarangayInfoView();
      case "menu":
      default:
        return renderPrepareMenu();
    }
  }

  if (currentModule === "report-damage") {
    return renderReportDamageScreen();
  }

  if (currentModule === "recovery") {
    return renderRecoveryScreen();
  }

  return renderHomeScreen();
};
