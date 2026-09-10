"use client";

import React, { useMemo, useRef } from "react";
import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Database,
  FileText,
  Printer,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { getHelpContent, type HelpContentDefinition } from "@/lib/help-content";

export type LGUVerificationState =
  | "UNVERIFIED"
  | "FOR_REVIEW"
  | "VERIFIED"
  | "STALE"
  | "PENDING";

export type LGUActionStatus =
  | "RECOMMENDED"
  | "FOR_VALIDATION"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "DEFERRED"
  | "OVERRIDDEN";

export interface LGUActionRecommendation {
  id: string;
  action: string;
  trigger: string | null;
  whyItApplies: string | null;
  evidence: string | null;
  sourceRule: string | null;
  confirmationRequired: boolean | null;
  responsibleUnit: string | null;
  status: LGUActionStatus | null;
}

export interface LGUCriticalFacility {
  name: string;
  operationalStatus: string | null;
  capacity: string | null;
}

export interface LGUActionCardProps {
  barangayName: string;
  hazard: string | null;

  advisory?: {
    title: string | null;
    reference: string | null;
    issuedAt: string | null;
    validity: string | null;
    verificationState: LGUVerificationState;
  } | null;

  assessment?: {
    likelihood: string | null;
    severity: string | null;
    riskResult: string | null;
    riskCategory?: string | null;
    relativeVulnerability: number | null;
    methodology: string | null;
    assessmentDate: string | null;
    verificationState: LGUVerificationState;
  } | null;

  exposure?: {
    estimatedPersons: string | null;
    estimatedHouseholds: string | null;
    vulnerableGroups: string | null;
    estimationMethod: string | null;
    confidenceLevel: string | null;
    source: string | null;
    referenceDate: string | null;
    generatedAt: string | null;
  } | null;

  capacity?: {
    recordedCapacity: string | null;
    potentialCapacityGap: string | null;
    criticalFacilityReadiness: string | null;
    criticalFacilities?: LGUCriticalFacility[];
    communicationCapability: string | null;
  } | null;

  evidence?: string[];
  dataGaps?: string[];
  recommendations?: LGUActionRecommendation[];

  onValidate?: () => void;
  onAssignAction?: () => void;
  onRequestUpdate?: () => void;
  onGenerateBrief?: () => void;
  onRecordDecision?: () => void;
  onModify?: () => void;
  onDefer?: () => void;
  onOverride?: () => void;

  className?: string;
}

const EMPTY = "—";

const verificationStyles: Record<LGUVerificationState, string> = {
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FOR_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  UNVERIFIED: "border-slate-200 bg-slate-50 text-slate-600",
  STALE: "border-red-200 bg-red-50 text-red-700",
  PENDING: "border-blue-200 bg-blue-50 text-blue-700",
};

const statusStyles: Record<LGUActionStatus, string> = {
  RECOMMENDED: "border-slate-200 bg-slate-50 text-slate-700",
  FOR_VALIDATION: "border-amber-200 bg-amber-50 text-amber-700",
  ASSIGNED: "border-blue-200 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-indigo-200 bg-indigo-50 text-indigo-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DEFERRED: "border-slate-300 bg-slate-100 text-slate-600",
  OVERRIDDEN: "border-rose-200 bg-rose-50 text-rose-700",
};

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return EMPTY;
  return String(value);
}

function formatNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return EMPTY;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(parsed)
    : String(value);
}

