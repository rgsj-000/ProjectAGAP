"use client";

import React, { useRef } from "react";
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
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
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
      <span className="mt-1 block text-sm font-semibold text-slate-900">
        {display(value)}
      </span>
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

  return (
    <div className={className}>
      <div
        ref={cardRef}
        className="agap-print-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Situation Header */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                Project AGAP
              </span>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {language === "en" ? "LGU Action Card" : "LGU Action Card"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Barangay {barangayName}
                {hazard ? ` • ${hazard}` : ""}
              </p>
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
            <Field
              label={language === "en" ? "Current Advisory" : "Kasalukuyang Advisory"}
              value={advisory?.title}
              helpContent={getHelpContent("currentAdvisory", language)}
            />
            <Field
              label={language === "en" ? "Risk Result" : "Resulta ng Panganib"}
              value={assessment?.riskResult}
              helpContent={getHelpContent("riskResult", language)}
              helpAlign="center"
            />
            <Field
              label={language === "en" ? "Assessment Date" : "Petsa ng Pagtatasa"}
              value={assessment?.assessmentDate}
            />
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === "en" ? "Verification Status" : "Verification Status"}
                </span>
                <HelpTooltip
                  content={getHelpContent("assessmentVerificationStatus", language)}
                  align="right"
                  className="agap-print-hide"
                />
              </div>
              <div className="mt-1.5">
                <StateBadge
                  state={assessment?.verificationState ?? "UNVERIFIED"}
                  language={language}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {/* Verified Advisory */}
          <section aria-labelledby="lgu-card-advisory">
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-advisory" className="text-sm font-bold text-slate-900">
                {language === "en" ? "Official Advisory Information" : "Impormasyon ng Opisyal na Advisory"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={language === "en" ? "Advisory / Bulletin" : "Babala / Bulletin"}
                value={advisory?.reference}
              />
              <Field
                label={language === "en" ? "Issued / Updated" : "Inilabas / In-update"}
                value={advisory?.issuedAt}
              />
              <Field
                label={language === "en" ? "Advisory Valid Until" : "Balido ang Advisory Hanggang"}
                value={advisory?.validity}
                helpContent={getHelpContent("advisoryValidUntil", language)}
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === "en" ? "Advisory Status" : "Advisory Status"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("advisoryVerificationStatus", language)}
                    align="right"
                    className="agap-print-hide"
                  />
                </div>
                <div className="mt-1.5">
                  <StateBadge
                    state={advisory?.verificationState ?? "UNVERIFIED"}
                    language={language}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Deterministic Assessment */}
          <section aria-labelledby="lgu-card-assessment">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-assessment" className="text-sm font-bold text-slate-900">
                {language === "en"
                  ? "DRRM Risk Assessment"
                  : "DRRM Risk Assessment"}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Field
                label={
                  language === "en"
                    ? "Likelihood of Occurrence"
                    : "Likelihood of Occurrence"
                }
                value={assessment?.likelihood}
                helpContent={getHelpContent("likelihood", language)}
              />
              <Field
                label={
                  language === "en"
                    ? "Severity of Consequence"
                    : "Severity of Consequence"
                }
                value={assessment?.severity}
                helpContent={getHelpContent("severity", language)}
              />
              <Field
                label={language === "en" ? "Risk Result" : "Resulta ng Panganib"}
                value={assessment?.riskResult}
                helpContent={getHelpContent("riskResult", language)}
                helpAlign="center"
              />
              <Field
                label={
                  language === "en"
                    ? "Relative Vulnerability"
                    : "Relative Vulnerability"
                }
                value={assessment?.relativeVulnerability}
                helpContent={getHelpContent("relativeVulnerability", language)}
                helpAlign="right"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={
                  language === "en"
                    ? "Assessment Methodology"
                    : "Assessment Methodology"
                }
                value={assessment?.methodology}
                helpContent={getHelpContent("methodology", language)}
              />
              <Field
                label={language === "en" ? "Assessment Date" : "Petsa ng Pagtatasa"}
                value={assessment?.assessmentDate}
              />
            </div>

            <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs leading-relaxed text-blue-900">
              {language === "en"
                ? "Risk follows the documented DRRM method and verified inputs. AI may explain the result but cannot change the calculation."
                : "Ang risk ay sumusunod sa documented DRRM method at verified inputs. Maaaring ipaliwanag ng AI ang result ngunit hindi nito mababago ang calculation."}
            </p>
          </section>

          {/* Population Exposure */}
          <section aria-labelledby="lgu-card-exposure">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-exposure" className="text-sm font-bold text-slate-900">
                {language === "en"
                  ? "Estimated Potentially Exposed Population"
                  : "Tinatayang Populasyong Posibleng Malantad"}
              </h2>
              <HelpTooltip
                content={getHelpContent("potentiallyExposedPopulation", language)}
                align="left"
                className="agap-print-hide"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field
                label={
                  language === "en"
                    ? "Estimated Potentially Exposed Persons"
                    : "Tinatayang Posibleng Malantad na Tao"
                }
                value={exposure?.estimatedPersons}
                helpContent={getHelpContent("potentiallyExposedPopulation", language)}
              />
              <Field
                label={language === "en" ? "Estimated Exposed Households" : "Tinatayang Exposed Households"}
                value={exposure?.estimatedHouseholds}
                helpContent={getHelpContent("estimatedExposedHouseholds", language)}
                helpAlign="center"
              />
              <Field
                label={language === "en" ? "Estimated Vulnerable Groups" : "Tinatayang Vulnerable Groups"}
                value={exposure?.vulnerableGroups}
                helpContent={getHelpContent("estimatedVulnerableGroups", language)}
                helpAlign="right"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label={language === "en" ? "Estimation Method" : "Paraan ng Pagtatantiya"}
                value={exposure?.estimationMethod}
                helpContent={getHelpContent("exposureEstimationMethod", language)}
              />
              <Field
                label={language === "en" ? "Confidence Level" : "Confidence Level"}
                value={exposure?.confidenceLevel}
                helpContent={getHelpContent("confidenceLevel", language)}
                helpAlign="center"
              />
              <Field
                label={language === "en" ? "Source" : "Pinagmulan"}
                value={exposure?.source}
              />
              <Field
                label={language === "en" ? "Data Reference Date" : "Petsa ng Reference Data"}
                value={exposure?.referenceDate}
              />
            </div>
          </section>

          {/* Preparedness Capacity */}
          <section aria-labelledby="lgu-card-capacity">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-capacity" className="text-sm font-bold text-slate-900">
                {language === "en" ? "Preparedness Capacity" : "Kapasidad sa Paghahanda"}
              </h2>
              <HelpTooltip
                content={getHelpContent("preparednessCapacity", language)}
                align="left"
                className="agap-print-hide"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label={
                  language === "en"
                    ? "Validated Evacuation / Temporary-Shelter Capacity"
                    : "Validated Evacuation / Temporary-Shelter Capacity"
                }
                value={capacity?.recordedCapacity}
                helpContent={getHelpContent("validatedShelterCapacity", language)}
              />
              <Field
                label={language === "en" ? "Potential Capacity Gap" : "Posibleng Capacity Gap"}
                value={capacity?.potentialCapacityGap}
                helpContent={getHelpContent("potentialCapacityGap", language)}
                helpAlign="center"
              />
              <Field
                label={
                  language === "en"
                    ? "Critical Facilities Readiness"
                    : "Kahandaan ng Critical Facilities"
                }
                value={capacity?.criticalFacilityReadiness}
                helpContent={getHelpContent("criticalFacilities", language)}
                helpAlign="right"
              />
              <Field
                label={language === "en" ? "Communication Capability" : "Communication Capability"}
                value={capacity?.communicationCapability}
                helpContent={getHelpContent("communicationCapability", language)}
                helpAlign="right"
              />
            </div>
          </section>

          {/* Why This Needs Attention */}
          <section aria-labelledby="lgu-card-evidence">
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-evidence" className="text-sm font-bold text-slate-900">
                {language === "en" ? "Why This Needs Attention" : "Bakit Kailangan ng Atensyon"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === "en" ? "Assessment Evidence" : "Assessment Evidence"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("assessmentEvidence", language)}
                    align="left"
                    className="agap-print-hide"
                  />
                </div>
                {evidence.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-700">
                    {evidence.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    {language === "en"
                      ? "No verified evidence has been connected yet."
                      : "Wala pang nakakonektang beripikadong ebidensya."}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === "en"
                      ? "Information Gaps and Limitations"
                      : "Kakulangan at Limitasyon ng Impormasyon"}
                  </span>
                  <HelpTooltip
                    content={getHelpContent("dataGaps", language)}
                    align="right"
                    className="agap-print-hide"
                  />
                </div>
                {dataGaps.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-700">
                    {dataGaps.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <AlertTriangle
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    {language === "en"
                      ? "No information-gap or limitation records are available yet."
                      : "Wala pang available na tala ng information gaps o limitations."}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Recommendations */}
          <section aria-labelledby="lgu-card-actions">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 id="lgu-card-actions" className="text-sm font-bold text-slate-900">
                {language === "en"
                  ? "Recommended LGU Actions for Review"
                  : "Recommended LGU Actions for Review"}
              </h2>
              <HelpTooltip
                content={getHelpContent("recommendedLGUActions", language)}
                align="left"
                className="agap-print-hide"
              />
            </div>

            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{item.action}</h3>
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

                    <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="font-bold text-slate-400">Condition / Trigger</dt>
                        <dd className="mt-0.5 text-slate-700">{display(item.trigger)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-slate-400">Evidence</dt>
                        <dd className="mt-0.5 text-slate-700">{display(item.evidence)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-slate-400">Action Rule Reference</dt>
                        <dd className="mt-0.5 text-slate-700">{display(item.sourceRule)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-slate-400">Responsible LGU Unit</dt>
                        <dd className="mt-0.5 text-slate-700">{display(item.responsibleUnit)}</dd>
                      </div>
                    </dl>

                    <div className="mt-3 text-[11px] text-slate-500">
                      {language === "en" ? "LGU confirmation required: " : "Kailangan ng LGU confirmation: "}
                      <strong className="text-slate-700">
                        {item.confirmationRequired === null
                          ? EMPTY
                          : item.confirmationRequired
                            ? language === "en"
                              ? "Yes"
                              : "Oo"
                            : language === "en"
                              ? "No"
                              : "Hindi"}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                <FileText className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {language === "en"
                    ? "No verified, source-based LGU actions are available yet"
                    : "Wala pang verified at source-based na LGU actions"}
                </p>
                <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-slate-500">
                  {language === "en"
                    ? "Recommended actions will appear after verified conditions are matched with the approved action-rule library."
                    : "Lalabas ang recommended actions kapag na-match ang verified conditions sa approved action-rule library."}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* LGU Controls */}
        <div className="agap-print-hide border-t border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <div className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {language === "en" ? "Authorized LGU Controls" : "Authorized LGU Controls"}
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              {language === "en"
                ? "These controls are available only to authorized LGU users. Disabled controls are not yet connected to the required system action."
                : "Ang controls na ito ay para lamang sa authorized LGU users. Ang disabled controls ay hindi pa nakakonekta sa kinakailangang system action."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {controls.map((control) => (
              <button
                key={control.label}
                type="button"
                onClick={control.onClick}
                disabled={!control.onClick}
                className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors enabled:hover:border-blue-200 enabled:hover:bg-blue-50 enabled:hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {control.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
