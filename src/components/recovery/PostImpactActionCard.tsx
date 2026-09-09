"use client";

import React, { useRef } from "react";
import {
  AlertTriangle,
  Building2,
  CheckSquare,
  FileEdit,
  Printer,
  Users,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export type PostImpactVerificationState =
  | "UNVERIFIED"
  | "FOR_REVIEW"
  | "PARTIALLY_VERIFIED"
  | "VERIFIED";

export type PostImpactActionStatus =
  | "RECOMMENDED"
  | "FOR_VALIDATION"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "DEFERRED"
  | "OVERRIDDEN";

export interface PostImpactActionItem {
  id: string;
  phase: "IMMEDIATE" | "STABILIZATION" | "MITIGATION";
  action: string;
  whyItApplies: string | null;
  evidence: string | null;
  sourceRule: string | null;
  responsibleUnit: string | null;
  confirmationRequired: boolean | null;
  status: PostImpactActionStatus | null;
}

export interface PostImpactActionCardProps {
  barangayName: string;
  eventName: string | null;

  observedImpacts?: {
    reportedAffectedPersons: string | null;
    validatedAffectedPersons: string | null;
    awaitingValidationPersons: string | null;
    reportedAffectedHouseholds: string | null;
    validatedAffectedHouseholds: string | null;
    vulnerableGroupsReported: string | null;
    damageSummary: string | null;
    criticalFacilityCondition: string | null;
    serviceDisruption: string | null;
    accessibilityConstraints: string | null;
    urgentUnmetNeeds: string | null;
    verificationState: PostImpactVerificationState;
    lastValidatedAt: string | null;
  } | null;

  preEventComparison?: {
    estimatedPotentiallyExposedPopulation: string | null;
    estimateMethod: string | null;
    estimateConfidence: string | null;
  } | null;

  dataGaps?: string[];
  actions?: PostImpactActionItem[];

  onValidateImpacts?: () => void;
  onAssignAction?: (actionId: string) => void;
  onUpdateActionStatus?: (actionId: string, status: PostImpactActionStatus) => void;
  onRequestUpdate?: () => void;
  onRecordDecision?: () => void;

  className?: string;
}

const EMPTY = "—";

const verificationStyles: Record<PostImpactVerificationState, string> = {
  UNVERIFIED: "border-slate-200 bg-slate-50 text-slate-600",
  FOR_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  PARTIALLY_VERIFIED: "border-blue-200 bg-blue-50 text-blue-700",
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const actionStatusStyles: Record<PostImpactActionStatus, string> = {
  RECOMMENDED: "border-slate-200 bg-slate-50 text-slate-700",
  FOR_VALIDATION: "border-amber-200 bg-amber-50 text-amber-700",
  ASSIGNED: "border-blue-200 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-indigo-200 bg-indigo-50 text-indigo-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DEFERRED: "border-slate-300 bg-slate-100 text-slate-600",
  OVERRIDDEN: "border-rose-200 bg-rose-50 text-rose-700",
};

function display(value: string | null | undefined) {
  if (value === null || value === undefined || value.trim() === "") return EMPTY;
  return value;
}

function MetricCard({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string | null | undefined;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        emphasis
          ? "border-blue-200 bg-blue-50/60"
          : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="mt-1 block text-sm font-semibold text-slate-900">
        {display(value)}
      </span>
    </div>
  );
}

function VerificationBadge({
  state,
  language,
}: {
  state: PostImpactVerificationState;
  language: "en" | "fil";
}) {
  const labels: Record<PostImpactVerificationState, { en: string; fil: string }> = {
    UNVERIFIED: { en: "Unverified", fil: "Hindi Beripikado" },
    FOR_REVIEW: { en: "For Review", fil: "Para sa Pagsusuri" },
    PARTIALLY_VERIFIED: { en: "Partially Verified", fil: "Bahagyang Beripikado" },
    VERIFIED: { en: "Verified", fil: "Beripikado" },
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${verificationStyles[state]}`}
    >
      {labels[state][language]}
    </span>
  );
}

export const PostImpactActionCard: React.FC<PostImpactActionCardProps> = ({
  barangayName,
  eventName,
  observedImpacts = null,
  preEventComparison = null,
  dataGaps = [],
  actions = [],
  onValidateImpacts,
  onAssignAction,
  onUpdateActionStatus,
  onRequestUpdate,
  onRecordDecision,
  className = "",
}) => {
  const { language } = useLanguage();
  const printableCardRef = useRef<HTMLDivElement>(null);

  const printPostImpactCard = () => {
    if (!printableCardRef.current || typeof window === "undefined") return;

    const printWindow = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=1000,height=850"
    );

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
          <title>Project AGAP - Post Impact Action Card - ${barangayName}</title>
          ${styles}
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: #ffffff;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }

            .agap-post-impact-print-card {
              max-width: 900px !important;
              margin: 0 auto !important;
              border: 0 !important;
              box-shadow: none !important;
            }

            .agap-post-impact-print-hide {
              display: none !important;
            }

            @page {
              size: auto;
              margin: 14mm;
            }
          </style>
        </head>
        <body>
          ${printableCardRef.current.outerHTML}
          <script>
            window.onload = function () {
              window.focus();
              window.print();
              window.onafterprint = function () {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const immediateActions = actions.filter((item) => item.phase === "IMMEDIATE");
  const stabilizationActions = actions.filter(
    (item) => item.phase === "STABILIZATION"
  );
  const mitigationActions = actions.filter((item) => item.phase === "MITIGATION");

  const renderActionGroup = (
    titleEn: string,
    titleFil: string,
    items: PostImpactActionItem[]
  ) => (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
        {language === "en" ? titleEn : titleFil}
      </h3>

      {items.length > 0 ? (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {item.action}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {display(item.whyItApplies)}
                  </p>
                </div>

                {item.status ? (
                  <span
                    className={`self-start rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${actionStatusStyles[item.status]}`}
                  >
                    {item.status.replaceAll("_", " ")}
                  </span>
                ) : null}
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="font-bold text-slate-400">
                    {language === "en" ? "Evidence" : "Ebidensya"}
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    {display(item.evidence)}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-slate-400">
                    {language === "en" ? "Source Rule" : "Source Rule"}
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    {display(item.sourceRule)}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-slate-400">
                    {language === "en" ? "Responsible Unit" : "Responsableng Yunit"}
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    {display(item.responsibleUnit)}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-slate-400">
                    {language === "en"
                      ? "LGU Confirmation"
                      : "LGU Confirmation"}
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    {item.confirmationRequired === null
                      ? EMPTY
                      : item.confirmationRequired
                        ? language === "en"
                          ? "Required"
                          : "Kailangan"
                        : language === "en"
                          ? "Not required"
                          : "Hindi kailangan"}
                  </dd>
                </div>
              </dl>

              {(onAssignAction || onUpdateActionStatus) && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {onAssignAction && (
                    <button
                      type="button"
                      onClick={() => onAssignAction(item.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {language === "en" ? "Assign Action" : "Magtalaga ng Aksyon"}
                    </button>
                  )}

                  {onUpdateActionStatus && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateActionStatus(item.id, "IN_PROGRESS")
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {language === "en"
                        ? "Mark In Progress"
                        : "Markahan bilang In Progress"}
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
          <p className="text-xs text-slate-500">
            {language === "en"
              ? "No source-anchored actions have been supplied yet."
              : "Wala pang source-anchored actions na ibinigay."}
          </p>
        </div>
      )}
    </section>
  );

  return (
    <div
      ref={printableCardRef}
      className={`agap-post-impact-print-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
              Project AGAP
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              {language === "en"
                ? "Post Impact Action Card"
                : "Post Impact Action Card"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Barangay {barangayName}
              {eventName ? ` • ${eventName}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <VerificationBadge
              state={observedImpacts?.verificationState ?? "UNVERIFIED"}
              language={language}
            />

            <button
              type="button"
              onClick={printPostImpactCard}
              className="agap-post-impact-print-hide inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              {language === "en" ? "Print Card" : "I-print ang Card"}
            </button>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs leading-relaxed text-blue-900">
          {language === "en"
            ? "This card uses reported and validated post-impact evidence. It does not use an arbitrary recovery score, automatically allocate relief, or replace authorized LGU decisions."
            : "Gumagamit ang card na ito ng reported at validated post-impact evidence. Hindi ito gumagamit ng arbitrary recovery score, awtomatikong naglalaan ng relief, o pumapalit sa awtorisadong desisyon ng LGU."}
        </p>
      </div>

      <div className="space-y-7 p-5 sm:p-6">
        {/* Impact counts */}
        <section aria-labelledby="post-impact-observed">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <h2
              id="post-impact-observed"
              className="text-sm font-bold text-slate-900"
            >
              {language === "en"
                ? "Observed Population Impacts"
                : "Naobserbahang Epekto sa Populasyon"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label={
                language === "en"
                  ? "Reported Affected Persons"
                  : "Reported Affected Persons"
              }
              value={observedImpacts?.reportedAffectedPersons}
            />
            <MetricCard
              label={
                language === "en"
                  ? "Validated Affected Persons"
                  : "Validated Affected Persons"
              }
              value={observedImpacts?.validatedAffectedPersons}
              emphasis
            />
            <MetricCard
              label={
                language === "en"
                  ? "Population Awaiting Validation"
                  : "Population Awaiting Validation"
              }
              value={observedImpacts?.awaitingValidationPersons}
            />
            <MetricCard
              label={
                language === "en"
                  ? "Reported Affected Households"
                  : "Reported Affected Households"
              }
              value={observedImpacts?.reportedAffectedHouseholds}
            />
            <MetricCard
              label={
                language === "en"
                  ? "Validated Affected Households"
                  : "Validated Affected Households"
              }
              value={observedImpacts?.validatedAffectedHouseholds}
              emphasis
            />
            <MetricCard
              label={
                language === "en"
                  ? "Vulnerable Groups Reported"
                  : "Reported Vulnerable Groups"
              }
              value={observedImpacts?.vulnerableGroupsReported}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span>
              {language === "en" ? "Last validated:" : "Huling validation:"}{" "}
              <strong className="text-slate-700">
                {display(observedImpacts?.lastValidatedAt)}
              </strong>
            </span>
          </div>
        </section>

        {/* Conditions */}
        <section aria-labelledby="post-impact-conditions">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <h2
              id="post-impact-conditions"
              className="text-sm font-bold text-slate-900"
            >
              {language === "en"
                ? "Damage, Services, Access, and Urgent Needs"
                : "Pinsala, Serbisyo, Access, at Agarang Pangangailangan"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricCard
              label={language === "en" ? "Damage Reports" : "Damage Reports"}
              value={observedImpacts?.damageSummary}
            />
            <MetricCard
              label={
                language === "en"
                  ? "Critical-Facility Condition"
                  : "Kalagayan ng Critical Facility"
              }
              value={observedImpacts?.criticalFacilityCondition}
            />
            <MetricCard
              label={
                language === "en" ? "Service Disruption" : "Service Disruption"
              }
              value={observedImpacts?.serviceDisruption}
            />
            <MetricCard
              label={
                language === "en"
                  ? "Accessibility Constraints"
                  : "Accessibility Constraints"
              }
              value={observedImpacts?.accessibilityConstraints}
            />
            <div className="sm:col-span-2">
              <MetricCard
                label={
                  language === "en"
                    ? "Urgent Unmet Needs"
                    : "Agarang Hindi Natutugunang Pangangailangan"
                }
                value={observedImpacts?.urgentUnmetNeeds}
                emphasis
              />
            </div>
          </div>
        </section>

        {/* Pre vs post distinction */}
        <section aria-labelledby="post-impact-comparison">
          <div className="mb-3 flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <h2
              id="post-impact-comparison"
              className="text-sm font-bold text-slate-900"
            >
              {language === "en"
                ? "Pre-Event Estimate vs Post-Event Observation"
                : "Pre-Event Estimate vs Post-Event Observation"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {language === "en"
                  ? "Pre-Event Estimate"
                  : "Pre-Event Estimate"}
              </span>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {display(
                  preEventComparison?.estimatedPotentiallyExposedPopulation
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {language === "en" ? "Method:" : "Paraan:"}{" "}
                {display(preEventComparison?.estimateMethod)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {language === "en" ? "Confidence:" : "Confidence:"}{" "}
                {display(preEventComparison?.estimateConfidence)}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                {language === "en"
                  ? "Post-Event Validated Observation"
                  : "Post-Event Validated Observation"}
              </span>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {display(observedImpacts?.validatedAffectedPersons)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {language === "en"
                  ? "This is a field-validated figure when supplied by the backend and must remain visibly distinct from the pre-event estimate."
                  : "Field-validated figure ito kapag ibinigay ng backend at dapat manatiling malinaw na hiwalay sa pre-event estimate."}
              </p>
            </div>
          </div>
        </section>

        {/* Why urgent review */}
        <section aria-labelledby="post-impact-review">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle
              className="h-4 w-4 text-amber-600"
              aria-hidden="true"
            />
            <h2
              id="post-impact-review"
              className="text-sm font-bold text-slate-900"
            >
              {language === "en"
                ? "Validation Gaps Requiring Review"
                : "Validation Gaps na Kailangang Suriin"}
            </h2>
          </div>

          {dataGaps.length > 0 ? (
            <ul className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
              {dataGaps.map((gap, index) => (
                <li key={`${gap}-${index}`} className="flex gap-2">
                  <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
              <p className="text-xs text-slate-500">
                {language === "en"
                  ? "No validation-gap records have been supplied yet."
                  : "Wala pang naibibigay na validation-gap records."}
              </p>
            </div>
          )}
        </section>

        {/* Action groups */}
        <section aria-labelledby="post-impact-actions">
          <div className="mb-4 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <h2
              id="post-impact-actions"
              className="text-sm font-bold text-slate-900"
            >
              {language === "en"
                ? "LGU Review Actions and Ways Forward"
                : "LGU Review Actions at Ways Forward"}
            </h2>
          </div>

          <div className="space-y-6">
            {renderActionGroup(
              "Immediate LGU Actions",
              "Agarang LGU Actions",
              immediateActions
            )}
            {renderActionGroup(
              "Stabilization Actions",
              "Stabilization Actions",
              stabilizationActions
            )}
            {renderActionGroup(
              "Mitigation and Ways Forward",
              "Mitigation at Ways Forward",
              mitigationActions
            )}
          </div>
        </section>
      </div>

      {/* Card-level controls */}
      <div className="agap-post-impact-print-hide border-t border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {language === "en"
              ? "Authorized Post-Impact Controls"
              : "Authorized Post-Impact Controls"}
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            {language === "en"
              ? "Controls remain disabled until their backend handlers are connected."
              : "Mananatiling disabled ang controls hangga't hindi nakakonekta ang backend handlers."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onValidateImpacts}
            disabled={!onValidateImpacts}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition enabled:hover:border-blue-200 enabled:hover:bg-blue-50 enabled:hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {language === "en" ? "Validate Impacts" : "I-validate ang Epekto"}
          </button>

          <button
            type="button"
            onClick={onRequestUpdate}
            disabled={!onRequestUpdate}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition enabled:hover:border-blue-200 enabled:hover:bg-blue-50 enabled:hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {language === "en" ? "Request Update" : "Humiling ng Update"}
          </button>

          <button
            type="button"
            onClick={onRecordDecision}
            disabled={!onRecordDecision}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition enabled:hover:border-blue-200 enabled:hover:bg-blue-50 enabled:hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {language === "en" ? "Record Decision" : "Itala ang Desisyon"}
          </button>
        </div>
      </div>
    </div>
  );
};
