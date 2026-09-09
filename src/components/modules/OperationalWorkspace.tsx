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
import { api, saveAdvisory } from "@/lib/client/api";
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
import { calculateRisk } from "@/lib/domain/riskEngine";
import { assertCurrentAdvisory } from "@/lib/domain/advisory";
import { OfflineOperationsPack } from "./OfflineOperationsPack";

type Row = Record<string, any>;
type Workspace = {
  userId: string;
  role: string;
  synchronizedAt: string;
} & Record<string, any>;
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
  const { currentModule, prepareSubView, setCurrentModule } = useNavigation();
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
  const [localRisk, setLocalRisk] = useState<Row | null>(null);
  const [queue, setQueue] = useState<PendingFieldReport[]>([]);
  const [conflicts, setConflicts] = useState<Row[]>([]);
  const [auditRows, setAuditRows] = useState<Row[]>([]);
  const [offline, setOffline] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);
  const reviewer = data?.role === "admin" || data?.role === "lgu_reviewer";
  const barangay = data?.barangays.find((b: Row) => b.id === barangayId);
  const advisory = data?.advisories.find((a: Row) => a.id === advisoryId);
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
    setLocalRisk(null);
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
  ) {
    setBusy(true);
    setError("");
    setMessage("");
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
  async function generateCard() {
    const result = await post<Row>("/api/action-cards/lgu", {
      barangayId,
      hazardId,
      advisoryId,
    });
    setCard(result);
    await cacheOfflinePack(
      `lgu:${data!.userId}:${barangayId}:${advisoryId}:${hazardId}`,
      result,
    );
    await loadActions(result.outputId);
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
  const submit = (
    e: FormEvent<HTMLFormElement>,
    fn: (form: FormData) => Promise<void>,
  ) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void run(() => fn(form));
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
          {busy ? "Working…" : message}
        </p>
      )}
      {contextSelector}
      {advisory?.is_demo && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Synthetic demonstration advisory. Not official disaster information.
        </p>
      )}
      {view === "home" && (
        <>
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
                disabled={busy || offline || data.role === "field_reporter"}
                onClick={() => setShowAdvisory(!showAdvisory)}
              >
                Enter advisory
              </Button>
              <Button
                disabled={
                  !reviewer ||
                  busy ||
                  offline ||
                  !advisory ||
                  advisory.verification_status === "VERIFIED"
                }
                onClick={() =>
                  void run(async () => {
                    await post(`/api/advisories/${advisoryId}/verify`, {});
                    await load();
                  }, "Advisory verified and audit recorded.")
                }
              >
                Verify source & advisory
              </Button>
              <Button onClick={() => setCurrentModule("prepare")}>
                Open assessment
              </Button>
            </div>
            {showAdvisory && (
              <AdvisoryForm
                onCancel={() => setShowAdvisory(false)}
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
                  await saveAdvisory(values, evidence);
                  await load();
                  setShowAdvisory(false);
                  setMessage(
                    "Advisory saved as unverified. A reviewer must verify it before assessment.",
                  );
                }}
              />
            )}
          </Section>
        </>
      )}
      {view === "prepare" && (
        <>
          {prepareSubView === "action-card" ? (
            <ConnectedHouseholdCard />
          ) : (
            <>
              <Section title="Risk, exposure & capacity">
                <label className="block text-sm font-medium">
                  Hazard
                  <select
                    value={hazardId}
                    onChange={(e) => setHazardId(e.target.value)}
                    className={inputClass}
                  >
                    {data.hazards.map((h: Row) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </label>
                <form
                  className="space-y-4"
                  onSubmit={(e) =>
                    submit(e, async (f) => {
                      const input = {
                        barangayId,
                        advisoryId,
                        hazardId,
                        dataDate: f.get("dataDate"),
                        methodologyId: f.get("methodology"),
                        likelihood: Number(f.get("likelihood")),
                        severity: Number(f.get("severity")),
                        evidence: [String(f.get("evidence"))],
                        limitations: String(f.get("limitations") || "")
                          .split("\n")
                          .filter(Boolean),
                        confidenceLevel: f.get("confidence"),
                      };
                      if (offline) {
                        assertCurrentAdvisory(
                          {
                            verificationStatus: advisory.verification_status,
                            validityStart: advisory.validity_start,
                            validityEnd: advisory.validity_end,
                            affectedAreas: advisory.affected_areas,
                          },
                          barangay.barangay_name,
                        );
                        const method = data.methodologies.find(
                          (m: Row) => m.id === input.methodologyId,
                        );
                        if (!method) throw new Error("No cached methodology.");
                        const result = calculateRisk(
                          {
                            name: method.name,
                            version: method.version,
                            likelihoodScale: method.likelihood_scale,
                            severityScale: method.severity_scale,
                            parameters: method.parameters,
                          },
                          input,
                        );
                        setLocalRisk(result);
                        await cacheOfflinePack(
                          `local-risk:${data.userId}:${barangayId}`,
                          result,
                        );
                      } else {
                        await post("/api/risk-assessments", input);
                        setLocalRisk(null);
                        await load();
                      }
                    })
                  }
                >
                  <label className="block text-sm font-medium">
                    Adopted methodology
                    <select name="methodology" className={inputClass} required>
                      {data.methodologies
                        .filter((m: Row) => m.active_status)
                        .map((m: Row) => (
                          <option key={m.id} value={m.id}>
                            {m.name} · {m.version} · {m.source}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Likelihood (adopted scale)"
                      name="likelihood"
                      type="number"
                      min={1}
                    />
                    <Field
                      label="Severity (adopted scale)"
                      name="severity"
                      type="number"
                      min={1}
                    />
                  </div>
                  <Field
                    label="Assessment source data date"
                    name="dataDate"
                    type="date"
                  />
                  <Field
                    label="Verified evidence / source reference"
                    name="evidence"
                  />
                  <Field
                    label="Limitations / missing information"
                    name="limitations"
                    required={false}
                  />
                  <label className="block text-sm">
                    Confidence
                    <select className={inputClass} name="confidence">
                      <option>LOW</option>
                      <option>MEDIUM</option>
                      <option>HIGH</option>
                    </select>
                  </label>
                  <Button
                    type="submit"
                    disabled={!reviewer || busy || !advisoryId || stale}
                  >
                    {offline
                      ? "Calculate offline draft"
                      : "Calculate & save assessment"}
                  </Button>
                </form>
                {localRisk && (
                  <p
                    role="status"
                    className="rounded-xl bg-amber-50 p-4 text-sm"
                  >
                    Offline draft: {localRisk.calculation} ·{" "}
                    {localRisk.riskCategory} · {localRisk.methodologyName}{" "}
                    {localRisk.methodologyVersion}. Cached methodology; not a
                    newly verified server assessment.
                  </p>
                )}
                <details>
                  <summary className="cursor-pointer py-3 font-semibold">
                    Record a population-exposure estimate
                  </summary>
                  <p className="mb-3 text-sm text-slate-600">
                    Use an authorized spatial result. Values remain estimates,
                    with method, confidence and source recorded.
                  </p>
                  <form
                    className="space-y-3"
                    onSubmit={(e) =>
                      submit(e, async (f) => {
                        await post("/api/exposure", {
                          barangayId,
                          hazardId,
                          source: f.get("source"),
                          referenceDate: f.get("date"),
                          population: Number(f.get("population")),
                          households: Number(f.get("households")),
                          [String(f.get("method"))]: Number(f.get("value")),
                          limitations: [String(f.get("limitations"))],
                        });
                        await load();
                      })
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Population baseline"
                        name="population"
                        type="number"
                        min={1}
                      />
                      <Field
                        label="Household baseline"
                        name="households"
                        type="number"
                        min={0}
                      />
                    </div>
                    <label className="block text-sm">
                      Method
                      <select className={inputClass} name="method">
                        <option value="inhabitedAreaRatio">
                          Inhabited-area ratio (0–1, low confidence)
                        </option>
                        <option value="residentialBuildingRatio">
                          Residential-building ratio (0–1)
                        </option>
                        <option value="populationGridIntersected">
                          Population grid intersection (persons)
                        </option>
                      </select>
                    </label>
                    <Field
                      label="Calculated spatial input"
                      name="value"
                      type="number"
                      min={0}
                      step="any"
                    />
                    <Field label="Source / spatial dataset" name="source" />
                    <Field label="Reference date" name="date" type="date" />
                    <Field label="Method limitations" name="limitations" />
                    <Button
                      type="submit"
                      disabled={!reviewer || busy || offline}
                    >
                      Save exposure estimate
                    </Button>
                  </form>
                </details>
                <p className="text-sm text-slate-600">
                  Recorded capacity:{" "}
                  {data.preparedness_capacities
                    .filter((c: Row) => c.barangay_id === barangayId)
                    .map(
                      (c: Row) =>
                        `${c.evacuation_capacity + c.temporary_shelter_capacity} persons; validated ${c.validation_date ?? "not yet"}; ${c.source}`,
                    )
                    .join(" · ") || "No validated capacity record."}
                </p>
                <Button
                  disabled={!reviewer || busy || offline || stale}
                  onClick={() =>
                    void run(
                      generateCard,
                      "Action card generated, cached, and actions registered for review.",
                    )
                  }
                >
                  Generate LGU Action Card
                </Button>
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
                  const result = await post<Row>(
                    "/api/post-impact/consolidate",
                    {
                      barangayId,
                      advisoryId,
                      reportIds: f.getAll("reportIds"),
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
                })
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
                        onClick={() =>
                          void run(async () => {
                            const reason = window.prompt(
                              "Record the evidence used to verify this report's figures and linked needs (at least 10 characters).",
                            );
                            if (!reason)
                              throw new Error("Verification cancelled.");
                            await post(`/api/damage-reports/${r.id}/verify`, {
                              reason,
                            });
                            await loadReports();
                          }, "Report and linked needs verified; audit recorded.")
                        }
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
                  void run(async () => {
                    const reason = window.prompt(
                      "Why should the server record be kept? (at least 10 characters)",
                    );
                    if (!reason) throw new Error("Resolution cancelled.");
                    await post(`/api/conflicts/${c.id}/resolve`, {
                      resolution: "KEEP_SERVER",
                      reason,
                    });
                    await clearResolvedLocalConflict(c.client_id);
                    setConflicts((old) => old.filter((x) => x.id !== c.id));
                  }, "Conflict resolved; server record retained.")
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
function PreparednessBrief({ card: c }: { card: Row }) {
  const a = c.situation.currentVerifiedAdvisory;
  return (
    <Section title="Barangay preparedness brief & offline pack">
      <p className="text-sm">
        {c.situation.barangay} · {a.bulletinReference} · Source {a.sourceAgency}{" "}
        · Valid until {a.validityEnd}
      </p>
      <p className="whitespace-pre-wrap text-sm">{a.warningInformation}</p>
      <ul className="list-disc space-y-2 pl-5 text-sm">
        {c.recommendedActions.map((r: Row) => (
          <li key={r.actionRuleId}>
            {r.action} — {r.responsibleUnit} · {r.actionRuleId} · {r.source}
          </li>
        ))}
      </ul>
      <p className="text-sm">
        Confirm current instructions with authorized LGU officials. Estimates
        are not validated impact counts.
      </p>
      <Button onClick={() => window.print()}>Print cards & brief</Button>
    </Section>
  );
}