function formatDateTime(
  value: string | null | undefined,
  language: "en" | "fil",
) {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "en" ? "en-PH" : "fil-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanizeToken(value: unknown): string {
  if (value === null || value === undefined || value === "") return EMPTY;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return formatNumber(value);
  if (Array.isArray(value)) return value.map(humanizeToken).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${humanizeKey(key)}: ${humanizeToken(item)}`)
      .join(" · ");
  }
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseJson(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function friendlyMethod(value: string | null | undefined) {
  if (!value) return EMPTY;
  const methods: Record<string, string> = {
    INHABITED_AREA_PROPORTIONAL_FALLBACK: "Inhabited area proportion estimate",
    POPULATION_GRID_INTERSECTION: "Population grid intersection",
    RESIDENTIAL_BUILDING_ESTIMATE: "Residential building estimate",
  };
  return methods[value] ?? humanizeToken(value);
}

function friendlyConfidence(value: string | null | undefined) {
  if (!value) return EMPTY;
  const normalized = value.toUpperCase();
  if (normalized === "LOW") return "Low confidence";
  if (normalized === "MEDIUM") return "Medium confidence";
  if (normalized === "HIGH") return "High confidence";
  return humanizeToken(value);
}

function friendlyTrigger(value: string | null | undefined) {
  if (!value) return EMPTY;
  const normalized = value.trim();
  if (/^riskCategory\s+IN\s+\["HIGH","VERY_HIGH"\]$/i.test(normalized)) {
    return "Risk category is High or Very High";
  }
  if (/^capacityGap\s+GT\s+0$/i.test(normalized)) {
    return "Potential capacity gap is greater than 0";
  }
  return normalized
    .replace(/riskCategory/gi, "Risk category")
    .replace(/capacityGap/gi, "Potential capacity gap")
    .replace(/\s+GT\s+/gi, " is greater than ")
    .replace(/\s+GTE\s+/gi, " is at least ")
    .replace(/\s+LT\s+/gi, " is less than ")
    .replace(/\s+EQ\s+/gi, " is ")
    .replaceAll("_", " ");
}

function friendlyEvidence(value: string | null | undefined) {
  if (!value) return EMPTY;
  const parsed = parseJson(value);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const record = parsed as Record<string, unknown>;
    if ("field" in record && "value" in record) {
      return `${humanizeKey(String(record.field))}: ${humanizeToken(record.value)}`;
    }
    return humanizeToken(record);
  }
  return value;
}

function ruleId(value: string | null | undefined) {
  if (!value) return EMPTY;
  return value.split(" · ")[0]?.trim() || value;
}

function StateBadge({
  state,
  language,
}: {
  state: LGUVerificationState;
  language: "en" | "fil";
}) {
  const labels: Record<LGUVerificationState, { en: string; fil: string }> = {
    VERIFIED: { en: "Verified", fil: "Beripikado" },
    FOR_REVIEW: { en: "For Review", fil: "Para sa Pagsusuri" },
    UNVERIFIED: { en: "Unverified", fil: "Hindi Beripikado" },
    STALE: { en: "Stale / Outdated", fil: "Luma / Hindi Napapanahon" },
    PENDING: { en: "Pending", fil: "Nakahihintay" },
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${verificationStyles[state]}`}
    >
      {labels[state][language]}
    </span>
  );
}

