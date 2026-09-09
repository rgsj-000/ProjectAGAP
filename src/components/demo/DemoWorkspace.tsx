"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useNavigation } from "@/context/NavigationContext";
import {
  DEMO_ADVISORY,
  DEMO_POST_IMPACT,
  DEMO_PRIORITIES,
  DEMO_REPORTS,
  DEMO_TIMESTAMP,
  DEMO_VALID_UNTIL,
  getDemoLguCard,
  type DemoReport,
} from "@/lib/demo-data";
import { ConnectivityStatus } from "@/components/feedback/ConnectivityStatus";
import { LGUActionCard } from "@/components/assessment/LGUActionCard";
import {
  PostImpactActionCard,
  type PostImpactActionStatus,
} from "@/components/recovery/PostImpactActionCard";

type ReportFilter = "ALL" | DemoReport["status"];

const riskStyles = {
  HIGH: "border-red-200 bg-red-50 text-red-800",
  MODERATE: "border-amber-200 bg-amber-50 text-amber-800",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const reportStyles = {
  UNVERIFIED: "border-slate-300 bg-slate-100 text-slate-700",
  REVIEWED: "border-amber-200 bg-amber-50 text-amber-800",
  VALIDATED: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${className}`}>
      {children}
    </span>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-black tabular-nums text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </article>
  );
}

export function DemoWorkspace() {
  const { currentModule, setCurrentModule } = useNavigation();
  const [selectedId, setSelectedId] = useState(DEMO_PRIORITIES[0].id);
  const [reports, setReports] = useState(DEMO_REPORTS);
  const [filter, setFilter] = useState<ReportFilter>("ALL");
  const [notice, setNotice] = useState("");
  const [postStatuses, setPostStatuses] = useState<Record<string, PostImpactActionStatus>>({});
  const overrideDialogRef = useRef<HTMLDialogElement>(null);
  const [overrideReason, setOverrideReason] = useState("");

  const selected = DEMO_PRIORITIES.find((item) => item.id === selectedId) ?? DEMO_PRIORITIES[0];
  const totalExposure = DEMO_PRIORITIES.reduce((sum, item) => sum + item.exposure, 0);
  const gaps = DEMO_PRIORITIES.filter((item) => item.gap > 0).length;
  const awaiting = reports.filter((report) => report.status !== "VALIDATED").length;
  const filteredReports = filter === "ALL" ? reports : reports.filter((report) => report.status === filter);
  const postActions = DEMO_POST_IMPACT.actions?.map((item) => ({
    ...item,
    status: postStatuses[item.id] ?? item.status,
  }));

  const openBarangay = (id: string) => {
    setSelectedId(id);
    setCurrentModule("prepare");
    setNotice("");
  };

  const resetDemo = () => {
    setSelectedId(DEMO_PRIORITIES[0].id);
    setReports(DEMO_REPORTS);
    setFilter("ALL");
    setPostStatuses({});
    setNotice("Demo scenario reset to its prepared starting state.");
    setCurrentModule("home");
  };

  const recordAction = (message: string) => setNotice(`${message} Demo state updated locally; no official record was created.`);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase text-blue-700">Lucena City · LGU operations</p>
            <Badge className="border-blue-200 bg-blue-50 text-blue-800">Demo mode</Badge>
          </div>
          <h1 className="mt-2 text-balance text-3xl font-black text-slate-950">
            {currentModule === "home"
              ? "Decision overview"
              : currentModule === "prepare"
                ? `${selected.barangay} action card`
                : currentModule === "report-damage"
                  ? "Damage & needs validation"
                  : "Post-impact action card"}
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm text-slate-600">
            Synthetic, repeatable data for demonstrating source verification, deterministic prioritization, and accountable LGU decisions.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/household" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800">
            <Users className="size-4" aria-hidden="true" /> Household preparedness
          </Link>
          <button
            type="button"
            onClick={resetDemo}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Reset demo
          </button>
        </div>
      </header>

      <ConnectivityStatus
        status="ONLINE"
        lastSyncAt={DEMO_TIMESTAMP}
        advisoryValidity={DEMO_VALID_UNTIL}
        pendingSyncCount={0}
      />

      {notice ? (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      ) : null}

      {currentModule === "home" ? (
        <>
          <section className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm" aria-labelledby="verified-advisory-heading">
            <div className="flex flex-col gap-4 border-b border-blue-100 bg-blue-50/70 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-700" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold uppercase text-blue-700">Current verified advisory</p>
                  <h2 id="verified-advisory-heading" className="mt-1 text-balance text-lg font-bold text-slate-950">
                    {DEMO_ADVISORY.reference}
                  </h2>
                </div>
              </div>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Verified</Badge>
            </div>
            <div className="grid gap-x-8 gap-y-4 p-5 text-sm md:grid-cols-[1.4fr_1fr]">
              <p className="text-pretty leading-6 text-slate-700">{DEMO_ADVISORY.summary}</p>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div><dt className="font-semibold text-slate-500">Source agency</dt><dd className="mt-1 font-bold text-slate-900">{DEMO_ADVISORY.sourceAgency}</dd></div>
                <div><dt className="font-semibold text-slate-500">Issue time</dt><dd className="mt-1 font-bold text-slate-900">{DEMO_ADVISORY.issuedAt}</dd></div>
                <div><dt className="font-semibold text-slate-500">Hazard</dt><dd className="mt-1 font-bold text-slate-900">{DEMO_ADVISORY.hazard}</dd></div>
                <div><dt className="font-semibold text-slate-500">Affected area</dt><dd className="mt-1 font-bold text-slate-900">{DEMO_ADVISORY.affectedArea}</dd></div>
              </dl>
            </div>
            <p className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-xs font-medium text-amber-900">
              Synthetic demonstration advisory. It is not an official PAGASA bulletin and must not be used for real-world decisions.
            </p>
          </section>

          <section aria-label="Operational summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Priority barangays" value="4" note="High or moderate deterministic risk" />
            <Metric label="Potentially exposed population" value={totalExposure.toLocaleString("en-PH")} note="Estimate across the demo barangays" />
            <Metric label="Possible capacity gaps" value={String(gaps)} note="Barangays requiring capacity review" />
            <Metric label="Awaiting validation" value={String(awaiting)} note="Sample field reports not yet validated" />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="attention-heading">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 id="attention-heading" className="text-lg font-bold text-slate-950">Barangays requiring attention</h2>
              <p className="mt-1 text-xs text-slate-500">Ranked by the adopted deterministic risk matrix, then potential exposure and capacity gap.</p>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    {['Priority', 'Barangay', 'Risk', 'Potential exposure', 'Capacity', 'Verification', 'Action'].map((label) => (
                      <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DEMO_PRIORITIES.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4 font-bold tabular-nums text-slate-500">{item.priority}</td>
                      <td className="px-4 py-4 font-bold text-slate-950">{item.barangay}</td>
                      <td className="px-4 py-4"><Badge className={riskStyles[item.risk]}>{item.risk}</Badge></td>
                      <td className="px-4 py-4 tabular-nums">{item.exposure.toLocaleString("en-PH")} estimated</td>
                      <td className="px-4 py-4 tabular-nums">{item.gap > 0 ? `${item.gap.toLocaleString("en-PH")} gap` : "No modeled gap"}</td>
                      <td className="px-4 py-4"><Badge className={item.verification === "VERIFIED" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}>{item.verification.replace("_", " ")}</Badge></td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => openBarangay(item.id)} className="inline-flex min-h-11 items-center gap-1 font-semibold text-blue-700 hover:underline">
                          Open card <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {DEMO_PRIORITIES.map((item) => (
                <article key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold text-slate-500">Priority {item.priority}</p><h3 className="mt-1 font-bold text-slate-950">{item.barangay}</h3></div>
                    <Badge className={riskStyles[item.risk]}>{item.risk}</Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div><dt className="text-slate-500">Potential exposure</dt><dd className="mt-1 font-bold tabular-nums">{item.exposure.toLocaleString("en-PH")} estimated</dd></div>
                    <div><dt className="text-slate-500">Capacity</dt><dd className="mt-1 font-bold tabular-nums">{item.gap > 0 ? `${item.gap.toLocaleString("en-PH")} gap` : "No modeled gap"}</dd></div>
                  </dl>
                  <button type="button" onClick={() => openBarangay(item.id)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800">
                    Open LGU Action Card <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {currentModule === "prepare" ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Review barangay
              <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:w-72">
                {DEMO_PRIORITIES.map((item) => <option key={item.id} value={item.id}>{item.priority}. {item.barangay} · {item.risk}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => setCurrentModule("home")} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to priorities</button>
          </div>
          <LGUActionCard
            {...getDemoLguCard(selected)}
            onValidate={() => recordAction("Assessment validated.")}
            onAssignAction={() => recordAction("Priority action assigned.")}
            onRequestUpdate={() => recordAction("Field update requested.")}
            onGenerateBrief={() => recordAction("Source-anchored preparedness brief generated.")}
            onRecordDecision={() => recordAction("Decision recorded with the demo audit trail.")}
            onModify={() => recordAction("Assessment marked for authorized modification.")}
            onDefer={() => recordAction("Decision deferred for review.")}
            onOverride={() => overrideDialogRef.current?.showModal()}
          />
        </div>
      ) : null}

      {currentModule === "report-damage" ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="reports-heading">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2"><FileWarning className="size-5 text-amber-600" aria-hidden="true" /><h2 id="reports-heading" className="text-lg font-bold text-slate-950">Sample damage and needs reports</h2></div>
              <p className="mt-1 text-xs text-slate-500">Reported figures stay separate from confirmed facts until authorized validation.</p>
            </div>
            <label className="text-xs font-semibold text-slate-600">Verification status
              <select value={filter} onChange={(event) => setFilter(event.target.value as ReportFilter)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:w-52">
                {(["ALL", "UNVERIFIED", "REVIEWED", "VALIDATED"] as ReportFilter[]).map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
            <Metric label="Reported affected population" value={reports.reduce((sum, item) => sum + item.reportedPersons, 0).toLocaleString("en-PH")} note="All sample reports" />
            <Metric label="Validated affected population" value={reports.reduce((sum, item) => sum + item.validatedPersons, 0).toLocaleString("en-PH")} note="Confirmed sample figures only" />
            <Metric label="Population awaiting validation" value={reports.reduce((sum, item) => sum + Math.max(0, item.reportedPersons - item.validatedPersons), 0).toLocaleString("en-PH")} note="Not confirmed" />
          </div>
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report) => (
              <article key={report.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="text-xs font-semibold text-slate-500">{report.id} · Barangay {report.barangay}</p><h3 className="mt-1 font-bold text-slate-950">{report.type}</h3><p className="mt-2 max-w-3xl text-sm text-slate-600">{report.summary}</p></div>
                  <Badge className={reportStyles[report.status]}>{report.status}</Badge>
                </div>
                <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                  <div><dt className="text-slate-500">Reported affected</dt><dd className="mt-1 font-bold tabular-nums">{report.reportedPersons} persons</dd></div>
                  <div><dt className="text-slate-500">Validated affected</dt><dd className="mt-1 font-bold tabular-nums">{report.validatedPersons || "Pending"}</dd></div>
                  <div><dt className="text-slate-500">Reported needs</dt><dd className="mt-1 font-bold">{report.needs.join(", ")}</dd></div>
                </dl>
                {report.status !== "VALIDATED" ? (
                  <button type="button" onClick={() => { setReports((current) => current.map((item) => item.id === report.id ? { ...item, status: "VALIDATED", validatedPersons: item.reportedPersons } : item)); recordAction(`${report.id} validated with its sample evidence.`); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800">
                    <ClipboardCheck className="size-4" aria-hidden="true" /> Validate sample report
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {currentModule === "recovery" ? (
        <PostImpactActionCard
          {...DEMO_POST_IMPACT}
          actions={postActions}
          onValidateImpacts={() => recordAction("Reported impacts sent for final validation.")}
          onAssignAction={(id) => { setPostStatuses((current) => ({ ...current, [id]: "ASSIGNED" })); recordAction(`${id} assigned.`); }}
          onUpdateActionStatus={(id, status) => { setPostStatuses((current) => ({ ...current, [id]: status })); recordAction(`${id} marked ${status.replaceAll("_", " ").toLowerCase()}.`); }}
          onRequestUpdate={() => recordAction("Post-impact field update requested.")}
          onRecordDecision={() => recordAction("Post-impact decision recorded.")}
        />
      ) : null}

      <dialog ref={overrideDialogRef} aria-labelledby="override-title" className="w-[calc(100%-2rem)] max-w-lg rounded-xl border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40">
        <form method="dialog" className="p-5" onSubmit={(event) => { if (!overrideReason.trim()) { event.preventDefault(); return; } recordAction(`Override recorded with reason: ${overrideReason.trim()}`); setOverrideReason(""); }}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-red-700">Consequential action</p><h2 id="override-title" className="mt-1 text-xl font-black text-slate-950">Record an override reason</h2></div><button type="button" aria-label="Close override dialog" onClick={() => overrideDialogRef.current?.close()} className="flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="size-5" aria-hidden="true" /></button></div>
          <p className="mt-3 text-sm text-slate-600">An override changes the normal rule-guided action path. The reason becomes part of the decision record.</p>
          <label className="mt-4 block text-sm font-semibold text-slate-700">Reason for override<textarea required minLength={10} value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-describedby="override-help" /></label>
          <p id="override-help" className="mt-1 text-xs text-slate-500">Enter at least 10 characters describing the evidence and authorized decision.</p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => overrideDialogRef.current?.close()} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Cancel</button><button type="submit" className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800">Record override</button></div>
        </form>
      </dialog>
    </div>
  );
}
