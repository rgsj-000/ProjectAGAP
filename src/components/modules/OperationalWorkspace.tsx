"use client";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useNavigation } from "@/context/NavigationContext";
import { api, deleteAdvisory, saveAdvisory, updateAdvisory } from "@/lib/client/api";
import { createSupabaseBrowserClient as createBrowserClient } from "@/lib/client/supabase";
import {
  cacheOfflinePack,
  readOfflinePack,
  queueFieldReport,
  pendingReports,
  syncPendingReports,
  clearResolvedLocalConflict,
  type PendingFieldReport,
} from "@/lib/client/offlineQueue";
import { AdvisoryForm } from "@/components/advisory/AdvisoryForm";
import { LGUActionCard } from "@/components/assessment/LGUActionCard";
import { PostImpactActionCard } from "@/components/recovery/PostImpactActionCard";
import { ConnectedHouseholdCard } from "@/components/household/ConnectedHouseholdCard";
import { ConnectivityStatus } from "@/components/feedback/ConnectivityStatus";
import { OfflineOperationsPack } from "./OfflineOperationsPack";

type Row = Record<string, any>;
type Workspace = {
  userId: string;
  role: string;
  synchronizedAt: string;
} & Record<string, any>;
type ReviewDialog =
  | { kind: "verify"; report: Row }
  | { kind: "conflict"; conflict: Row };
const inputClass =
  "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = true,
  min,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  min?: number;
  step?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className={inputClass}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={min}
        step={step}
      />
    </label>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
