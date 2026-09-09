"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useNavigation } from "@/context/NavigationContext";
import { useLanguage } from "@/context/LanguageContext";
import { AdvisoryForm } from "@/components/advisory/AdvisoryForm";
import { LGUActionCard } from "@/components/assessment/LGUActionCard";
import { HouseholdActionCard } from "@/components/household/HouseholdActionCard";
import { PostImpactActionCard } from "@/components/recovery/PostImpactActionCard";
import { ConnectivityStatus } from "@/components/feedback/ConnectivityStatus";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { getHelpContent } from "@/lib/help-content";
import {
  TOP_BARANGAYS,
  OTHER_BARANGAYS,
  CURRENT_OFFICIAL_ADVISORY,
} from "@/lib/mock-data";
import {
  ArrowRight,
  ArrowLeft,
  Check,
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
    goToPriorityBarangays,
    goToBarangayDetail,
    setIsAdvisoryModalOpen,
    isBarangayUser,
    assignedBarangay,
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

  // State for Damage & Needs Report (reported data only; validation remains backend/LGU controlled)
  const [reportStep, setReportStep] = useState(1);
  const [selectedReportBarangay, setSelectedReportBarangay] = useState("");
  const [selectedIncident, setSelectedIncident] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [reportedAffectedPersons, setReportedAffectedPersons] = useState("");
  const [reportedAffectedHouseholds, setReportedAffectedHouseholds] = useState("");
  const [reportedVulnerableGroups, setReportedVulnerableGroups] = useState("");
  const [damageSummary, setDamageSummary] = useState("");
  const [criticalFacilityCondition, setCriticalFacilityCondition] = useState("");
  const [serviceDisruption, setServiceDisruption] = useState("");
  const [accessibilityConstraints, setAccessibilityConstraints] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [reportSourceReference, setReportSourceReference] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState<string | null>(null);
  const [isReportSubmitted, setIsReportSubmitted] = useState(false);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [pendingReportTimestamp, setPendingReportTimestamp] = useState<string | null>(null);

  // State for Post Impact Action Card. The initial selection is navigation only, not an impact claim.
  const [selectedPostImpactBarangay, setSelectedPostImpactBarangay] = useState(
    TOP_BARANGAYS[0]?.name ?? OTHER_BARANGAYS[0]?.name ?? ""
  );

  const barangayUserName = assignedBarangay?.name ?? "Gulang-Gulang";

  // Keep the Barangay Gulang-Gulang demo scoped to its assigned barangay.
  useEffect(() => {
    if (isBarangayUser) {
      setIsAdvisoryFormOpen(false);
      setSelectedReportBarangay(barangayUserName);
      setSelectedPostImpactBarangay(barangayUserName);

      if (!isReportSubmitted) {
        setReportStep(2);
      }
    } else if (!isReportSubmitted) {
      setReportStep(1);
      setSelectedReportBarangay("");
    }
  }, [isBarangayUser, barangayUserName, isReportSubmitted]);

  // =========================================================================
  // VIEW 1: DASHBOARD
  // =========================================================================
  const renderHomeScreen = () => {
    const advisory = CURRENT_OFFICIAL_ADVISORY;
    const advisoryTitle = language === "en" ? advisory.titleEn : advisory.titleFil;

    if (isAdvisoryFormOpen && !isBarangayUser) {
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
              {isBarangayUser
                ? language === "en"
                  ? "Barangay Gulang-Gulang Operations"
                  : "Operasyon ng Barangay Gulang-Gulang"
                : language === "en"
                  ? "City Operations Overview"
                  : "Buod ng Operasyon ng Lungsod"}
            </span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              PROJECT AGAP
            </h1>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-500">
              {isBarangayUser
                ? language === "en"
                  ? "Local advisory, risk, preparedness, connectivity, and reporting information for Barangay Gulang-Gulang."
                  : "Lokal na advisory, risk, preparedness, connectivity, at reporting information para sa Barangay Gulang-Gulang."
                : language === "en"
                  ? "A calm operational overview of advisories, verified assessment data, connectivity, and data freshness for Lucena City responders."
                  : "Isang malinaw na operational overview ng mga abiso, beripikadong assessment data, koneksyon, at pagiging napapanahon ng datos para sa mga responder ng Lungsod ng Lucena."}
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
              {!isBarangayUser ? (
                <button
                  type="button"
                  onClick={() => setIsAdvisoryFormOpen(true)}
                  className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {language === "en" ? "Update Advisory" : "I-update ang Babala"}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* Connectivity and data-freshness status.
            Browser online/offline state is detected by the frontend.
            Authoritative sync/freshness/conflict values stay empty until the backend supplies them. */}
        <ConnectivityStatus
          lastSyncAt={null}
          advisoryValidity={null}
          pendingSyncCount={0}
        />

        {/* Visual-first overview. No sample series are plotted while verified data is unavailable. */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {isBarangayUser
                    ? language === "en"
                      ? "Gulang-Gulang Risk & Preparedness Overview"
                      : "Risk at Preparedness Overview ng Gulang-Gulang"
                    : language === "en"
                      ? "City Risk Overview"
                      : "Buod ng Panganib sa Lungsod"}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  {isBarangayUser
                    ? language === "en"
                      ? "Only verified risk and preparedness information for Barangay Gulang-Gulang is shown in this user view."
                      : "Verified risk at preparedness information lamang ng Barangay Gulang-Gulang ang ipinapakita sa user view na ito."
                    : language === "en"
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
                <span>
                  {isBarangayUser
                    ? language === "en"
                      ? "Review Gulang-Gulang Risk"
                      : "Suriin ang Risk ng Gulang-Gulang"
                    : language === "en"
                      ? "Open Risk Assessment"
                      : "Buksan ang Risk Assessment"}
                </span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Deterministic CDRA-informed risk result. No arbitrary 0–100 score is shown. */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {language === "en" ? "Risk Assessment" : "Pagtatasa ng Panganib"}
            </span>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              {language === "en" ? "Deterministic Risk Result" : "Deterministikong Resulta ng Panganib"}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              {language === "en"
                ? "AGAP will display the documented methodology result only after verified likelihood, severity, evidence, and methodology records are connected."
                : "Ipapakita lamang ng AGAP ang resulta ng dokumentadong metodolohiya kapag nakakonekta na ang beripikadong likelihood, severity, ebidensya, at methodology records."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                [language === "en" ? "Likelihood" : "Likelihood", "—"],
                [language === "en" ? "Severity" : "Severity", "—"],
                [language === "en" ? "Risk Result" : "Risk Result", "—"],
                [language === "en" ? "Relative Vulnerability" : "Relative Vulnerability", "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-slate-700">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-bold text-slate-700">
                {language === "en" ? "Awaiting verified assessment inputs" : "Naghihintay ng beripikadong assessment inputs"}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {language === "en"
                  ? "Methodology source, assessment date, evidence, verification state, confidence, and limitations will appear here when provided by the backend."
                  : "Lalabas dito ang methodology source, assessment date, ebidensya, verification state, confidence, at limitations kapag ibinigay na ng backend."}
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

    const preparednessActions = [
      {
        id: "barangay-assessments",
        category: language === "en" ? "Assessment" : "Pagtatasa",
        title: isBarangayUser
          ? language === "en"
            ? "Review Gulang-Gulang Risk Assessment"
            : "Suriin ang Risk Assessment ng Gulang-Gulang"
          : t("taskSeePriorities"),
        description: isBarangayUser
          ? language === "en"
            ? "Review the verified risk information and assessment details for your assigned barangay."
            : "Suriin ang verified risk information at assessment details ng inyong assigned barangay."
          : t("taskSeePrioritiesDesc"),
        actionLabel: isBarangayUser
          ? language === "en"
            ? "Review Assessment"
            : "Suriin ang Assessment"
          : language === "en"
            ? "Open Assessment"
            : "Buksan ang Assessment",
        image: "/images/preparedness/barangay-assessments.png",
        onClick: goToPriorityBarangays,
      },
      {
        id: "barangay-information",
        category: language === "en" ? "Barangay Data" : "Datos ng Barangay",
        title: t("taskViewBarangayInfo"),
        description: t("taskViewBarangayInfoDesc"),
        actionLabel: language === "en" ? "View Information" : "Tingnan ang Impormasyon",
        image: "/images/preparedness/barangay-information.png",
        onClick: () => setPrepareSubView("barangay-info"),
      },
      {
        id: "preparedness-brief",
        category: language === "en" ? "Responder Brief" : "Brief ng Responder",
        title: t("taskCreateBrief"),
        description: t("taskCreateBriefDesc"),
        actionLabel: language === "en" ? "Create Brief" : "Gumawa ng Brief",
        image: "/images/preparedness/preparedness-brief.png",
        onClick: () => setPrepareSubView("prep-brief"),
      },
      {
        id: "household-action-card",
        category: language === "en" ? "Household" : "Sambahayan",
        title: t("taskCreateActionCard"),
        description: t("taskCreateActionCardDesc"),
        actionLabel: language === "en" ? "Create Card" : "Gumawa ng Card",
        image: "/images/preparedness/household-action-card.png",
        onClick: () => setPrepareSubView("action-card"),
      },
    ];

    const workflowSteps =
      language === "en"
        ? ["01 Assess", "02 Understand", "03 Brief", "04 Guide"]
        : ["01 Tasa", "02 Unawain", "03 Brief", "04 Gabay"];

    return (
      <div className="space-y-7 animate-in fade-in duration-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("prepareTitle")}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>{t("currentOfficialAdvisory")}</span>
            <button
              type="button"
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="font-bold text-slate-800 underline underline-offset-2 transition-colors hover:text-blue-700"
            >
              {advisoryTitle}
            </button>
            <span className="text-slate-400">• {advisory.source}</span>
          </div>
        </div>

        {/* Preparedness overview */}
        <section
          aria-labelledby="preparedness-overview-heading"
          className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-white to-slate-50 shadow-sm"
        >
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                  {language === "en" ? "Preparedness Overview" : "Preparedness Overview"}
                </p>
                <h2
                  id="preparedness-overview-heading"
                  className="mt-1 text-base font-bold text-slate-900 sm:text-lg"
                >
                  {isBarangayUser
                    ? language === "en"
                      ? "Preparedness workflows for Barangay Gulang-Gulang."
                      : "Preparedness workflows para sa Barangay Gulang-Gulang."
                    : language === "en"
                      ? "Turn verified information into practical preparedness workflows."
                      : "Gawing practical preparedness workflows ang beripikadong impormasyon."}
                </h2>
                <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
                  {language === "en"
                    ? "Move from assessment to usable guidance using documented data, evidence, and verified advisory information when available."
                    : "Mula assessment hanggang usable guidance, gamitin ang dokumentadong data, ebidensya, at verified advisory information kapag available."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-[390px] lg:justify-end">
              {workflowSteps.map((step) => (
                <span
                  key={step}
                  className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-sm"
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="preparedness-actions-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="preparedness-actions-heading"
                className="text-sm font-bold text-slate-900"
              >
                {t("whatWouldYouLikeToDo")}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {language === "en"
                  ? "Choose the workflow that matches the task you need to complete."
                  : "Piliin ang workflow na naaayon sa gawaing kailangan mong tapusin."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {preparednessActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className="group flex min-h-[330px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 sm:h-44">
                  <Image
                    src={action.image}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.055]"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-4 flex min-h-0 flex-1 flex-col">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                    {action.category}
                  </p>

                  <h3 className="mt-1.5 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-700">
                    {action.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {action.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xs font-bold text-blue-700 transition-colors group-hover:text-blue-800">
                      {action.actionLabel}
                    </span>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition-all duration-200 group-hover:border-blue-200 group-hover:bg-blue-100 group-hover:text-blue-700">
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  };


  // =========================================================================
  // VIEW 3: BARANGAY RISK ASSESSMENT PAGE
  // =========================================================================
  const renderPriorityBarangaysView = () => {
    const barangayProfiles = [...TOP_BARANGAYS, ...OTHER_BARANGAYS];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <button
            type="button"
            onClick={() => setPrepareSubView("menu")}
            className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("backToPrepare")}</span>
          </button>

          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {language === "en" ? "Barangay Risk Assessment" : "Pagtatasa ng Panganib ng Barangay"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            {language === "en"
              ? "Risk results must come from the documented CDRA-informed methodology. No arbitrary 0–100 score is displayed while verified likelihood, severity, evidence, and methodology inputs are unavailable."
              : "Ang risk result ay dapat manggaling sa dokumentadong CDRA-informed methodology. Walang arbitraryong 0–100 score na ipinapakita habang wala pa ang beripikadong likelihood, severity, ebidensya, at methodology inputs."}
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {language === "en" ? "Barangay Assessment Queue" : "Barangay Assessment Queue"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {language === "en"
                    ? "Open a barangay to review its deterministic assessment and LGU Action Card."
                    : "Buksan ang barangay upang suriin ang deterministic assessment at LGU Action Card nito."}
                </p>
              </div>
              <span className="self-start rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                {language === "en" ? "Assessment data pending" : "Pending ang assessment data"}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {barangayProfiles.map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => goToBarangayDetail(b.id)}
                    className="block truncate text-left text-sm font-bold text-slate-900 transition-colors hover:text-blue-700 sm:text-base"
                  >
                    {b.name}
                  </button>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {language === "en"
                      ? "Likelihood, severity, risk result, evidence, and methodology are not yet connected."
                      : "Hindi pa nakakonekta ang likelihood, severity, risk result, ebidensya, at methodology."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => goToBarangayDetail(b.id)}
                  className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-50 sm:self-auto"
                >
                  <span>{language === "en" ? "Open LGU Action Card" : "Buksan ang LGU Action Card"}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-blue-900">
          <strong>{language === "en" ? "Frontend boundary:" : "Frontend boundary:"}</strong>{" "}
          {language === "en"
            ? "This interface does not calculate risk. The backend must provide the adopted methodology, verified inputs, deterministic result, evidence, date, confidence, and limitations."
            : "Hindi kinakalkula ng interface na ito ang risk. Ang backend ang magbibigay ng adopted methodology, verified inputs, deterministic result, ebidensya, petsa, confidence, at limitations."}
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 4: LGU ACTION CARD
  // =========================================================================
  const renderBarangayDetailView = () => {
    const b = selectedBarangay;
    const assessment = b.riskAssessment;
    const advisory = CURRENT_OFFICIAL_ADVISORY;

    if (isBarangayUser) {
      const localAssessmentFields = [
        ["Likelihood of Occurrence", assessment.likelihood ?? "—"],
        ["Severity of Consequence", assessment.severity ?? "—"],
        ["Risk Result", assessment.riskResult ?? "—"],
        [
          "Relative Vulnerability",
          assessment.relativeVulnerability === null ||
          assessment.relativeVulnerability === undefined
            ? "—"
            : String(assessment.relativeVulnerability),
        ],
        ["Assessment Methodology", assessment.methodology ?? "—"],
        ["Assessment Date", assessment.assessmentDate ?? "—"],
        ["Confidence Level", assessment.confidenceLevel ?? "—"],
      ];

      return (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <button
              type="button"
              onClick={() => setPrepareSubView("menu")}
              className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("backToPrepare")}</span>
            </button>

            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
              Assigned Barangay
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Barangay {b.name} Risk Assessment
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
              Read-only risk information for your assigned barangay. Citywide barangay rankings and LGU approval controls are not included in this view.
            </p>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {localAssessmentFields.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5"
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Assessment Evidence
                </span>
                {assessment.evidence.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-700">
                    {assessment.evidence.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">No verified evidence is available yet.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Information Gaps and Limitations
                </span>
                {assessment.limitations.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-700">
                    {assessment.limitations.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">No information-gap records are available yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <button
            type="button"
            onClick={() => setPrepareSubView("priority-barangays")}
            className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {language === "en"
                ? "Back to Risk Assessments"
                : "Bumalik sa Risk Assessments"}
            </span>
          </button>

          <div className="max-w-3xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
              {language === "en"
                ? "Pre-Disaster Decision Support"
                : "Pre-Disaster Decision Support"}
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              {language === "en" ? "Barangay Review" : "Pagsusuri ng Barangay"}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {language === "en"
                ? "The LGU Action Card combines the verified advisory, deterministic risk assessment, potential population exposure, preparedness capacity, evidence, data gaps, and source-anchored recommendations. Missing backend values remain visibly empty."
                : "Pinagsasama ng LGU Action Card ang beripikadong advisory, deterministic risk assessment, potential population exposure, preparedness capacity, ebidensya, data gaps, at source-anchored recommendations. Mananatiling malinaw na walang laman ang mga value na hindi pa ibinibigay ng backend."}
            </p>
          </div>
        </div>

        <LGUActionCard
          barangayName={b.name}
          hazard={null}
          advisory={{
            title: language === "en" ? advisory.titleEn : advisory.titleFil,
            reference: advisory.bulletinNumber,
            issuedAt: advisory.issuedTime,
            validity: null,
            verificationState: "UNVERIFIED",
          }}
          assessment={{
            likelihood: assessment.likelihood,
            severity: assessment.severity,
            riskResult: assessment.riskResult,
            relativeVulnerability: assessment.relativeVulnerability,
            methodology: assessment.methodology,
            assessmentDate: assessment.assessmentDate,
            verificationState: assessment.verificationState,
          }}
          exposure={{
            estimatedPersons: null,
            estimatedHouseholds: null,
            vulnerableGroups: null,
            estimationMethod: null,
            confidenceLevel: assessment.confidenceLevel,
            source: null,
            referenceDate: null,
            generatedAt: null,
          }}
          capacity={{
            recordedCapacity: null,
            potentialCapacityGap: null,
            criticalFacilityReadiness: null,
            communicationCapability: null,
          }}
          evidence={assessment.evidence}
          dataGaps={assessment.limitations}
          recommendations={[]}
          onGenerateBrief={() => setPrepareSubView("prep-brief")}
        />

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-blue-900">
          <strong>{language === "en" ? "Assessment note:" : "Tala sa assessment:"}</strong>{" "}
          {language === "en"
            ? "This card shows only assessment values, evidence, and recommended actions supported by available system records. Missing or unverified information remains clearly identified for LGU review."
            : "Ipinapakita lamang ng card na ito ang assessment values, evidence, at recommended actions na suportado ng available system records. Ang kulang o unverified information ay malinaw na minamarkahan para sa LGU review."}
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
            className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("backToPrepare")}</span>
          </button>

          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {language === "en" ? "Preparedness Brief" : "Buod ng Paghahanda"}
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {language === "en"
              ? `Barangay ${b.name} • Brief content remains unavailable until verified advisory, deterministic assessment, and approved action-rule data are connected.`
              : `Barangay ${b.name} • Mananatiling unavailable ang brief content hangga't hindi nakakonekta ang verified advisory, deterministic assessment, at approved action-rule data.`}
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                en: "Verified Advisory",
                fil: "Beripikadong Advisory",
              },
              {
                en: "Risk Assessment",
                fil: "Risk Assessment",
              },
              {
                en: "Approved Responder Actions",
                fil: "Approved Responder Actions",
              },
            ].map((item) => (
              <div
                key={item.en}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === "en" ? item.en : item.fil}
                </span>
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  {language === "en"
                    ? "Awaiting verified backend data"
                    : "Naghihintay ng beripikadong backend data"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-blue-900">
            {language === "en"
              ? "AGAP will not invent responder checklists, evacuation instructions, equipment quantities, or facility-readiness claims. The brief must be assembled from verified advisory data and approved action rules supplied by the application data layer."
              : "Hindi gagawa ang AGAP ng pekeng responder checklist, evacuation instruction, dami ng kagamitan, o facility-readiness claim. Dapat buuin ang brief mula sa verified advisory data at approved action rules na ibinibigay ng application data layer."}
          </div>
        </section>
      </div>
    );
  };

  const renderHouseholdActionCardView = () => {
    const barangayNames = [...TOP_BARANGAYS, ...OTHER_BARANGAYS].map(
      (barangay) => barangay.name
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <button
            type="button"
            onClick={() => setPrepareSubView("menu")}
            className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("backToPrepare")}</span>
          </button>

          <div className="max-w-3xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
              {language === "en"
                ? "Household Preparedness"
                : "Paghahanda ng Household"}
            </span>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {language === "en"
                ? "Choose a Household Code, answer a Quick Household Profile, or use the General Barangay Preparedness Card. AGAP will show only guidance supported by the available advisory and approved preparedness actions."
                : "Pumili ng Household Code, sagutan ang Quick Household Profile, o gamitin ang Pangkalahatang Barangay Preparedness Card. Ipapakita lamang ng AGAP ang guidance na suportado ng available advisory at approved preparedness actions."}
            </p>
          </div>
        </div>

        <HouseholdActionCard
          barangays={isBarangayUser ? [barangayUserName] : barangayNames}
          initialBarangay={isBarangayUser ? barangayUserName : selectedBarangay.name}
          lockedBarangay={isBarangayUser ? barangayUserName : undefined}
          output={null}
        />

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-blue-900">
          <strong>
            {language === "en" ? "Card availability:" : "Availability ng card:"}
          </strong>{" "}
          {language === "en"
            ? "A Household Action Card will appear only when the required advisory information and approved preparedness actions are available. AGAP will not invent missing household guidance."
            : "Lalabas lamang ang Household Action Card kapag available ang kinakailangang advisory information at approved preparedness actions. Hindi mag-iimbento ang AGAP ng kulang na household guidance."}
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
                {b.population ?? "—"}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px] uppercase">
                {language === "en" ? "Vulnerable Sector" : "Bulnerableng Sektor"}
              </span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {b.vulnerableCount ?? "—"}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px] uppercase">
                {language === "en" ? "Evacuation Site" : "Lugar ng Paglikas"}
              </span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                {b.evacuationCenter ?? "—"}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="font-bold text-slate-800 block">
              {language === "en" ? "Terrain & Exposure Profile" : "Anyo ng Lupa at Panganib"}
            </span>
            <p className="text-slate-600 leading-relaxed">
              {(language === "en" ? b.mainReasonEn : b.mainReasonFil) ?? (language === "en" ? "Awaiting verified exposure-profile data." : "Naghihintay ng beripikadong exposure-profile data.")}
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
        <div className="mx-auto max-w-xl space-y-5 py-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-blue-200">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    {language === "en" ? "Pending Sync" : "Pending Sync"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("pendingSync", language)}
                    align="left"
                  />
                </div>

                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {language === "en"
                    ? "Report saved for synchronization"
                    : "Naka-save ang ulat para sa synchronization"}
                </h2>

                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {language === "en"
                    ? "Saved as Pending Sync. The report remains unverified until synchronization and authorized review are completed."
                    : "Na-save bilang Pending Sync. Unverified ang report hanggang matapos ang synchronization at authorized review."}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-100 bg-white p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === "en" ? "Client Report ID" : "Client Report ID"}
                </dt>
                <dd className="mt-1 break-all text-xs font-semibold text-slate-800">
                  {pendingReportId ?? "—"}
                </dd>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === "en" ? "Device Timestamp" : "Device Timestamp"}
                </dt>
                <dd className="mt-1 text-xs font-semibold text-slate-800">
                  {pendingReportTimestamp ?? "—"}
                </dd>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-3.5">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{language === "en" ? "Sync Status" : "Sync Status"}</span>
                  <HelpTooltip
                    content={getHelpContent("pendingSync", language)}
                    align="left"
                  />
                </dt>
                <dd className="mt-1 text-xs font-bold text-blue-700">
                  Pending Sync
                </dd>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-3.5">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>
                    {language === "en" ? "Verification Status" : "Verification Status"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("verificationStatus", language)}
                    align="right"
                  />
                </dt>
                <dd className="mt-1 text-xs font-bold text-amber-700">
                  Unverified
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs leading-relaxed text-amber-900">
              <strong>
                {language === "en" ? "Prototype storage note:" : "Tala sa prototype storage:"}
              </strong>{" "}
              {language === "en"
                ? "Until database synchronization is connected, this temporary report may disappear when the page is reloaded. A report should be treated as submitted to the LGU system only after synchronization succeeds."
                : "Hangga't hindi pa nakakonekta ang database synchronization, maaaring mawala ang temporary report kapag ni-reload ang page. Ituring lamang na naisumite sa LGU system ang report kapag matagumpay na ang synchronization."}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsReportSubmitted(false);
                setReportStep(isBarangayUser ? 2 : 1);
                setSelectedReportBarangay(isBarangayUser ? barangayUserName : "");
                setSelectedIncident("");
                setSelectedSeverity("");
                setReportedAffectedPersons("");
                setReportedAffectedHouseholds("");
                setReportedVulnerableGroups("");
                setDamageSummary("");
                setCriticalFacilityCondition("");
                setServiceDisruption("");
                setAccessibilityConstraints("");
                setSelectedNeeds([]);
                setReportSourceReference("");
                setPhotoNote("");
                setEvidenceFileName(null);
                setPendingReportId(null);
                setPendingReportTimestamp(null);
              }}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              {language === "en" ? "Create Another Report" : "Gumawa ng Isa Pang Ulat"}
            </button>
          </div>
        </div>
      );
    }

    const lucenaBarangays = [...TOP_BARANGAYS, ...OTHER_BARANGAYS].map(
      (barangay) => barangay.name
    );

    const incidentTypes = [
      "Severe Flooding / Storm Surge",
      "Structural Damage (Roof / Wall)",
      "Blocked Access Road / Debris",
      "Power / Water Line Failure",
      "Medical Emergency / Trapped Residents",
    ];

    const severityLevels = [
      { id: "Minor", label: "Minor", desc: "Localized impact reported; requires normal validation." },
      { id: "Moderate", label: "Moderate", desc: "Significant local impact reported; requires LGU review." },
      {
        id: "Severe / Urgent",
        label: "Severe / Urgent",
        desc: "Potential life-safety concern reported; requires urgent authorized validation.",
      },
    ];

    const needsOptions = [
      "Rescue Boats",
      "Drinking Water",
      "Food Packs",
      "Medical Assistance",
      "Road Clearing Team",
      "Temporary Shelter Tents",
    ];

    const canAdvanceReport =
      (reportStep === 1 && Boolean(selectedReportBarangay)) ||
      (reportStep === 2 && Boolean(selectedIncident)) ||
      (reportStep === 3 && Boolean(selectedSeverity) && Boolean(damageSummary.trim())) ||
      reportStep === 4 ||
      (reportStep === 5 && Boolean(reportSourceReference.trim())) ||
      reportStep === 6;

    return (
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Step {reportStep} of 6
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {language === "en" ? "Unverified" : "Unverified"}
              </span>
              <HelpTooltip
                content={getHelpContent("verificationStatus", language)}
                align="right"
              />
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {language === "en" ? "Field Report" : "Field Report"}
              </span>
            </div>
          </div>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {language === "en" ? "Damage & Needs Report" : "Ulat ng Pinsala at Pangangailangan"}
          </h1>

          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {language === "en"
              ? "Reported information remains unverified until reviewed by an authorized LGU user."
              : "Mananatiling unverified ang iniulat na impormasyon hanggang masuri ng awtorisadong LGU user."}
          </p>

          {isBarangayUser ? (
            <div className="mt-2 inline-flex items-center rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] font-semibold text-blue-900">
              Reporting barangay: Barangay {barangayUserName}
            </div>
          ) : null}

          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            {language === "en"
              ? "This reporting form does not replace emergency dispatch. Immediate life-safety emergencies should still use authorized emergency channels."
              : "Hindi kapalit ng emergency dispatch ang reporting form na ito. Para sa agarang life-safety emergency, gamitin pa rin ang awtorisadong emergency channels."}
          </p>
        </div>

        {/* STEP 1: Which Barangay? */}
        {reportStep === 1 && !isBarangayUser && (
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

        {/* STEP 2: Incident and reported population impact */}
        {reportStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === "en"
                  ? "2. What incident occurred?"
                  : "2. Anong uri ng insidente ang naganap?"}
              </h2>
              <div className="mt-1 flex items-start gap-1.5">
                <p className="text-xs text-slate-500">
                  {language === "en"
                    ? "Choose the closest reported incident category. The population and household counts below are reported figures only."
                    : "Piliin ang pinakamalapit na reported incident category. Reported figures lamang ang population at household counts sa ibaba."}
                </p>
                <HelpTooltip
                  content={getHelpContent("reportedFigures", language)}
                  align="left"
                />
              </div>
            </div>

            <div className="space-y-2">
              {incidentTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedIncident(type)}
                  className={`min-h-[48px] w-full rounded-xl border p-4 text-left text-xs font-bold transition-all ${
                    selectedIncident === type
                      ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span>
                    {language === "en"
                      ? "Reported Affected Persons"
                      : "Reported Affected Persons"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("reportedAffectedPersons", language)}
                    align="left"
                  />
                </span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={reportedAffectedPersons}
                  onChange={(event) => setReportedAffectedPersons(event.target.value)}
                  placeholder={language === "en" ? "Unknown / leave blank" : "Unknown / iwanang blangko"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span>
                    {language === "en"
                      ? "Reported Affected Households"
                      : "Reported Affected Households"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("reportedAffectedHouseholds", language)}
                    align="right"
                  />
                </span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={reportedAffectedHouseholds}
                  onChange={(event) => setReportedAffectedHouseholds(event.target.value)}
                  placeholder={language === "en" ? "Unknown / leave blank" : "Unknown / iwanang blangko"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <span>
                  {language === "en"
                    ? "Reported Vulnerable Groups"
                    : "Reported Vulnerable Groups"}
                </span>
                <HelpTooltip
                  content={getHelpContent("reportedVulnerableGroups", language)}
                  align="left"
                />
              </span>
              <textarea
                value={reportedVulnerableGroups}
                onChange={(event) => setReportedVulnerableGroups(event.target.value)}
                placeholder={
                  language === "en"
                    ? "e.g. older persons, PWD/mobility limitations, children, medicine-dependent residents. Enter only what was actually reported."
                    : "hal. older persons, PWD/mobility limitations, mga bata, medicine-dependent residents. Ilagay lamang ang aktuwal na iniulat."
                }
                className="min-h-[88px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20"
              />
            </label>
          </div>
        )}

        {/* STEP 3: Reported severity and damage */}
        {reportStep === 3 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900">
                  {language === "en"
                    ? "3. Reported Damage Severity"
                    : "3. Reported Damage Severity"}
                </h2>
                <HelpTooltip
                  content={getHelpContent("fieldReportSeverity", language)}
                  align="left"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {language === "en"
                  ? "Select the closest field classification, then describe the reported damage."
                  : "Piliin ang pinakamalapit na field classification, pagkatapos ay ilarawan ang reported damage."}
              </p>
            </div>

            <div className="space-y-2.5">
              {severityLevels.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedSeverity(lvl.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    selectedSeverity === lvl.id
                      ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-xs font-bold">{lvl.label}</span>
                  <span
                    className={`mt-0.5 block text-[11px] ${
                      selectedSeverity === lvl.id ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {lvl.desc}
                  </span>
                </button>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <span>
                  {language === "en" ? "Reported Damage Summary" : "Reported Damage Summary"}
                </span>
                <HelpTooltip
                  content={getHelpContent("reportedDamage", language)}
                  align="left"
                />
              </span>
              <textarea
                value={damageSummary}
                onChange={(event) => setDamageSummary(event.target.value)}
                placeholder={
                  language === "en"
                    ? "Describe only observed or reported damage. Do not infer unreported damage."
                    : "Ilarawan lamang ang observed o reported damage. Huwag magdagdag ng hindi naiulat na pinsala."
                }
                className="min-h-[110px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20"
              />
            </label>
          </div>
        )}

        {/* STEP 4: Conditions, access, and urgent needs */}
        {reportStep === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900">
              {language === "en"
                ? "4. Conditions and Priority Needs"
                : "4. Conditions at Priority Needs"}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span>
                    {language === "en"
                      ? "Status of Critical Facilities"
                      : "Kalagayan ng Critical Facilities"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("criticalFacilities", language)}
                    align="left"
                  />
                </span>
                <textarea
                  value={criticalFacilityCondition}
                  onChange={(event) => setCriticalFacilityCondition(event.target.value)}
                  placeholder={
                    language === "en"
                      ? "Optional: facility name/role and reported condition."
                      : "Opsyonal: facility name/role at reported condition."
                  }
                  className="min-h-[76px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span>
                    {language === "en"
                      ? "Lifeline Service Disruptions"
                      : "Lifeline Service Disruptions"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("lifelineServiceDisruptions", language)}
                    align="left"
                  />
                </span>
                <textarea
                  value={serviceDisruption}
                  onChange={(event) => setServiceDisruption(event.target.value)}
                  placeholder={
                    language === "en"
                      ? "Optional: power, water, communications, transport, roads, health services, or other reported disruption."
                      : "Opsyonal: power, water, communications, transport, roads, health services, o ibang reported disruption."
                  }
                  className="min-h-[76px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span>
                    {language === "en"
                      ? "Access Conditions"
                      : "Access Conditions"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("accessConditions", language)}
                    align="left"
                  />
                </span>
                <textarea
                  value={accessibilityConstraints}
                  onChange={(event) => setAccessibilityConstraints(event.target.value)}
                  placeholder={
                    language === "en"
                      ? "Optional: road or bridge condition, flooding, landslide, debris, or transport disruption."
                      : "Opsyonal: road o bridge condition, flooding, landslide, debris, o transport disruption."
                  }
                  className="min-h-[76px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20"
                />
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-800">
                  {language === "en"
                    ? "Priority Needs (select only what was reported)"
                    : "Priority Needs (piliin lamang ang naiulat)"}
                </p>
                <HelpTooltip
                  content={getHelpContent("priorityNeeds", language)}
                  align="left"
                />
              </div>
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
                      className={`flex min-h-[48px] items-center justify-between rounded-xl border p-3.5 text-left text-xs font-bold transition-all ${
                        isChecked
                          ? "border-blue-400 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <span>{need}</span>
                      {isChecked && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Evidence and source */}
        {reportStep === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === "en"
                  ? "5. What is the report source and supporting evidence?"
                  : "5. Ano ang source at supporting evidence ng report?"}
              </h2>
              <div className="mt-1 flex items-start gap-1.5">
                <p className="text-xs text-slate-500">
                  {language === "en"
                    ? "Use a role, team, bulletin/reference, or other non-sensitive source description when possible."
                    : "Gumamit ng role, team, bulletin/reference, o ibang non-sensitive source description kung maaari."}
                </p>
                <HelpTooltip
                  content={getHelpContent("reportSourceEvidence", language)}
                  align="left"
                />
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <span>
                  {language === "en" ? "Report Source / Reference" : "Report Source / Reference"}
                </span>
                <HelpTooltip
                  content={getHelpContent("reportSourceEvidence", language)}
                  align="left"
                />
              </span>
              <input
                value={reportSourceReference}
                onChange={(event) => setReportSourceReference(event.target.value)}
                placeholder={
                  language === "en"
                    ? "e.g. CDRRMO field team, barangay official, bulletin/ref no."
                    : "hal. CDRRMO field team, barangay official, bulletin/ref no."
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20"
              />
            </label>

            <label className="block rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <span className="block text-xs font-semibold text-slate-700">
                {language === "en"
                  ? "Attach photo evidence (optional)"
                  : "Mag-attach ng photo evidence (opsyonal)"}
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">
                {language === "en"
                  ? "A selected photo is still unverified and will not persist after reload until backend/offline storage is connected."
                  : "Unverified pa rin ang napiling photo at hindi ito magpe-persist pagkatapos ng reload hangga't hindi nakakonekta ang backend/offline storage."}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) =>
                  setEvidenceFileName(event.target.files?.[0]?.name ?? null)
                }
                className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700"
              />
              {evidenceFileName ? (
                <span className="mt-2 block break-all text-[11px] font-semibold text-slate-600">
                  {evidenceFileName}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-800">
                {language === "en" ? "Supporting Evidence Notes" : "Tala sa Supporting Evidence"}
              </span>
              <textarea
                value={photoNote}
                onChange={(event) => setPhotoNote(event.target.value)}
                placeholder={
                  language === "en"
                    ? "Optional landmark, observation, timestamp context, or evidence note..."
                    : "Opsyonal na landmark, observation, timestamp context, o evidence note..."
                }
                className="min-h-[92px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20"
              />
            </label>
          </div>
        )}

        {/* STEP 6: Review and save */}
        {reportStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {language === "en" ? "6. Review and Save" : "6. Suriin at I-save"}
            </h2>

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs sm:p-5">
              {[
                ["Barangay", selectedReportBarangay || "—"],
                ["Incident", selectedIncident || "—"],
                ["Reported Damage Severity", selectedSeverity || "—"],
                ["Reported Affected Persons", reportedAffectedPersons || "Unknown"],
                ["Reported Affected Households", reportedAffectedHouseholds || "Unknown"],
                ["Reported Vulnerable Groups", reportedVulnerableGroups || "None specified"],
                ["Reported Damage Summary", damageSummary || "—"],
                ["Status of Critical Facilities", criticalFacilityCondition || "None specified"],
                ["Lifeline Service Disruptions", serviceDisruption || "None specified"],
                ["Access Conditions", accessibilityConstraints || "None specified"],
                ["Priority Needs", selectedNeeds.join(", ") || "None specified"],
                ["Report Source / Reference", reportSourceReference || "—"],
                ["Supporting Evidence Attachment", evidenceFileName || "None"],
                ["Supporting Evidence Notes", photoNote || "None specified"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0 sm:flex-row sm:justify-between"
                >
                  <span className="text-slate-400">{label}:</span>
                  <span className="max-w-sm text-left font-bold text-slate-900 sm:text-right">
                    {value}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span>
                    {language === "en" ? "Verification Status:" : "Verification Status:"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("verificationStatus", language)}
                    align="right"
                  />
                </span>
                <span className="font-bold text-amber-700">Unverified</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span>{language === "en" ? "Sync Status:" : "Sync Status:"}</span>
                  <HelpTooltip
                    content={getHelpContent("pendingSync", language)}
                    align="right"
                  />
                </span>
                <span className="font-bold text-blue-700">Pending Sync</span>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs leading-relaxed text-blue-900">
              {language === "en"
                ? "Saving marks this report as Pending Sync in the current prototype. The reported information remains unverified until it is synchronized and reviewed by an authorized LGU user."
                : "Kapag na-save, mamarkahan ang report bilang Pending Sync sa kasalukuyang prototype. Mananatiling unverified ang reported information hanggang ma-sync at masuri ng authorized LGU user."}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3">
          {reportStep > (isBarangayUser ? 2 : 1) ? (
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
              disabled={!canAdvanceReport}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t("next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const generatedId =
                  typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? `AGAP-${crypto.randomUUID()}`
                    : `AGAP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

                setPendingReportId(generatedId);
                setPendingReportTimestamp(new Date().toLocaleString());
                setIsReportSubmitted(true);
              }}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-slate-800"
            >
              {language === "en" ? "Save as Pending Sync" : "I-save bilang Pending Sync"}
            </button>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 7: POST IMPACT ACTION CARD
  // =========================================================================
  const renderPostImpactScreen = () => {
    const barangayNames = [...TOP_BARANGAYS, ...OTHER_BARANGAYS].map(
      (barangay) => barangay.name
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <header>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
            {language === "en"
              ? "Post-Disaster Review"
              : "Post-Disaster Review"}
          </span>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {language === "en"
              ? "Post Impact Action Card"
              : "Post Impact Action Card"}
          </h1>

          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            {language === "en"
              ? "Review reported and validated impacts, remaining validation gaps, and source-anchored LGU actions. AGAP does not use a 0–100 recovery score."
              : "Suriin ang reported at validated impacts, natitirang validation gaps, at source-anchored LGU actions. Hindi gumagamit ang AGAP ng 0–100 recovery score."}
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <label className="block max-w-sm">
            <span className="text-xs font-bold text-slate-700">
              {language === "en"
                ? "Barangay for post-impact review"
                : "Barangay para sa post-impact review"}
            </span>

            <select
              value={selectedPostImpactBarangay}
              onChange={(event) =>
                setSelectedPostImpactBarangay(event.target.value)
              }
              className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {barangayNames.map((barangay) => (
                <option key={barangay} value={barangay}>
                  {barangay}
                </option>
              ))}
            </select>
          </label>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            {language === "en"
              ? "Observed impacts and approved actions will populate this card after the backend consolidates damage reports, needs reports, verification records, and action-rule matches."
              : "Lalabas sa card ang observed impacts at approved actions kapag na-consolidate na ng backend ang damage reports, needs reports, verification records, at action-rule matches."}
          </p>
        </section>

        <PostImpactActionCard
          barangayName={selectedPostImpactBarangay}
          eventName={null}
          observedImpacts={null}
          preEventComparison={null}
          dataGaps={[]}
          actions={[]}
        />

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-blue-900">
          <strong>
            {language === "en"
              ? "Post-impact review note:"
              : "Tala sa post-impact review:"}
          </strong>{" "}
          {language === "en"
            ? "Reported impacts remain separate from validated impacts. AGAP does not automatically allocate relief or invent post-disaster actions; authorized LGU users review the available evidence and approved recommendations."
            : "Nananatiling hiwalay ang reported impacts sa validated impacts. Hindi awtomatikong nag-aallocate ng relief o nag-iimbento ng post-disaster actions ang AGAP; sinusuri ng authorized LGU users ang available evidence at approved recommendations."}
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
        return isBarangayUser
          ? renderBarangayDetailView()
          : renderPriorityBarangaysView();
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
    return isBarangayUser ? renderHomeScreen() : renderPostImpactScreen();
  }

  return renderHomeScreen();
};