function Field({
  label,
  value,
  helpContent,
  helpAlign = "left",
}: {
  label: string;
  value: string | number | null | undefined;
  helpContent?: HelpContentDefinition;
  helpAlign?: "left" | "center" | "right";
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        {helpContent ? (
          <HelpTooltip
            content={helpContent}
            align={helpAlign}
            className="agap-print-hide"
          />
        ) : null}
      </span>
      <span className="mt-1 block break-words text-sm font-semibold leading-relaxed text-slate-900">
        {display(value)}
      </span>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  supportingText,
  emphasis = false,
}: {
  label: string;
  value: string;
  supportingText?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${emphasis ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      {supportingText ? (
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          {supportingText}
        </p>
      ) : null}
    </div>
  );
}

export const LGUActionCard: React.FC<LGUActionCardProps> = ({
  barangayName,
  hazard,
  advisory = null,
  assessment = null,
  exposure = null,
  capacity = null,
  evidence = [],
  dataGaps = [],
  recommendations = [],
  onValidate,
  onAssignAction,
  onRequestUpdate,
  onGenerateBrief,
  onRecordDecision,
  onModify,
  onDefer,
  onOverride,
  className = "",
}) => {
  const { language } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);

  const vulnerableGroups = useMemo(() => {
    const parsed = parseJson(exposure?.vulnerableGroups);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({
      label: humanizeKey(key),
      value: humanizeToken(value),
    }));
  }, [exposure?.vulnerableGroups]);

  const communicationMethods = useMemo(() => {
    const parsed = parseJson(capacity?.communicationCapability);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    if (!capacity?.communicationCapability) return [];
    return capacity.communicationCapability
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [capacity?.communicationCapability]);

  const printCard = () => {
    if (!cardRef.current || typeof window === "undefined") return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1000,height=800");

    if (!printWindow) {
      window.print();
      return;
    }

    const styles = Array.from(
      document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
        'link[rel="stylesheet"], style'
      )
    )
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Project AGAP - LGU Action Card - ${barangayName}</title>
          ${styles}
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: white;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }
            .agap-print-hide { display: none !important; }
            .agap-print-card {
              max-width: 900px !important;
              margin: 0 auto !important;
              border: 0 !important;
              box-shadow: none !important;
            }
            @page { margin: 14mm; }
          </style>
        </head>
        <body>
          ${cardRef.current.outerHTML}
          <script>
            window.onload = function () {
              window.focus();
              window.print();
              window.onafterprint = function () { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const controls = [
    {
      label: language === "en" ? "Validate Assessment" : "I-validate ang Assessment",
      onClick: onValidate,
    },
    {
      label: language === "en" ? "Assign Action" : "Magtalaga ng Aksyon",
      onClick: onAssignAction,
    },
    {
      label: language === "en" ? "Request Update" : "Humiling ng Update",
      onClick: onRequestUpdate,
    },
    {
      label: language === "en" ? "Generate Preparedness Brief" : "Gumawa ng Preparedness Brief",
      onClick: onGenerateBrief,
    },
    {
      label: language === "en" ? "Record Decision" : "Itala ang Desisyon",
      onClick: onRecordDecision,
    },
    {
      label: language === "en" ? "Modify" : "Baguhin",
      onClick: onModify,
    },
    {
      label: language === "en" ? "Defer" : "Ipagpaliban",
      onClick: onDefer,
    },
    {
      label: language === "en" ? "Override" : "I-override",
      onClick: onOverride,
    },
  ];
  const availableControls = controls.filter((control) => Boolean(control.onClick));

  const riskCategory = humanizeToken(assessment?.riskCategory || "For review");
  const riskScore = formatNumber(assessment?.riskResult);
  const recordedCapacity = formatNumber(capacity?.recordedCapacity);
  const capacityGap = formatNumber(capacity?.potentialCapacityGap);
  const facilities = capacity?.criticalFacilities ?? [];

  return (
    <div className={className}>
      <div
        ref={cardRef}
        className="agap-print-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 bg-slate-50/70 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                Project AGAP
              </span>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                LGU Action Card
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Barangay {barangayName}
                {hazard ? ` · ${hazard}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-amber-800">
                  {riskCategory} Risk
                </span>
                <StateBadge
                  state={assessment?.verificationState ?? "UNVERIFIED"}
                  language={language}
                />
              </div>
            </div>

            <div className="agap-print-hide flex flex-wrap gap-2">
              <button
                type="button"
                onClick={printCard}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                {language === "en" ? "Print Card" : "I-print ang Card"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric
              label={language === "en" ? "Risk Assessment" : "Risk Assessment"}
              value={`${riskCategory} · ${riskScore}`}
              supportingText={
                assessment?.likelihood && assessment?.severity
                  ? `Likelihood ${assessment.likelihood} × Severity ${assessment.severity}`
                  : undefined
              }
              emphasis
            />
            <SummaryMetric
              label={language === "en" ? "Potential Exposure" : "Posibleng Exposure"}
              value={`${formatNumber(exposure?.estimatedPersons)} people`}
              supportingText={
                exposure?.estimatedHouseholds
                  ? `About ${formatNumber(exposure.estimatedHouseholds)} households`
                  : undefined
              }
            />
            <SummaryMetric
              label={language === "en" ? "Validated Shelter Capacity" : "Validated Shelter Capacity"}
              value={`${recordedCapacity} people`}
              supportingText="Recorded evacuation and temporary shelter capacity"
            />
            <SummaryMetric
              label={language === "en" ? "Potential Capacity Gap" : "Posibleng Capacity Gap"}
              value={`${capacityGap} people`}
              supportingText="Requires LGU validation before operational use"
              emphasis={Number(capacity?.potentialCapacityGap) > 0}
            />
          </div>
        </div>

        <div className="space-y-7 p-5 sm:p-6">
          <section aria-labelledby="lgu-card-actions">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-actions" className="text-base font-bold text-slate-950">
                {language === "en" ? "What the LGU should review next" : "Mga susunod na dapat suriin ng LGU"}
              </h2>
              <HelpTooltip
                content={getHelpContent("recommendedLGUActions", language)}
                align="left"
                className="agap-print-hide"
              />
            </div>

            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((item, index) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-sm font-bold leading-relaxed text-slate-950">
                              {item.action}
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              {display(item.whyItApplies)}
                            </p>
                          </div>
                          {item.status ? (
                            <span
                              className={`self-start rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles[item.status]}`}
                            >
                              {item.status.replaceAll("_", " ")}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                          <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                            <strong className="text-slate-900">Triggered because: </strong>
                            {friendlyTrigger(item.trigger)}
                          </p>
                          <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                            <strong className="text-slate-900">Responsible unit: </strong>
                            {display(item.responsibleUnit)}
                          </p>
                        </div>

                        <details className="agap-print-hide mt-3 text-xs">
                          <summary className="cursor-pointer font-semibold text-blue-700">
                            View rule and evidence details
                          </summary>
                          <div className="mt-2 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600 sm:grid-cols-2">
                            <p>
                              <strong className="text-slate-800">Evidence: </strong>
                              {friendlyEvidence(item.evidence)}
                            </p>
                            <p>
                              <strong className="text-slate-800">Rule: </strong>
                              {ruleId(item.sourceRule)}
                            </p>
                            <p className="sm:col-span-2">
                              <strong className="text-slate-800">LGU confirmation required: </strong>
                              {item.confirmationRequired === null
                                ? EMPTY
                                : item.confirmationRequired
                                  ? language === "en"
                                    ? "Yes"
                                    : "Oo"
                                  : language === "en"
                                    ? "No"
                                    : "Hindi"}
                            </p>
                          </div>
                        </details>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                <FileText className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  No verified, source based LGU actions are available yet
                </p>
              </div>
            )}
          </section>

          <section aria-labelledby="lgu-card-exposure">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-exposure" className="text-base font-bold text-slate-950">
                {language === "en"
                  ? "Potentially exposed population"
                  : "Tinatayang populasyong posibleng malantad"}
              </h2>
              <HelpTooltip
                content={getHelpContent("potentiallyExposedPopulation", language)}
                align="left"
                className="agap-print-hide"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-2xl font-black text-slate-950">
                  {formatNumber(exposure?.estimatedPersons)}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estimated potentially exposed persons
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-2xl font-black text-slate-950">
                  {formatNumber(exposure?.estimatedHouseholds)}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estimated households
                </p>
              </div>
            </div>

            {vulnerableGroups.length > 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Estimated vulnerable groups
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {vulnerableGroups.map((group) => (
                    <span
                      key={group.label}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {group.label}: {group.value}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Estimate confidence: <strong className="text-slate-700">{friendlyConfidence(exposure?.confidenceLevel)}</strong>.
              This is a planning estimate, not a confirmed affected population.
            </p>
          </section>

          <section aria-labelledby="lgu-card-capacity">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-capacity" className="text-base font-bold text-slate-950">
                {language === "en" ? "Evacuation and facility readiness" : "Evacuation at facility readiness"}
              </h2>
              <HelpTooltip
                content={getHelpContent("preparednessCapacity", language)}
                align="left"
                className="agap-print-hide"
              />
            </div>

            {facilities.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="hidden grid-cols-[1fr_180px_140px] gap-3 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:grid">
                  <span>Facility</span>
                  <span>Status</span>
                  <span>Capacity</span>
                </div>
                {facilities.map((facility, index) => {
                  const status = (facility.operationalStatus || "Unknown").toUpperCase();
                  const statusClass =
                    status.includes("NEEDS") || status.includes("CONFIRM")
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : status.includes("READY") || status.includes("OPERATIONAL")
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-600";
                  return (
                    <div
                      key={`${facility.name}-${index}`}
                      className="grid gap-2 border-t border-slate-100 px-4 py-3 text-sm first:border-t-0 sm:grid-cols-[1fr_180px_140px] sm:items-center sm:gap-3"
                    >
                      <span className="font-semibold text-slate-900">{facility.name}</span>
                      <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}>
                        {humanizeToken(facility.operationalStatus || "Unknown")}
                      </span>
                      <span className="text-slate-700">
                        <span className="mr-1 text-xs text-slate-400 sm:hidden">Capacity:</span>
                        {facility.capacity ? formatNumber(facility.capacity) : "Not recorded"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Critical facility readiness has not been structured into individual facility records yet.
              </p>
            )}

            <div className="mt-3 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Communication capability
              </p>
              {communicationMethods.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {communicationMethods.map((method) => (
                    <span
                      key={method}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800"
                    >
                      {humanizeToken(method)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Not recorded</p>
              )}
            </div>
          </section>

          <section aria-labelledby="lgu-card-evidence">
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-evidence" className="text-base font-bold text-slate-950">
                {language === "en" ? "Why this needs attention" : "Bakit kailangan ng atensyon"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assessment evidence
                </p>
                {evidence.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                    {evidence.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No verified evidence has been connected yet.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Information gaps and limitations
                </p>
                {dataGaps.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                    {dataGaps.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <AlertTriangle
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No information gaps are recorded.
                  </p>
                )}
              </div>
            </div>
          </section>

          <details className="agap-print-hide rounded-xl border border-slate-200 bg-slate-50/60">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-800">
              View source, methodology and assessment details
            </summary>
            <div className="space-y-5 border-t border-slate-200 p-4">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-slate-900">Official advisory information</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Advisory / Bulletin" value={advisory?.reference} />
                  <Field label="Issued / Updated" value={formatDateTime(advisory?.issuedAt, language)} />
                  <Field label="Valid Until" value={formatDateTime(advisory?.validity, language)} />
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Advisory Status
                    </p>
                    <div className="mt-1.5">
                      <StateBadge
                        state={advisory?.verificationState ?? "UNVERIFIED"}
                        language={language}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-slate-900">DRRM assessment details</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Likelihood" value={assessment?.likelihood} />
                  <Field label="Severity" value={assessment?.severity} />
                  <Field label="Risk Result" value={assessment?.riskResult} />
                  <Field label="Relative Vulnerability" value={assessment?.relativeVulnerability} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Assessment Methodology" value={assessment?.methodology} />
                  <Field label="Assessment Date" value={formatDateTime(assessment?.assessmentDate, language)} />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900">Exposure estimate details</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Estimation Method" value={friendlyMethod(exposure?.estimationMethod)} />
                  <Field label="Confidence Level" value={friendlyConfidence(exposure?.confidenceLevel)} />
                  <Field label="Source" value={exposure?.source} />
                  <Field label="Data Reference Date" value={formatDateTime(exposure?.referenceDate, language)} />
                </div>
              </section>

              <p className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs leading-relaxed text-blue-900">
                Risk follows the documented DRRM method and verified inputs. AI may explain the result but cannot change the calculation.
              </p>
            </div>
          </details>
        </div>

        {availableControls.length > 0 ? (
          <div className="agap-print-hide border-t border-slate-200 bg-slate-50/80 p-4 sm:p-5">
            <div className="mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Authorized LGU Controls
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Each visible control is connected to an available review or action workflow.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableControls.map((control) => (
                <button
                  key={control.label}
                  type="button"
                  onClick={control.onClick}
                  className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {control.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
