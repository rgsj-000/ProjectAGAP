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
import HelpTooltip from "@/components/ui/HelpTooltip";
import { getHelpContent, type HelpContentDefinition } from "@/lib/help-content";

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

function printDisplay(value: string | null | undefined) {
  if (value === null || value === undefined || value.trim() === "") {
    return "Not available";
  }

  return value;
}

function escapeHtml(value: string | null | undefined) {
  const source = value ?? "";

  return source
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function MetricCard({
  label,
  value,
  emphasis = false,
  helpContent,
  helpAlign = "left",
}: {
  label: string;
  value: string | null | undefined;
  emphasis?: boolean;
  helpContent?: HelpContentDefinition;
  helpAlign?: "left" | "center" | "right";
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        emphasis
          ? "border-blue-200 bg-blue-50/60"
          : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        {helpContent ? (
          <HelpTooltip content={helpContent} align={helpAlign} />
        ) : null}
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
    if (typeof window === "undefined") return;

    const printWindow = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=1100,height=900"
    );

    if (!printWindow) {
      window.print();
      return;
    }

    const verificationState =
      observedImpacts?.verificationState ?? "UNVERIFIED";

    const printedAt = new Date().toLocaleString();

    const field = (label: string, value: string | null | undefined) => `
      <div class="field">
        <div class="field-label">${escapeHtml(label)}</div>
        <div class="field-value ${printDisplay(value) === "Not available" ? "empty" : ""}">
          ${escapeHtml(printDisplay(value))}
        </div>
      </div>
    `;

    const actionRows = (items: PostImpactActionItem[]) => {
      if (items.length === 0) {
        return `
          <div class="empty-block">
            No verified, source-based actions are available yet.
          </div>
        `;
      }

      return items
        .map(
          (item) => `
            <div class="action-item">
              <div class="action-head">
                <strong>${escapeHtml(item.action)}</strong>
                <span class="status-pill">
                  ${escapeHtml(item.status?.replaceAll("_", " ") ?? "Not available")}
                </span>
              </div>
              <div class="action-reason">
                ${escapeHtml(printDisplay(item.whyItApplies))}
              </div>
              <div class="action-meta">
                ${field("Evidence", item.evidence)}
                ${field("Action Rule Reference", item.sourceRule)}
                ${field("Responsible LGU Unit", item.responsibleUnit)}
                ${field(
                  "LGU Confirmation Required",
                  item.confirmationRequired === null
                    ? null
                    : item.confirmationRequired
                      ? "Required"
                      : "Not required"
                )}
              </div>
            </div>
          `
        )
        .join("");
    };

    const printHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Project AGAP - Post Impact Action Card - ${escapeHtml(
            barangayName
          )}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              background: #e5e7eb;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }

            .toolbar {
              position: sticky;
              top: 0;
              z-index: 10;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              padding: 12px 20px;
              background: #ffffff;
              border-bottom: 1px solid #dbe3ef;
            }

            .toolbar-copy {
              min-width: 0;
            }

            .toolbar-title {
              font-size: 14px;
              font-weight: 800;
            }

            .toolbar-note {
              margin-top: 2px;
              font-size: 11px;
              color: #64748b;
            }

            .toolbar-actions {
              display: flex;
              gap: 8px;
              flex-shrink: 0;
            }

            .toolbar button {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              background: #ffffff;
              padding: 9px 14px;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
            }

            .toolbar button.primary {
              border-color: #0f172a;
              background: #0f172a;
              color: #ffffff;
            }

            .page-wrap {
              padding: 24px;
            }

            .print-page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #d7dee8;
              box-shadow: 0 12px 34px rgba(15, 23, 42, 0.12);
              padding: 14mm;
            }

            .doc-header {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding-bottom: 14px;
              border-bottom: 2px solid #0f172a;
            }

            .brand-kicker {
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.16em;
              color: #1d4ed8;
              text-transform: uppercase;
            }

            h1 {
              margin: 5px 0 0;
              font-size: 24px;
              line-height: 1.15;
            }

            .barangay {
              margin-top: 6px;
              font-size: 13px;
              color: #475569;
            }

            .doc-meta {
              min-width: 185px;
              text-align: right;
              font-size: 10px;
              color: #475569;
            }

            .verification {
              display: inline-block;
              margin-bottom: 7px;
              border: 1px solid #f59e0b;
              border-radius: 999px;
              padding: 5px 9px;
              background: #fffbeb;
              color: #92400e;
              font-weight: 800;
              letter-spacing: 0.06em;
              text-transform: uppercase;
            }

            .notice {
              margin-top: 14px;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              background: #eff6ff;
              padding: 10px 12px;
              font-size: 10px;
              line-height: 1.5;
              color: #1e3a8a;
            }

            .section {
              margin-top: 18px;
              break-inside: avoid;
            }

            .section-title {
              margin: 0 0 8px;
              padding-bottom: 5px;
              border-bottom: 1px solid #cbd5e1;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }

            .grid-2,
            .grid-3,
            .grid-4 {
              display: grid;
              gap: 8px;
            }

            .grid-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .grid-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .grid-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            .field {
              min-width: 0;
              border: 1px solid #dbe3ef;
              border-radius: 7px;
              background: #ffffff;
              padding: 8px 9px;
              break-inside: avoid;
            }

            .field-label {
              font-size: 8.5px;
              font-weight: 800;
              letter-spacing: 0.05em;
              color: #64748b;
              text-transform: uppercase;
            }

            .field-value {
              margin-top: 4px;
              min-height: 16px;
              font-size: 10.5px;
              line-height: 1.45;
              white-space: pre-wrap;
              overflow-wrap: anywhere;
            }

            .field-value.empty {
              color: #94a3b8;
              font-style: italic;
            }

            .empty-block {
              border: 1px dashed #cbd5e1;
              border-radius: 7px;
              padding: 12px;
              font-size: 10px;
              color: #64748b;
              text-align: center;
            }

            .action-item {
              margin-top: 8px;
              border: 1px solid #dbe3ef;
              border-radius: 8px;
              padding: 10px;
              break-inside: avoid;
            }

            .action-head {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              font-size: 11px;
            }

            .status-pill {
              flex-shrink: 0;
              border: 1px solid #cbd5e1;
              border-radius: 999px;
              padding: 3px 7px;
              font-size: 8px;
              font-weight: 800;
              color: #475569;
              text-transform: uppercase;
            }

            .action-reason {
              margin-top: 5px;
              font-size: 9.5px;
              line-height: 1.45;
              color: #475569;
            }

            .action-meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 7px;
              margin-top: 8px;
            }

            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              gap: 16px;
              font-size: 8.5px;
              line-height: 1.4;
              color: #64748b;
            }

            .footer strong {
              color: #334155;
            }

            @media print {
              body {
                background: #ffffff;
              }

              .toolbar {
                display: none !important;
              }

              .page-wrap {
                padding: 0;
              }

              .print-page {
                width: auto;
                min-height: auto;
                margin: 0;
                border: 0;
                box-shadow: none;
                padding: 0;
              }

              @page {
                size: A4 portrait;
                margin: 12mm;
              }
            }

            @media screen and (max-width: 850px) {
              .page-wrap {
                overflow-x: auto;
              }
            }
          </style>
        </head>

        <body>
          <div class="toolbar">
            <div class="toolbar-copy">
              <div class="toolbar-title">Post Impact Action Card — Print Preview</div>
              <div class="toolbar-note">
                Empty fields are intentionally shown as “Not available” for demonstration.
              </div>
            </div>

            <div class="toolbar-actions">
              <button onclick="window.close()">Close</button>
              <button class="primary" onclick="window.print()">Print</button>
            </div>
          </div>

          <div class="page-wrap">
            <main class="print-page">
              <header class="doc-header">
                <div>
                  <div class="brand-kicker">Project AGAP</div>
                  <h1>Post Impact Action Card</h1>
                  <div class="barangay">
                    Barangay ${escapeHtml(barangayName)}
                    ${
                      eventName
                        ? ` • ${escapeHtml(eventName)}`
                        : ""
                    }
                  </div>
                </div>

                <div class="doc-meta">
                  <div class="verification">
                    ${escapeHtml(verificationState.replaceAll("_", " "))}
                  </div>
                  <div><strong>Generated:</strong> ${escapeHtml(printedAt)}</div>
                  <div style="margin-top:3px;"><strong>Document:</strong> Post Impact Review</div>
                </div>
              </header>

              <div class="notice">
                Reported and validated information are kept separate. Empty fields in this
                demonstration remain marked “Not available.” AGAP does not automatically
                allocate relief, declare locations safe, or replace authorized LGU decisions.
              </div>

              <section class="section">
                <h2 class="section-title">1. Social Impact — Affected Population & Households</h2>
                <div class="grid-3">
                  ${field(
                    "Reported Affected Persons",
                    observedImpacts?.reportedAffectedPersons
                  )}
                  ${field(
                    "Validated Affected Persons",
                    observedImpacts?.validatedAffectedPersons
                  )}
                  ${field(
                    "Affected Persons Pending Validation",
                    observedImpacts?.awaitingValidationPersons
                  )}
                  ${field(
                    "Reported Affected Households",
                    observedImpacts?.reportedAffectedHouseholds
                  )}
                  ${field(
                    "Validated Affected Households",
                    observedImpacts?.validatedAffectedHouseholds
                  )}
                  ${field(
                    "Reported Vulnerable Groups",
                    observedImpacts?.vulnerableGroupsReported
                  )}
                </div>

                <div class="grid-2" style="margin-top:8px;">
                  ${field(
                    "Verification Status",
                    verificationState.replaceAll("_", " ")
                  )}
                  ${field(
                    "Last Validation Update",
                    observedImpacts?.lastValidatedAt
                  )}
                </div>
              </section>

              <section class="section">
                <h2 class="section-title">2. Damage, Status of Lifelines & Priority Needs</h2>
                <div class="grid-2">
                  ${field("Reported Damage", observedImpacts?.damageSummary)}
                  ${field(
                    "Status of Critical Facilities",
                    observedImpacts?.criticalFacilityCondition
                  )}
                  ${field(
                    "Lifeline Service Disruptions",
                    observedImpacts?.serviceDisruption
                  )}
                  ${field(
                    "Access Conditions",
                    observedImpacts?.accessibilityConstraints
                  )}
                </div>

                <div style="margin-top:8px;">
                  ${field("Priority Needs", observedImpacts?.urgentUnmetNeeds)}
                </div>
              </section>

              <section class="section">
                <h2 class="section-title">3. Pre-Disaster Exposure vs Validated Post-Disaster Impact</h2>
                <div class="grid-3">
                  ${field(
                    "Pre-Disaster Exposure Estimate",
                    preEventComparison?.estimatedPotentiallyExposedPopulation
                  )}
                  ${field(
                    "Estimation Method",
                    preEventComparison?.estimateMethod
                  )}
                  ${field(
                    "Confidence Level",
                    preEventComparison?.estimateConfidence
                  )}
                </div>
              </section>

              <section class="section">
                <h2 class="section-title">4. Information Pending Validation</h2>
                ${
                  dataGaps.length > 0
                    ? `<div class="field">
                        <div class="field-label">Information gaps / limitations</div>
                        <div class="field-value">
                          ${dataGaps
                            .map(
                              (gap, index) =>
                                `${index + 1}. ${escapeHtml(gap)}`
                            )
                            .join("<br />")}
                        </div>
                      </div>`
                    : `<div class="empty-block">
                        No information gaps have been recorded yet.
                      </div>`
                }
              </section>

              <section class="section">
                <h2 class="section-title">5. Immediate Response Actions</h2>
                ${actionRows(immediateActions)}
              </section>

              <section class="section">
                <h2 class="section-title">6. Stabilization and Early Recovery Actions</h2>
                ${actionRows(stabilizationActions)}
              </section>

              <section class="section">
                <h2 class="section-title">7. Mitigation / Ways Forward</h2>
                ${actionRows(mitigationActions)}
              </section>

              <footer class="footer">
                <div>
                  <strong>Project AGAP</strong><br />
                  AI-assisted disaster preparedness, response, and recovery decision support.
                </div>

                <div style="text-align:right;">
                  This printout is a decision-support record.<br />
                  Validation and operational decisions remain with authorized LGU personnel.
                </div>
              </footer>
            </main>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
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
    items: PostImpactActionItem[],
    helpContent?: HelpContentDefinition
  ) => (
    <section>
      <div className="flex items-center gap-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {language === "en" ? titleEn : titleFil}
        </h3>
        {helpContent ? (
          <HelpTooltip content={helpContent} align="left" />
        ) : null}
      </div>

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
                    {language === "en" ? "Action Rule Reference" : "Reference ng Action Rule"}
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
                      ? "LGU Confirmation Required"
                      : "Kailangan ang LGU Confirmation"}
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
              ? "No verified, source-based actions are available yet."
              : "Wala pang verified at source-based na actions na available."}
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
            ? "Reported and validated information are kept separate. AGAP does not automatically allocate relief or replace authorized LGU decisions."
            : "Hiwalay ang reported at validated information. Hindi awtomatikong nag-aallocate ng relief o pumapalit sa authorized LGU decisions ang AGAP."}
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
                ? "Social Impact — Affected Population & Households"
                : "Social Impact — Apektadong Populasyon at mga Sambahayan"}
            </h2>
            <HelpTooltip
              content={getHelpContent("socialImpactAffectedPopulation", language)}
              align="left"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label={
                language === "en"
                  ? "Reported Affected Persons"
                  : "Reported Affected Persons"
              }
              value={observedImpacts?.reportedAffectedPersons}
              helpContent={getHelpContent("reportedAffectedPersons", language)}
            />
            <MetricCard
              label={
                language === "en"
                  ? "Validated Affected Persons"
                  : "Validated Affected Persons"
              }
              value={observedImpacts?.validatedAffectedPersons}
              emphasis
              helpContent={getHelpContent("validatedAffectedPersons", language)}
              helpAlign="center"
            />
            <MetricCard
              label={
                language === "en"
                  ? "Affected Persons Pending Validation"
                  : "Affected Persons Pending Validation"
              }
              value={observedImpacts?.awaitingValidationPersons}
              helpContent={getHelpContent("affectedPersonsPendingValidation", language)}
              helpAlign="right"
            />
            <MetricCard
              label={
                language === "en"
                  ? "Reported Affected Households"
                  : "Reported Affected Households"
              }
              value={observedImpacts?.reportedAffectedHouseholds}
              helpContent={getHelpContent("reportedAffectedHouseholds", language)}
            />
            <MetricCard
              label={
                language === "en"
                  ? "Validated Affected Households"
                  : "Validated Affected Households"
              }
              value={observedImpacts?.validatedAffectedHouseholds}
              emphasis
              helpContent={getHelpContent("validatedAffectedHouseholds", language)}
              helpAlign="center"
            />
            <MetricCard
              label={
                language === "en"
                  ? "Reported Vulnerable Groups"
                  : "Reported Vulnerable Groups"
              }
              value={observedImpacts?.vulnerableGroupsReported}
              helpContent={getHelpContent("reportedVulnerableGroups", language)}
              helpAlign="right"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span>
              {language === "en" ? "Last validation update:" : "Huling validation update:"}{" "}
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
                ? "Damage, Status of Lifelines & Priority Needs"
                : "Damage, Status of Lifelines & Priority Needs"}
            </h2>
            <HelpTooltip
              content={getHelpContent("damageLifelinesPriorityNeeds", language)}
              align="left"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricCard
              label={language === "en" ? "Reported Damage" : "Naiulat na Pinsala"}
              value={observedImpacts?.damageSummary}
              helpContent={getHelpContent("reportedDamage", language)}
            />
            <MetricCard
              label={
                language === "en"
                  ? "Status of Critical Facilities"
                  : "Kalagayan ng Critical Facilities"
              }
              value={observedImpacts?.criticalFacilityCondition}
              helpContent={getHelpContent("criticalFacilities", language)}
              helpAlign="right"
            />
            <MetricCard
              label={
                language === "en"
                  ? "Lifeline Service Disruptions"
                  : "Lifeline Service Disruptions"
              }
              value={observedImpacts?.serviceDisruption}
              helpContent={getHelpContent("lifelineServiceDisruptions", language)}
            />
            <MetricCard
              label={
                language === "en"
                  ? "Access Conditions"
                  : "Access Conditions"
              }
              value={observedImpacts?.accessibilityConstraints}
              helpContent={getHelpContent("accessConditions", language)}
              helpAlign="right"
            />
            <div className="sm:col-span-2">
              <MetricCard
                label={
                  language === "en"
                    ? "Priority Needs"
                    : "Pangunahing Pangangailangan"
                }
                value={observedImpacts?.urgentUnmetNeeds}
                emphasis
                helpContent={getHelpContent("priorityNeeds", language)}
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
                ? "Pre-Disaster Exposure vs Validated Post-Disaster Impact"
                : "Pre-Disaster Exposure vs Validated Post-Disaster Impact"}
            </h2>
            <HelpTooltip
              content={getHelpContent("prePostImpactComparison", language)}
              align="left"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === "en"
                    ? "Pre-Disaster Exposure Estimate"
                    : "Tantyang Exposure Bago ang Sakuna"}
                </span>
                <HelpTooltip
                  content={getHelpContent("preDisasterExposureEstimate", language)}
                  align="left"
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {display(
                  preEventComparison?.estimatedPotentiallyExposedPopulation
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {language === "en" ? "Estimation Method:" : "Paraan ng Pagtatantiya:"}{" "}
                {display(preEventComparison?.estimateMethod)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  {language === "en" ? "Confidence Level:" : "Confidence Level:"}
                  <HelpTooltip
                    content={getHelpContent("confidenceLevel", language)}
                    align="left"
                  />
                </span>{" "}
                {display(preEventComparison?.estimateConfidence)}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  {language === "en"
                    ? "Validated Post-Disaster Impact"
                    : "Beripikadong Epekto Pagkatapos ng Sakuna"}
                </span>
                <HelpTooltip
                  content={getHelpContent("validatedPostDisasterImpact", language)}
                  align="right"
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {display(observedImpacts?.validatedAffectedPersons)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {language === "en"
                  ? "Shown only when post-disaster reports have been checked and confirmed by authorized personnel. This value is kept separate from the pre-disaster estimate."
                  : "Ipinapakita lamang ito kapag nasuri at nakumpirma na ng awtorisadong personnel ang post-disaster reports. Hiwalay ang value na ito sa pre-disaster estimate."}
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
                ? "Information Pending Validation"
                : "Impormasyong Hinihintay ang Validation"}
            </h2>
            <HelpTooltip
              content={getHelpContent("informationPendingValidation", language)}
              align="left"
            />
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
                  ? "No pending-validation information is available in this card yet."
                  : "Wala pang pending-validation information na available sa card na ito."}
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
                ? "LGU Actions and Next Steps"
                : "Mga Aksyon at Susunod na Hakbang ng LGU"}
            </h2>
          </div>

          <div className="space-y-6">
            {renderActionGroup(
              "Immediate Response Actions",
              "Agarang Response Actions",
              immediateActions
            )}
            {renderActionGroup(
              "Stabilization and Early Recovery Actions",
              "Stabilization at Early Recovery Actions",
              stabilizationActions,
              getHelpContent("stabilizationAndEarlyRecovery", language)
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
            {language === "en" ? "Validate Reported Impacts" : "I-validate ang Naiulat na Epekto"}
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