function Button({
  children,
  onClick,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
const post = <T,>(url: string, body: unknown) =>
  api<T>(url, { method: "POST", body: JSON.stringify(body) });
const str = (v: unknown) =>
  v === null || v === undefined
    ? null
    : typeof v === "object"
      ? JSON.stringify(v)
      : String(v);

export function OperationalWorkspace() {
  const {
    currentModule,
    prepareSubView,
    setCurrentModule,
    isFieldResponderUser,
  } = useNavigation();
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [barangayId, setBarangayId] = useState("");
  const [advisoryId, setAdvisoryId] = useState("");
  const [hazardId, setHazardId] = useState("");
  const [card, setCard] = useState<Row | null>(null);
  const [postImpact, setPostImpact] = useState<Row | null>(null);
  const [reports, setReports] = useState<Row[]>([]);
  const [actions, setActions] = useState<Row[]>([]);
  const [queue, setQueue] = useState<PendingFieldReport[]>([]);
  const [conflicts, setConflicts] = useState<Row[]>([]);
  const [auditRows, setAuditRows] = useState<Row[]>([]);
  const [offline, setOffline] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);
  const reviewer = data?.role === "admin" || data?.role === "lgu_reviewer";
  const barangay = data?.barangays.find((b: Row) => b.id === barangayId);
  const advisory = data?.advisories.find((a: Row) => a.id === advisoryId);
  const editingAdvisory = data?.advisories.find((a: Row) => a.id === editingAdvisoryId);
  const advisoryInitialValues = editingAdvisory
    ? {
        title: editingAdvisory.advisory_type,
        source: editingAdvisory.source_agency,
        issuedTime: editingAdvisory.issue_time,
        bulletinNumber: editingAdvisory.bulletin_reference,
        validity: editingAdvisory.validity_end,
        coverageLevel:
          editingAdvisory.raw_content?.sourceCoverage?.level ?? "SPECIFIC_AREA",
        affectedLocations:
          editingAdvisory.raw_content?.sourceCoverage?.areas?.join(", ") ??
          editingAdvisory.affected_areas?.join(", ") ??
          "",
        warningInformation: editingAdvisory.warning_information,
        sourceUrl: editingAdvisory.source_link,
        message: editingAdvisory.raw_content?.sourceMessage ?? "",
        precautions: editingAdvisory.raw_content?.sourcePrecautions ?? [""],
      }
    : undefined;
  const pendingAdvisories =
    data?.advisories.filter((a: Row) =>
      ["FOR_REVIEW", "UNVERIFIED"].includes(a.verification_status),
    ) ?? [];
  const reviewAdvisory =
    data?.advisories.find((a: Row) => a.id === reviewAdvisoryId) ??
    pendingAdvisories[0] ??
    null;
  const rowTime = (value: unknown) => {
    const parsed = Date.parse(String(value ?? ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  const asList = (value: unknown) =>
    Array.isArray(value)
      ? value.map((item) => String(item)).filter(Boolean)
      : value
        ? [String(value)]
        : [];
  const formatCount = (value: unknown) => {
    const number = Number(value);
    return Number.isFinite(number)
      ? new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(number)
      : "Not recorded";
  };
  const formatRecordDate = (value: unknown) => {
    if (!value) return "Not recorded";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(date);
  };
  const selectedRisk = data
    ? [...(data.risk_assessments ?? [])]
        .filter(
          (risk: Row) =>
            risk.barangay_id === barangayId &&
            risk.advisory_id === advisoryId,
        )
        .sort(
          (a: Row, b: Row) =>
            rowTime(b.assessment_date ?? b.data_date) -
            rowTime(a.assessment_date ?? a.data_date),
        )[0]
    : undefined;
  const selectedHazardId = selectedRisk?.hazard_id || hazardId;
  const hazard = data?.hazards.find((h: Row) => h.id === selectedHazardId);
  const methodology = data?.methodologies.find(
    (m: Row) => m.id === selectedRisk?.methodology_id,
  );
  const selectedExposure = data
    ? [...(data.population_exposure_estimates ?? [])]
        .filter(
          (exposure: Row) =>
            exposure.barangay_id === barangayId &&
            exposure.hazard_id === selectedHazardId,
        )
        .sort(
          (a: Row, b: Row) =>
            rowTime(b.generated_at ?? b.reference_date) -
            rowTime(a.generated_at ?? a.reference_date),
        )[0]
    : undefined;
  const capacityRecords =
    data?.preparedness_capacities.filter(
      (capacity: Row) => capacity.barangay_id === barangayId,
    ) ?? [];
  const latestCapacity = [...capacityRecords]
    .filter((capacity: Row) => Boolean(capacity.validation_date))
    .sort(
      (a: Row, b: Row) =>
        rowTime(b.validation_date) - rowTime(a.validation_date),
    )[0];
  const hasValidatedCapacity = Boolean(latestCapacity?.validation_date);
  const recordedCapacity = latestCapacity
    ? Number(latestCapacity.evacuation_capacity ?? 0) +
      Number(latestCapacity.temporary_shelter_capacity ?? 0)
    : null;
  const estimatedExposure = selectedExposure
    ? Number(selectedExposure.estimated_exposed_population)
    : null;
  const capacityGap =
    estimatedExposure !== null &&
    Number.isFinite(estimatedExposure) &&
    recordedCapacity !== null &&
    Number.isFinite(recordedCapacity)
      ? estimatedExposure - recordedCapacity
      : null;
  const assessmentReady = Boolean(
    selectedRisk &&
      selectedExposure &&
      selectedHazardId &&
      hasValidatedCapacity,
  );
  const assessmentLimitations = [
    ...asList(selectedRisk?.limitations),
    ...asList(selectedExposure?.limitations),
    ...asList(latestCapacity?.limitations),
  ];
  const riskTone: Record<string, string> = {
    VERY_HIGH: "border-red-200 bg-red-50 text-red-800",
    HIGH: "border-orange-200 bg-orange-50 text-orange-800",
    MODERATE: "border-amber-200 bg-amber-50 text-amber-800",
    LOW: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const stale = Boolean(
    advisory &&
    (!advisory.validity_end ||
      Date.parse(advisory.validity_end) <= now ||
      Date.parse(advisory.validity_start) > now),
  );
  const load = useCallback(async () => {
    const next = await api<Workspace>("/api/operations");
    setData(next);
    await cacheOfflinePack(`operations:${next.userId}`, next);
    setBarangayId((old) => old || next.barangays[0]?.id || "");
    setAdvisoryId(
      (old) =>
        old ||
        [...next.advisories].sort(
          (a, b) => Date.parse(b.issue_time) - Date.parse(a.issue_time),
        )[0]?.id ||
        "",
    );
    setHazardId((old) => old || next.hazards[0]?.id || "");
  }, []);
  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (e) {
        try {
          const { data: session } =
            await createBrowserClient().auth.getSession();
          const owner = session.session?.user.id;
          const saved = owner
            ? await readOfflinePack<Workspace>(`operations:${owner}`)
            : undefined;
          if (saved && !navigator.onLine) {
            setData(saved.data);
            setBarangayId(saved.data.barangays[0]?.id ?? "");
            setAdvisoryId(saved.data.advisories[0]?.id ?? "");
            setHazardId(saved.data.hazards[0]?.id ?? "");
            return;
          }
        } catch {}
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [load]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!data?.userId) return;
    const owner = data.userId;
    const refresh = () => {
      void pendingReports(owner).then(setQueue);
    };
    const reconnect = () => {
      void syncPendingReports(owner)
        .then(load)
        .catch((e) => setError(String(e)));
    };
    refresh();
    window.addEventListener("agap-sync", refresh);
    window.addEventListener("online", reconnect);
    return () => {
      window.removeEventListener("agap-sync", refresh);
      window.removeEventListener("online", reconnect);
    };
  }, [data?.userId, load]);
  useEffect(() => {
    setCard(null);
    setPostImpact(null);
    setActions([]);
    setReports([]);
    if (!data?.userId || !barangayId) return;
    let current = true;
    void readOfflinePack<Row>(
      `lgu:${data.userId}:${barangayId}:${advisoryId}:${hazardId}`,
    ).then((saved) => {
      if (
        current &&
        saved &&
        saved.data.situation.currentVerifiedAdvisory.id === advisoryId
      )
        setCard(saved.data);
    });
    return () => {
      current = false;
    };
  }, [barangayId, advisoryId, hazardId, data?.userId]);
  async function run(
    action: () => Promise<void>,
    success = "Saved successfully.",
    working = "Working…",
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    setWorkingLabel(working);
    try {
      await action();
      setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function loadReports() {
    setReports(
      await api<Row[]>(`/api/damage-reports?barangayId=${barangayId}`),
    );
  }
  async function loadActions(outputId: string) {
    setActions(await api<Row[]>(`/api/actions?outputId=${outputId}`));
  }
  async function generateAssessment() {
    if (!barangayId || !advisoryId || !selectedHazardId) {
      throw new Error("Select a barangay, verified advisory, and hazard first.");
    }
    await post<Row>("/api/risk-assessments/from-stored-data", {
      barangayId,
      advisoryId,
      hazardId: selectedHazardId,
    });
    await load();
  }

  async function generateCard() {
    const result = await post<Row>("/api/action-cards/lgu", {
      barangayId,
      hazardId: selectedHazardId,
      advisoryId,
    });
    if (!result?.situation || !result.outputId) {
      throw new Error("The LGU action-card response was incomplete. Please try again.");
    }
    setCard(result);
    await cacheOfflinePack(
      `lgu:${data!.userId}:${barangayId}:${advisoryId}:${selectedHazardId}`,
      result,
    );
    await loadActions(result.outputId);
  }
  async function submitReviewDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = reviewReason.trim();
    if (reason.length < 10) {
      setError("Enter at least 10 characters explaining the evidence or resolution.");
      return;
    }
    const dialog = reviewDialog;
    if (!dialog) return;
    await run(async () => {
      if (dialog.kind === "verify") {
        await post(`/api/damage-reports/${dialog.report.id}/verify`, { reason });
        await loadReports();
      } else {
        await post(`/api/conflicts/${dialog.conflict.id}/resolve`, {
          resolution: "KEEP_SERVER",
          reason,
        });
        await clearResolvedLocalConflict(dialog.conflict.client_id);
        setConflicts((old) => old.filter((item) => item.id !== dialog.conflict.id));
      }
    }, dialog.kind === "verify" ? "Report and linked needs verified; audit recorded." : "Conflict resolved; server record retained.");
    setReviewDialog(null);
    setReviewReason("");
  }
  useEffect(() => {
    if (!data || !barangayId) return;
    const name = data.barangays.find(
      (b: Row) => b.id === barangayId,
    )?.barangay_name;
    setAdvisoryId((old) =>
      data.advisories.some(
        (a: Row) => a.id === old && a.affected_areas.includes(name),
      )
        ? old
        : (data.advisories
            .filter((a: Row) => a.affected_areas.includes(name))
            .sort(
              (a: Row, b: Row) =>
                Date.parse(b.issue_time) - Date.parse(a.issue_time),
            )[0]?.id ?? ""),
    );
  }, [barangayId, data]);
  useEffect(() => {
    const assessedHazardId = selectedRisk?.hazard_id;
    if (assessedHazardId && assessedHazardId !== hazardId) {
      setHazardId(assessedHazardId);
    }
  }, [selectedRisk?.hazard_id, hazardId]);
  const submit = (
    e: FormEvent<HTMLFormElement>,
    fn: (form: FormData) => Promise<void>,
    working = "Working…",
  ) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void run(() => fn(form), "Saved successfully.", working);
  };
  const contextSelector = (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">
        Barangay
        <select
          className={inputClass}
          value={barangayId}
          onChange={(e) => setBarangayId(e.target.value)}
        >
          {data?.barangays.map((b: Row) => (
            <option key={b.id} value={b.id}>
              {b.barangay_name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Event / advisory
        <select
          className={inputClass}
          value={advisoryId}
          onChange={(e) => setAdvisoryId(e.target.value)}
        >
          <option value="">Select advisory</option>
          {data?.advisories
            .filter((a: Row) =>
              a.affected_areas.includes(barangay?.barangay_name),
            )
            .map((a: Row) => (
              <option key={a.id} value={a.id}>
                {a.bulletin_reference} — {a.verification_status}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
  if (!data)
    return (
      <Section title="LGU operations">
        <p role="status">{error || "Loading your authorized workspace…"}</p>
        <div className="flex gap-3">
          <Link href="/login" className="font-semibold text-blue-700 underline">
            Sign in to LGU account
          </Link>
          <Link
            href="/household"
            className="font-semibold text-blue-700 underline"
          >
            Public household preparedness
          </Link>
        </div>
        <Button onClick={() => void run(load, "Workspace loaded.")}>
          Retry connection
        </Button>
      </Section>
    );
  const view = currentModule;
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Lucena City · {data.role.replaceAll("_", " ")}
        </p>
        <h1 className="mt-2 text-3xl font-black">
          {view === "home"
            ? "Operations overview"
            : view === "prepare"
              ? "Preparedness assessment"
              : view === "report-damage"
                ? "Damage & needs report"
                : "Post-impact review"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Verified sources, explainable assessments, and actions reviewed by
          your LGU.
        </p>
      </header>
      <ConnectivityStatus
        status={
          queue.some((q) => q.status === "ACTION_REQUIRED")
            ? "ACTION_REQUIRED"
            : queue.some((q) => q.status === "SYNCING")
              ? "SYNCING"
              : stale
                ? "STALE"
                : offline
                  ? "OFFLINE"
                  : "ONLINE"
        }
        lastSyncAt={data.synchronizedAt}
        advisoryValidity={advisory?.validity_end}
        pendingSyncCount={queue.length}
      />
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {(message || busy) && (
        <p
          role="status"
          className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900"
        >
          {busy ? workingLabel : message}
        </p>
      )}
      {contextSelector}
      {view === "home" && isFieldResponderUser && (
        <Section title="Primary field task">
          <p className="text-sm text-slate-600">
            Record observed damage, affected people, service disruptions, access
            conditions, priority needs, and supporting evidence. Reports remain
            unverified until authorized LGU review.
          </p>
          <Button onClick={() => setCurrentModule("report-damage")}>
            Open damage & needs report
          </Button>
        </Section>
      )}
      {advisory?.is_demo && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Synthetic demonstration advisory. Not official disaster information.
        </p>
      )}
      {view === "home" && (
        <>
          {!reviewer && pendingAdvisories.length > 0 && (
            <Section title="Advisories awaiting verification">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-950">
                  {pendingAdvisories.length} advisory record(s) are waiting for an Admin or LGU Reviewer.
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  Encoders can upload and correct advisory information, but they cannot mark an advisory as VERIFIED.
                  This separation keeps source verification independent from data entry.
                </p>
              </div>
            </Section>
          )}

          {reviewer && (
            <Section title="Pending advisory verification">
              <p className="text-sm text-slate-600">
                Verify each official advisory once. Confirm the uploaded source,
                extracted fields, source geographic coverage, and the resolved
                Lucena City barangay applicability before approval.
              </p>

              {pendingAdvisories.length === 0 ? (
                <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                  No advisories are waiting for verification.
                </p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                  <div className="space-y-2">
                    {pendingAdvisories.map((item: Row) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setReviewAdvisoryId(item.id);
                          setReviewEvidenceUrl("");
                          setReviewReason("");
                        }}
                        className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                          reviewAdvisory?.id === item.id
                            ? "border-blue-400 bg-blue-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <span className="block font-bold text-slate-900">
                          {item.bulletin_reference}
                        </span>
                        <span className="mt-1 block text-xs text-slate-600">
                          {item.source_agency} · {item.verification_status}
                        </span>
                      </button>
                    ))}
                  </div>

                  {reviewAdvisory && (
                    <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                          Source record
                        </p>
                        <h3 className="mt-1 font-bold text-slate-900">
                          {reviewAdvisory.advisory_type} ·{" "}
                          {reviewAdvisory.bulletin_reference}
                        </h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-bold text-slate-700">
                            Source geographic coverage
                          </p>
                          <p className="mt-1 text-sm">
                            {reviewAdvisory.raw_content?.sourceCoverage?.level ??
                              "Not recorded"}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {(reviewAdvisory.raw_content?.sourceCoverage?.areas ?? []).join(
                              ", ",
                            ) || "No source areas recorded"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-bold text-slate-700">
                            Resolved AGAP applicability
                          </p>
                          <p className="mt-1 text-sm">
                            {reviewAdvisory.affected_areas?.length
                              ? `${reviewAdvisory.affected_areas.length} Lucena City barangay(s)`
                              : "No Lucena City barangays matched"}
                          </p>
                          <p className="mt-1 max-h-24 overflow-auto text-xs text-slate-600">
                            {reviewAdvisory.affected_areas?.join(", ") ||
                              "This official advisory may be outside the current LGU jurisdiction."}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-bold text-slate-700">
                          Extracted warning information
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {reviewAdvisory.warning_information}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={busy || offline}
                          onClick={() =>
                            void run(async () => {
                              const result = await api<{ url: string }>(
                                `/api/advisories/${reviewAdvisory.id}/evidence`,
                              );
                              setReviewEvidenceUrl(result.url);
                            }, "Uploaded evidence opened for review.")
                          }
                        >
                          Load uploaded evidence
                        </Button>
                        <a
                          href={reviewAdvisory.source_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          Open official source
                        </a>
                      </div>

                      {reviewEvidenceUrl && (
                        <iframe
                          src={reviewEvidenceUrl}
                          title="Uploaded advisory evidence"
                          className="h-[520px] w-full rounded-xl border border-slate-200 bg-white"
                        />
                      )}

                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-bold text-amber-900">
                          Reviewer confirmation
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Verify only after the uploaded file and official source
                          support the extracted facts and the geographic
                          applicability shown above.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={busy || offline}
                          onClick={() =>
                            void run(async () => {
                              await post(
                                `/api/advisories/${reviewAdvisory.id}/verify`,
                                {},
                              );
                              setReviewEvidenceUrl("");
                              setReviewAdvisoryId("");
                              await load();
                            }, "Advisory verified once for all resolved barangays.")
                          }
                        >
                          Verify advisory
                        </Button>
                      </div>

                      <div className="space-y-2 border-t border-slate-200 pt-3">
                        <label className="block text-sm font-medium text-slate-700">
                          Return for correction
                          <textarea
                            className={`${inputClass} min-h-24`}
                            value={reviewReason}
                            onChange={(e) => setReviewReason(e.target.value)}
                            placeholder="State what must be corrected before verification."
                          />
                        </label>
                        <button
                          type="button"
                          disabled={busy || offline || reviewReason.trim().length < 5}
                          onClick={() =>
                            void run(async () => {
                              await post(
                                `/api/advisories/${reviewAdvisory.id}/return`,
                                { reason: reviewReason.trim() },
                              );
                              setReviewEvidenceUrl("");
                              setReviewAdvisoryId("");
                              setReviewReason("");
                              await load();
                            }, "Advisory returned for correction.")
                          }
                          className="min-h-11 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50"
                        >
                          Return for correction
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>
          )}

          <Section title="Advisory intake & verification">
            {advisory ? (
              <>
                <h3 className="font-bold">
                  {advisory.advisory_type} · {advisory.bulletin_reference}
                </h3>
                <p className="whitespace-pre-wrap text-sm">
                  {advisory.warning_information}
                </p>
                <p className="text-sm">
                  {advisory.verification_status} · Issued {advisory.issue_time}{" "}
                  · Valid until {advisory.validity_end}
                </p>
                <a
                  className="text-blue-700 underline"
                  href={advisory.source_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Original source
                </a>
              </>
            ) : (
              <p>No advisory selected.</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={
                  busy || offline || data.role === "field_reporter" || isFieldResponderUser
                }
                onClick={() => {
                  setEditingAdvisoryId("");
                  setShowAdvisory(!showAdvisory);
                }}
              >
                Create advisory
              </Button>
              {reviewer && (
                <button
                  type="button"
                  onClick={() => {
                    setReviewAdvisoryId(advisoryId);
                    setReviewEvidenceUrl("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="min-h-11 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800"
                >
                  Review & verify selected advisory
                </button>
              )}
              <Button onClick={() => setCurrentModule("prepare")}>
                Open assessment
              </Button>
            </div>
          </Section>

          {(data.role === "admin" || data.role === "lgu_reviewer" || data.role === "lgu_encoder") && (
            <Section title="Advisory records">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Manage source records
                  </p>
                  <p className="text-xs leading-5 text-slate-500">
                    Editing changes a record back to FOR REVIEW. Delete is restricted to unused records and Admin users.
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {data.advisories.length} record{data.advisories.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="hidden grid-cols-[minmax(0,1fr)_120px_150px_190px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:grid">
                  <span>Advisory</span>
                  <span>Status</span>
                  <span>Issued</span>
                  <span className="text-right">Record actions</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {[...data.advisories]
                    .sort((a: Row, b: Row) => rowTime(b.issue_time) - rowTime(a.issue_time))
                    .map((item: Row) => (
                      <div
                        key={item.id}
                        className={`grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_120px_150px_190px] md:items-center ${
                          item.id === advisoryId ? "bg-blue-50/40" : "bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setAdvisoryId(item.id)}
                          className="min-w-0 text-left"
                        >
                          <p className="truncate text-sm font-bold text-slate-900">
                            {item.advisory_type}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {item.bulletin_reference} · {item.source_agency}
                          </p>
                        </button>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              item.verification_status === "VERIFIED"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : item.verification_status === "FOR_REVIEW"
                                  ? "border-amber-200 bg-amber-50 text-amber-800"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {item.verification_status.replaceAll("_", " ")}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">
                          {formatRecordDate(item.issue_time)}
                        </p>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <button
                            type="button"
                            disabled={busy || offline}
                            onClick={() => {
                              setAdvisoryId(item.id);
                              setEditingAdvisoryId(item.id);
                              setShowAdvisory(true);
                            }}
                            className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          {data.role === "admin" && (
                            <button
                              type="button"
                              disabled={busy || offline}
                              onClick={() =>
                                void run(async () => {
                                  const confirmed = window.confirm(
                                    `Delete ${item.bulletin_reference}? Advisories already used by assessments or incident records cannot be deleted.`,
                                  );
                                  if (!confirmed) throw new Error("Deletion cancelled.");
                                  await deleteAdvisory(item.id);
                                  if (advisoryId === item.id) setAdvisoryId("");
                                  if (editingAdvisoryId === item.id) {
                                    setEditingAdvisoryId("");
                                    setShowAdvisory(false);
                                  }
                                  await load();
                                }, "Advisory deleted.")
                              }
                              className="min-h-9 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {showAdvisory && (
                <div className="border-t border-slate-200 pt-5">
                  <AdvisoryForm
                    key={editingAdvisoryId || "create-advisory"}
                    initialValues={advisoryInitialValues}
                    onCancel={() => {
                      setShowAdvisory(false);
                      setEditingAdvisoryId("");
                    }}
                    onSave={async (values, file) => {
                      let evidence: unknown;
                      if (file) {
                        const form = new FormData();
                        form.set("file", file);
                        form.set("kind", "advisory");
                        const response = await fetch("/api/evidence", {
                          method: "POST",
                          body: form,
                        });
                        const result = await response.json();
                        if (!response.ok)
                          throw new Error(result.error?.message ?? "Upload failed");
                        evidence = result.data;
                      }
                      const wasEditing = Boolean(editingAdvisoryId);
                      const saved = editingAdvisoryId
                        ? (await updateAdvisory(editingAdvisoryId, values, evidence) as Row)
                        : (await saveAdvisory(values, evidence) as Row);
                      await load();
                      setShowAdvisory(false);
                      setEditingAdvisoryId("");
                      setAdvisoryId(saved.id);
                      if (reviewer) {
                        setReviewAdvisoryId(saved.id);
                        setReviewEvidenceUrl("");
                        setReviewReason("");
                        setMessage(
                          wasEditing
                            ? "Advisory updated and returned to FOR REVIEW. Review the source again before verification."
                            : "Advisory submitted. Review the uploaded evidence and click Verify advisory to activate it.",
                        );
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        setMessage(
                          "Advisory submitted as FOR REVIEW. An Admin or LGU Reviewer must verify it before it becomes active.",
                        );
                      }
                    }}
                  />
                </div>
              )}
            </Section>
          )}
        </>
      )}
      {view === "prepare" && (
        <>
          {prepareSubView === "action-card" ? (
            <ConnectedHouseholdCard />
          ) : (
            <>
              <Section title="Risk assessment">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                      Automatically loaded from stored assessment records
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">
                      {hazard?.name ?? "No hazard assessment available"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {barangay?.barangay_name ?? "Selected barangay"} ·{" "}
                      {advisory?.bulletin_reference ?? "No advisory selected"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${
                      riskTone[selectedRisk?.risk_category] ??
                      "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {selectedRisk?.risk_category
                      ? `${selectedRisk.risk_category} RISK`
                      : "DATA REQUIRED"}
                  </span>
                </div>

                {!assessmentReady ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">
                    <p className="font-bold">
                      The selected barangay and advisory do not yet have a complete stored assessment.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {!selectedRisk ? <li>No advisory-specific risk assessment is stored yet.</li> : null}
                      {!selectedExposure ? <li>No population exposure estimate is stored for this hazard.</li> : null}
                      {!hasValidatedCapacity ? <li>No validated preparedness capacity record is available.</li> : null}
                    </ul>
                    {!selectedRisk && reviewer && advisory?.verification_status === "VERIFIED" ? (
                      <p className="mt-3 text-xs leading-5 text-amber-900">
                        AGAP can create the advisory-specific assessment from the latest stored
                        barangay-hazard baseline. The deterministic inputs, methodology, evidence
                        date, and limitations are preserved and linked to this verified advisory.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Likelihood</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">
                          {selectedRisk.likelihood}
                          <span className="ml-1 text-sm font-semibold text-slate-500">/ {methodology?.likelihood_scale?.max ?? 5}</span>
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Severity</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">
                          {selectedRisk.severity}
                          <span className="ml-1 text-sm font-semibold text-slate-500">/ {methodology?.severity_scale?.max ?? 5}</span>
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk score</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">
                          {selectedRisk.risk_result}
                          <span className="ml-1 text-sm font-semibold text-slate-500">/ 25</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedRisk.likelihood} × {selectedRisk.severity} = {selectedRisk.risk_result}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-3">
                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Estimated potentially exposed</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">
                          {formatCount(selectedExposure.estimated_exposed_population)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatCount(selectedExposure.estimated_households)} estimated households
                        </p>
                        <p className="mt-2 text-xs text-slate-500">Confidence: {selectedExposure.confidence_level ?? "Not recorded"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recorded preparedness capacity</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{formatCount(recordedCapacity)}</p>
                        <p className="mt-1 text-sm text-slate-600">Validated {formatRecordDate(latestCapacity.validation_date)}</p>
                        <p className="mt-2 text-xs text-slate-500">{latestCapacity.source}</p>
                      </div>
                      <div className={`rounded-xl border p-4 ${capacityGap !== null && capacityGap > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Potential capacity gap</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{formatCount(capacityGap)}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {capacityGap !== null && capacityGap > 0
                            ? "Possible shortfall requiring LGU validation"
                            : "No positive shortfall indicated by stored values"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Adopted methodology</p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {methodology ? `${methodology.name} · ${methodology.version}` : "Methodology record unavailable"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{methodology?.source ?? "Source not recorded"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Assessment data</p>
                        <p className="mt-2 font-semibold text-slate-900">Source date: {formatRecordDate(selectedRisk.data_date)}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Confidence: {selectedRisk.confidence_level ?? "Not recorded"} · Exposure reference: {formatRecordDate(selectedExposure.reference_date)}
                        </p>
                      </div>
                    </div>

                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <summary className="cursor-pointer font-semibold text-slate-800">
                        View evidence, methodology, and limitations
                      </summary>
                      <div className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
                        <div>
                          <p className="font-bold text-slate-900">Evidence and sources</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {asList(selectedRisk.evidence).map((item) => <li key={item}>{item}</li>)}
                            <li>Exposure source: {selectedExposure.source}</li>
                            <li>Capacity source: {latestCapacity.source}</li>
                            {hazard?.source ? <li>Hazard source: {hazard.source}</li> : null}
                          </ul>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Limitations</p>
                          {assessmentLimitations.length ? (
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                              {assessmentLimitations.map((item, index) => (
                                <li key={`${index}:${item}`}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2">No limitations were recorded.</p>
                          )}
                        </div>
                      </div>
                    </details>
                  </>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button disabled={busy || offline} onClick={() => void run(load, "Latest stored assessment data loaded.")}>
                    Refresh stored data
                  </Button>
                  {!selectedRisk && (
                    <Button
                      disabled={
                        !reviewer ||
                        busy ||
                        offline ||
                        stale ||
                        !advisoryId ||
                        advisory?.verification_status !== "VERIFIED" ||
                        !selectedHazardId
                      }
                      onClick={() =>
                        void run(
                          generateAssessment,
                          "Advisory-specific assessment generated from the latest stored barangay-hazard baseline.",
                        )
                      }
                    >
                      Generate Assessment from Verified Data
                    </Button>
                  )}
                  <Button
                    disabled={!reviewer || busy || offline || stale || !assessmentReady}
                    onClick={() =>
                      void run(
                        generateCard,
                        "Action card generated from the stored assessment, exposure, and capacity records.",
                      )
                    }
                  >
                    Generate LGU Action Card
                  </Button>
                </div>

                <p className="text-xs leading-relaxed text-slate-500">
                  AGAP retrieves these values from the database for the selected barangay and advisory. Users review the evidence and result instead of reentering stored assessment data.
                </p>
              </Section>
              {card && (
                <>
                  <ConnectedLguOutput card={card} stale={stale} />
                  <PreparednessBrief card={card} />
                  <OfflineOperationsPack card={card} />
                </>
              )}
            </>
          )}
        </>
      )}
      {view === "report-damage" && (
        <Section title="Record an unverified field report">
          <p className="text-sm text-slate-600">
            Save first on this device, then synchronize. A reviewer confirms
            both the reported figures and linked needs. Do not include names or
            exact home addresses.
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) =>
              submit(e, async (f) => {
                await queueFieldReport(
                  {
                    barangayId,
                    advisoryId,
                    damageType: f.get("damageType"),
                    damageSummary: f.get("summary"),
                    severity: f.get("severity"),
                    reportedAffectedPersons: Number(f.get("persons")),
                    reportedAffectedHouseholds: Number(f.get("households")),
                    vulnerableGroups: {
                      children: Number(f.get("children") || 0),
                      olderPersons: Number(f.get("older") || 0),
                      personsWithDisabilities: Number(f.get("pwd") || 0),
                    },
                    criticalFacilityCondition: f.get("facility"),
                    accessCondition: f.get("access"),
                    serviceDisruption: f.get("services"),
                    source: f.get("source"),
                    evidence: [
                      {
                        type: "reference",
                        reference: String(f.get("evidence")),
                      },
                    ],
                    needs: f.getAll("needs"),
                    isDemo: f.get("isDemo") === "on",
                  },
                  data.userId,
                );
                setMessage(
                  "Report saved on this device as Pending Sync and Unverified.",
                );
                if (navigator.onLine) await syncPendingReports(data.userId);
              })
            }
          >
            <Field label="Observed incident / damage type" name="damageType" />
            <Field label="Damage summary" name="summary" />
            <label className="block text-sm">
              Reported severity
              <select className={inputClass} name="severity">
                {[
                  "MINOR",
                  "MODERATE",
                  "MAJOR",
                  "DESTROYED",
                  "UNDETERMINED",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Reported affected persons"
                name="persons"
                type="number"
                min={0}
              />
              <Field
                label="Reported affected households"
                name="households"
                type="number"
                min={0}
              />
              <Field
                label="Children reported"
                name="children"
                type="number"
                min={0}
                required={false}
              />
              <Field
                label="Older persons reported"
                name="older"
                type="number"
                min={0}
                required={false}
              />
              <Field
                label="PWD reported"
                name="pwd"
                type="number"
                min={0}
                required={false}
              />
            </div>
            <Field
              label="Critical-facility condition"
              name="facility"
              required={false}
            />
            <Field
              label="Road / access constraints"
              name="access"
              required={false}
            />
            <Field
              label="Service disruptions"
              name="services"
              required={false}
            />
            <fieldset>
              <legend className="font-semibold">
                Reported needs (unverified)
              </legend>
              <div className="flex flex-wrap gap-3">
                {[
                  "food",
                  "water",
                  "shelter",
                  "medicine",
                  "rescue",
                  "restoration",
                ].map((n) => (
                  <label
                    key={n}
                    className="flex min-h-11 items-center gap-2 text-sm"
                  >
                    <input type="checkbox" name="needs" value={n} />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Reporting source / unit" name="source" />
            <Field label="Evidence reference" name="evidence" />
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input name="isDemo" type="checkbox" />
              Synthetic demonstration report
            </label>
            <Button type="submit" disabled={busy || !advisoryId}>
              Save report & synchronize when online
            </Button>
          </form>
        </Section>
      )}
      {view === "recovery" && (
        <>
          <Section title="Validate & consolidate field reports">
            <Button
              disabled={busy || offline}
              onClick={() => void run(loadReports, "Reports loaded.")}
            >
              Load reports
            </Button>
            <form
              className="space-y-4"
              onSubmit={(e) =>
                submit(e, async (f) => {
                  const reportIds = f.getAll("reportIds").filter(
                    (value): value is string => typeof value === "string" && value.length > 0,
                  );
                  if (reportIds.length === 0) {
                    throw new Error("Select at least one report before generating the post-impact card.");
                  }
                  const result = await post<Row>(
                    "/api/post-impact/consolidate",
                    {
                      barangayId,
                      advisoryId,
                      reportIds,
                      reason: f.get("reason"),
                      nonOverlapping: f.get("nonOverlapping") === "on",
                    },
                  );
                  setPostImpact(result);
                  await loadActions(result.card.outputId);
                  await cacheOfflinePack(
                    `post:${data.userId}:${barangayId}`,
                    result,
                  );
                }, "Generating Post Impact Action Card…")
              }
            >
              {reports
                .filter((r) => r.advisory_id === advisoryId)
                .map((r) => (
                  <div
                    key={r.id}
                    className="space-y-2 rounded-xl border border-slate-200 p-3"
                  >
                    <label className="flex min-h-11 items-center gap-2">
                      <input name="reportIds" value={r.id} type="checkbox" />
                      <strong>{r.damage_type}</strong> · {r.verification_status}
                    </label>
                    <p className="text-sm">
                      {r.reported_affected_persons} persons ·{" "}
                      {r.reported_affected_households} households · {r.source}
                    </p>
                    <p className="text-sm">{r.damage_summary}</p>
                    <p className="text-sm">
                      Needs:{" "}
                      {r.submitted_payload?.needs?.join(", ") ||
                        "None reported"}
                    </p>
                    {r.verification_status !== "VERIFIED" && (
                      <Button
                        disabled={!reviewer || busy || offline}
                        onClick={() => {
                          setReviewReason("");
                          setReviewDialog({ kind: "verify", report: r });
                        }}
                      >
                        Verify report & linked needs
                      </Button>
                    )}
                  </div>
                ))}
              <Field label="Consolidation evidence / rationale" name="reason" />
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input name="nonOverlapping" type="checkbox" required />I
                checked that selected reports cover distinct households/persons
                and do not double-count impacts.
              </label>
              <Button type="submit" disabled={!reviewer || busy || offline}>
                Generate Post Impact Action Card
              </Button>
            </form>
            <Button
              onClick={() =>
                void run(async () => {
                  const saved = await readOfflinePack<Row>(
                    `post:${data.userId}:${barangayId}`,
                  );
                  if (!saved)
                    throw new Error(
                      "No post-impact card saved for this barangay.",
                    );
                  setPostImpact(saved.data);
                }, "Saved snapshot loaded; check its dates before use.")
              }
            >
              Open saved post-impact card
            </Button>
          </Section>
          {postImpact && <ConnectedPostOutput value={postImpact} />}
        </>
      )}
      {actions.length > 0 && (
        <Section title="Assigned actions & decisions">
          {actions.map((a) => (
            <form
              key={a.id}
              className="space-y-3 rounded-xl border border-slate-200 p-4"
              onSubmit={(e) =>
                submit(e, async (f) => {
                  await api(`/api/actions/${a.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      status: f.get("status"),
                      reason: f.get("reason"),
                      responsibleUnit: f.get("unit"),
                    }),
                  });
                  await loadActions(a.generated_output_id);
                })
              }
            >
              <p className="font-semibold">{a.action_text}</p>
              <p className="text-sm">
                Rule {a.action_rule_id} · {a.status}
              </p>
              <Field
                label="Responsible office / unit"
                name="unit"
                defaultValue={a.responsible_unit}
              />
              <label className="block text-sm">
                Status
                <select
                  className={inputClass}
                  name="status"
                  defaultValue={a.status}
                >
                  {[
                    "RECOMMENDED",
                    "FOR_VALIDATION",
                    "ASSIGNED",
                    "IN_PROGRESS",
                    "RESOLVED",
                    "DEFERRED",
                    "OVERRIDDEN",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <Field label="Decision / update reason" name="reason" />
              <Button type="submit" disabled={!reviewer || busy || offline}>
                Record decision
              </Button>
            </form>
          ))}
        </Section>
      )}
      <Section title="Synchronization & review history">
        <p className="text-sm">
          {queue.length} reports saved on this device awaiting synchronization
          or conflict review.
        </p>
        {queue.map((q) => (
          <p key={q.clientId} className="break-words text-sm">
            {q.status} · {q.deviceTimestamp} · {q.lastError || q.clientId}
          </p>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={busy || offline}
            onClick={() =>
              void run(
                () => syncPendingReports(data.userId),
                "Synchronization complete.",
              )
            }
          >
            Sync pending reports
          </Button>
          <Button
            disabled={!reviewer || busy || offline}
            onClick={() =>
              void run(async () => {
                setConflicts(await api<Row[]>("/api/conflicts"));
                setAuditRows(await api<Row[]>("/api/audit?limit=20"));
              }, "Review history loaded.")
            }
          >
            Review conflicts & audit
          </Button>
        </div>
        {conflicts
          .filter((c) => c.status === "ACTION_REQUIRED")
          .map((c) => (
            <div
              key={c.id}
              className="space-y-3 rounded-xl border border-amber-300 p-3"
            >
              <p className="font-bold">Conflicting field report</p>
              <details>
                <summary>Compare local and server records</summary>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs">
                  {JSON.stringify(
                    { local: c.client_payload, server: c.server_payload },
                    null,
                    2,
                  )}
                </pre>
              </details>
              <Button
                disabled={busy || !reviewer}
                onClick={() =>
                  (() => {
                    setReviewReason("");
                    setReviewDialog({ kind: "conflict", conflict: c });
                  })()
                }
              >
                Keep server record with reason
              </Button>
            </div>
          ))}
        {auditRows.length > 0 && (
          <ol className="space-y-2 text-sm">
            {auditRows.map((a) => (
              <li key={a.id}>
                {a.timestamp} · {a.action} · {a.reason || a.entity_type}
              </li>
            ))}
          </ol>
        )}
      </Section>
      {reviewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
          <form
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={submitReviewDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
          >
            <div>
              <h2 id="review-dialog-title" className="text-lg font-bold text-slate-900">
                {reviewDialog.kind === "verify" ? "Verify report and linked needs" : "Resolve conflict"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {reviewDialog.kind === "verify"
                  ? "Record the evidence used to confirm the reported figures and needs."
                  : "Explain why the server record should be retained."}
              </p>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Evidence or resolution reason
              <textarea
                className={`${inputClass} min-h-28`}
                value={reviewReason}
                onChange={(event) => setReviewReason(event.target.value)}
                minLength={10}
                required
                autoFocus
              />
            </label>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setReviewDialog(null);
                  setReviewReason("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {reviewDialog.kind === "verify" ? "Verify report" : "Keep server record"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ConnectedLguOutput({ card: c, stale }: { card: Row; stale: boolean }) {
  const a = c.situation.currentVerifiedAdvisory,
    e = c.potentialExposure,
    p = c.preparednessCapacity,
    w = c.whyAttentionIsNeeded;
  return (
    <LGUActionCard
      barangayName={c.situation.barangay}
      hazard={c.situation.hazard}
      advisory={{
        title: a.advisoryType,
        reference: a.bulletinReference,
        issuedAt: a.issueTime,
        validity: a.validityEnd,
        verificationState: stale ? "STALE" : "VERIFIED",
      }}
      assessment={{
        likelihood: str(w.riskInputs.likelihood),
        severity: str(w.riskInputs.severity),
        riskResult: str(w.riskResult),
        riskCategory: str(c.situation.riskCategory),
        relativeVulnerability: w.relativeVulnerability ?? null,
        methodology: w.methodology
          ? `${w.methodology.name} · ${w.methodology.version} · ${w.methodology.source}`
          : null,
        assessmentDate: c.situation.assessmentDate,
        verificationState: stale ? "STALE" : "VERIFIED",
      }}
      exposure={{
        estimatedPersons: str(e.estimatedPopulation),
        estimatedHouseholds: str(e.estimatedHouseholds),
        vulnerableGroups: str(e.vulnerableGroupEstimates),
        estimationMethod: e.estimationMethod,
        confidenceLevel: e.confidenceLevel,
        source: e.source,
        referenceDate: e.referenceDate,
        generatedAt: e.generatedAt,
      }}
      capacity={{
        recordedCapacity: str(p.validatedCapacity),
        potentialCapacityGap: str(p.capacityGap),
        criticalFacilityReadiness: p.criticalFacilities
          .map((f: Row) => `${f.name}: ${f.operationalStatus}`)
          .join("; "),
        criticalFacilities: p.criticalFacilities.map((f: Row) => ({
          name: f.name,
          operationalStatus: str(f.operationalStatus),
          capacity: str(f.capacity),
        })),
        communicationCapability: str(p.communicationAccess),
      }}
      evidence={w.vulnerabilityEvidence ?? []}
      dataGaps={[...(w.limitations ?? []), ...(w.capacityLimitations ?? [])]}
      recommendations={c.recommendedActions.map((r: Row) => ({
        id: r.actionRuleId,
        action: r.action,
        trigger: r.trigger,
        whyItApplies: r.whyItApplies,
        evidence: str(r.evidence),
        sourceRule: `${r.actionRuleId} · ${r.source}`,
        confirmationRequired: r.requiresLguConfirmation,
        responsibleUnit: r.responsibleUnit,
        status: r.status,
      }))}
    />
  );
}
function ConnectedPostOutput({ value }: { value: Row }) {
  const { review: r, card: c } = value;
  return (
    <PostImpactActionCard
      barangayName={c.barangay}
      eventName={c.eventReference}
      observedImpacts={{
        reportedAffectedPersons: str(c.reportedAffectedPersons),
        validatedAffectedPersons: str(c.validatedAffectedPersons),
        awaitingValidationPersons: str(c.populationAwaitingValidation),
        reportedAffectedHouseholds: str(r.reported_households),
        validatedAffectedHouseholds: str(r.validated_households),
        vulnerableGroupsReported: str(r.vulnerable_groups),
        damageSummary: r.damage_summary,
        criticalFacilityCondition: r.facility_condition,
        serviceDisruption: r.service_disruption,
        accessibilityConstraints: r.accessibility_constraints,
        urgentUnmetNeeds: r.urgent_unmet_needs,
        verificationState: r.validation_status,
        lastValidatedAt: r.updated_at,
      }}
      actions={c.actions.map((a: Row) => ({
        id: a.actionRuleId,
        phase: a.phase,
        action: a.action,
        whyItApplies: a.whyItApplies,
        evidence: str(a.evidence),
        sourceRule: `${a.actionRuleId} · ${a.source}`,
        responsibleUnit: a.responsibleUnit,
        confirmationRequired: a.requiresLguConfirmation,
        status: a.status,
      }))}
    />
  );
}
function renderAiInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    const match = part.match(/^\*\*(.+)\*\*$/);
    return match ? <strong key={index}>{match[1]}</strong> : <span key={index}>{part}</span>;
  });
}

function ReadableAiBrief({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5">
      <div className="space-y-2 text-sm leading-relaxed text-slate-700">
        {lines.map((rawLine, index) => {
          const line = rawLine.trim();
          if (!line) return <div key={index} className="h-1" aria-hidden="true" />;

          const heading = line.match(/^#{1,4}\s+(.+)$/);
          if (heading) {
            return (
              <h4 key={index} className="pt-2 text-base font-bold text-slate-950 first:pt-0">
                {renderAiInline(heading[1])}
              </h4>
            );
          }

          const bullet = line.match(/^[-*]\s+(.+)$/);
          if (bullet) {
            return (
              <div key={index} className="flex gap-2 pl-1">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                <p className="min-w-0">{renderAiInline(bullet[1])}</p>
              </div>
            );
          }

          const numbered = line.match(/^(\d+)\.\s+(.+)$/);
          if (numbered) {
            return (
              <div key={index} className="flex gap-2 pl-1">
                <span className="min-w-5 font-bold text-blue-700">{numbered[1]}.</span>
                <p className="min-w-0">{renderAiInline(numbered[2])}</p>
              </div>
            );
          }

          return <p key={index}>{renderAiInline(line)}</p>;
        })}
      </div>
    </div>
  );
}

function friendlyOperationalMethod(value: unknown) {
  if (!value) return "Not recorded";
  const raw = String(value);
  const labels: Record<string, string> = {
    INHABITED_AREA_PROPORTIONAL_FALLBACK: "Inhabited area proportion estimate",
    POPULATION_GRID_INTERSECTION: "Population grid intersection",
    RESIDENTIAL_BUILDING_ESTIMATE: "Residential building estimate",
  };
  return labels[raw] ?? raw.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PreparednessBrief({ card: c }: { card: Row }) {
  const a = c.situation.currentVerifiedAdvisory;
  const [aiBrief, setAiBrief] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const w = c.whyAttentionIsNeeded;
  const e = c.potentialExposure;
  const p = c.preparednessCapacity;
  const formatDate = (value: unknown) => {
    if (!value) return "Not recorded";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat("en-PH", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(date);
  };
  const display = (value: unknown, fallback = "Not recorded") =>
    value === null || value === undefined || value === "" ? fallback : String(value);
  const facilities = Array.isArray(p.criticalFacilities) ? p.criticalFacilities : [];
  const gaps = [
    "Shelter occupancy: Not yet validated",
    "Critical facility status: Requires confirmation",
    "Current road/access condition: Requires confirmation",
    "Barangay communication status: Requires confirmation",
  ];
  const generateAiBrief = async () => {
    if (!c.outputId) {
      setAiError("This output has no persisted source record for AI briefing.");
      return;
    }
    setAiBusy(true);
    setAiError("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outputId: c.outputId, mode: "brief", language: "en" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "AI briefing unavailable.");
      setAiBrief(result.data?.text ?? result.data?.content?.content ?? "");
      if (result.data?.fallback) {
        setAiError(result.data?.fallbackMessage ?? "Gemini wording is unavailable. This brief uses persisted verified data and approved actions.");
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI briefing unavailable.");
    } finally {
      setAiBusy(false);
    }
  };
  return (
    <Section title={`${c.situation.barangay} Preparedness Brief`}>
      <div className="space-y-6 text-sm">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            {display(c.situation.hazard, "Preparedness assessment")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-slate-950">
              {c.situation.barangay}, Lucena City
            </h2>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              {a.isDemo ? "Priority LGU review" : display(c.situation.verificationState)}
            </span>
          </div>
          <p className="mt-2 text-slate-600">
            Assessment: {a.isDemo ? "Synthetic demonstration scenario" : "Source-anchored assessment"} · Last updated {formatDate(c.situation.assessmentDate)}
          </p>
          <p className="mt-1 text-slate-600">
            Advisory status: {a.isDemo ? "Valid for demonstration only" : display(a.verificationStatus)} · Valid until {formatDate(a.validityEnd)}
          </p>
        </header>

        <section>
          <h3 className="text-base font-bold text-slate-950">Situation</h3>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-700">
            {display(a.warningInformation, "No advisory situation summary has been recorded.")}
          </p>
          <p className="mt-2 leading-relaxed text-slate-700">
            AGAP has identified conditions requiring LGU and barangay validation before further preparedness decisions are made.
          </p>
        </section>

        <section>
          <h3 className="text-base font-bold text-slate-950">Why {c.situation.barangay} needs attention</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk assessment</p>
              <p className="mt-2 font-semibold">Risk category: {display(c.situation.riskCategory)}</p>
              <p className="mt-1 text-slate-600">Likelihood: {display(w.riskInputs?.likelihood)}</p>
              <p className="text-slate-600">Severity of consequence: {display(w.riskInputs?.severity)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Potential exposure</p>
              <p className="mt-2 font-semibold">{display(e.estimatedPopulation)} persons / {display(e.estimatedHouseholds)} households</p>
              <p className="mt-1 text-slate-600">Confidence: {display(e.confidenceLevel)}</p>
              <p className="text-slate-600">Method: {friendlyOperationalMethod(e.estimationMethod)}</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-base font-bold text-slate-950">Preparedness capacity</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="rounded-xl border border-slate-200 p-4">Recorded shelter capacity: <strong>{display(p.validatedCapacity)}</strong></p>
            <p className="rounded-xl border border-slate-200 p-4">Potential capacity gap: <strong>{display(p.capacityGap)}</strong></p>
            <p className="rounded-xl border border-slate-200 p-4">Critical facilities requiring confirmation: <strong>{facilities.length}</strong></p>
            <p className="rounded-xl border border-slate-200 p-4">Communication capability: <strong>{display(p.communicationAccess, "Unknown")}</strong></p>
          </div>
        </section>

        <section>
          <h3 className="text-base font-bold text-slate-950">Priority checks</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
            <li>Validate current barangay conditions against the assessment.</li>
            <li>Check evacuation and temporary shelter capacity, access, utilities, and readiness.</li>
            <li>Check critical facilities, communications, health services, schools, and evacuation facilities.</li>
            <li>Confirm preparedness of households with older persons, children, persons with disabilities, and medicine needs.</li>
            <li>Prepare verified public communication using approved preparedness instructions.</li>
          </ol>
        </section>

        <section>
          <h3 className="text-base font-bold text-slate-950">Information still needed</h3>
          <ul className="mt-3 space-y-2 text-slate-700">
            {gaps.map((gap) => <li key={gap} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">{gap}</li>)}
          </ul>
        </section>

        <section>
          <h3 className="text-base font-bold text-slate-950">LGU actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Validate Barangay",
              "Request Update",
              "Assign Action",
              "Generate Preparedness Brief",
              "Generate Household Card",
              "Record Decision",
            ].map((action) => <span key={action} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-800">{action}</span>)}
          </div>
        </section>

        <section className="border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-950">AI-generated brief wording</h3>
              <p className="mt-1 text-xs text-slate-500">Generated only from this persisted action card and its source snapshot. It cannot change assessments or recommendations.</p>
            </div>
            <Button onClick={() => void generateAiBrief()} disabled={aiBusy || !c.outputId}>
              {aiBusy ? "Generating..." : "Generate AI brief"}
            </Button>
          </div>
          {aiError ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{aiError}</p> : null}
          {aiBrief ? <ReadableAiBrief text={aiBrief} /> : null}
        </section>

        <p className="border-l-4 border-amber-400 bg-amber-50 p-4 font-semibold leading-relaxed text-amber-950">
          This is a decision support assessment, not an evacuation order. Confirm current conditions and instructions with authorized Lucena City and barangay disaster officials.
        </p>

        <details className="border-t border-slate-200 pt-4">
          <summary className="cursor-pointer font-semibold text-slate-700">View sources & methodology</summary>
          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
            <p>Advisory reference: {display(a.bulletinReference)}</p>
            <p>Source: {display(a.sourceAgency)} · Issued: {formatDate(a.issueTime)}</p>
            <p>Methodology: {display(w.methodology)}</p>
            <p>Source dates: advisory valid until {formatDate(a.validityEnd)} · exposure reference {formatDate(e.referenceDate)}</p>
            <p>Action rule IDs: {c.recommendedActions.map((r: Row) => r.actionRuleId).join(", ") || "None recorded"}</p>
            <p>Verification: {display(c.situation.verificationState)}</p>
            {a.isDemo ? <p>Synthetic demonstration data. Not official disaster information.</p> : null}
          </div>
        </details>
      </div>
    </Section>
  );
}
