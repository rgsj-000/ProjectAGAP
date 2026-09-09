"use client";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/client/api";
const cls =
  "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";
function Input({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className={cls}
        name={name}
        type={type}
        required
        min={type === "number" ? 0 : undefined}
      />
    </label>
  );
}
export function ReferenceDataForms({
  barangayId,
  onSaved,
}: {
  barangayId: string;
  onSaved: () => Promise<void>;
}) {
  const [kind, setKind] = useState("capacity");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) || "");
    let value: Record<string, unknown>;
    try {
      if (kind === "capacity")
        value = {
          kind,
          barangayId,
          evacuationCapacity: Number(get("evacuation")),
          temporaryShelterCapacity: Number(get("shelter")),
          validationDate: get("date"),
          source: get("source"),
          communicationAccess: get("communication")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          limitations: [get("limitations")],
        };
      else if (kind === "methodology")
        value = {
          kind,
          name: get("name"),
          version: get("version"),
          source: get("source"),
          likelihoodScale: {
            min: Number(get("lMin")),
            max: Number(get("lMax")),
          },
          severityScale: { min: Number(get("sMin")), max: Number(get("sMax")) },
          categories: get("categories")
            .split("\n")
            .filter(Boolean)
            .map((row) => {
              const [min, max, label] = row.split(",");
              return {
                min: Number(min),
                max: Number(max),
                label: label?.trim(),
              };
            }),
        };
      else {
        const raw = get("threshold");
        value = {
          kind,
          ruleId: get("ruleId"),
          phase: get("phase"),
          field: get("field"),
          operator: get("operator"),
          threshold:
            raw === "true"
              ? true
              : raw === "false"
                ? false
                : raw.trim() !== "" && Number.isFinite(Number(raw))
                  ? Number(raw)
                  : raw,
          approvedAction: get("en"),
          approvedActionFil: get("fil"),
          whyItApplies: get("whyEn"),
          whyItAppliesFil: get("whyFil"),
          sourceAgency: get("agency"),
          sourceDocument: get("source"),
          responsibleUnit: get("unit"),
          version: get("version"),
        };
      }
      await api("/api/reference-data", {
        method: "POST",
        body: JSON.stringify(value),
      });
      await onSaved();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer font-bold">
        Approved reference records
      </summary>
      <p className="my-3 text-sm text-slate-600">
        Record adopted methods, validated capacity, and source-approved
        bilingual actions. New entries are versioned records; reference the
        actual approval source.
      </p>
      <label className="block text-sm">
        Record type
        <select
          className={cls}
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setSaved(false);
            setError("");
          }}
        >
          <option value="capacity">Validated preparedness capacity</option>
          <option value="methodology">Adopted risk methodology</option>
          <option value="rule">Approved action rule</option>
        </select>
      </label>
      <form key={kind} className="mt-4 space-y-3" onSubmit={submit}>
        {kind === "capacity" ? (
          <>
            <Input
              name="evacuation"
              label="Validated evacuation capacity (persons)"
              type="number"
            />
            <Input
              name="shelter"
              label="Separate temporary-shelter capacity (persons; no overlap)"
              type="number"
            />
            <Input name="date" label="Validation date" type="date" />
            <Input
              name="communication"
              label="Validated communication methods (comma separated)"
            />
            <Input name="limitations" label="Capacity limitations" />
          </>
        ) : kind === "methodology" ? (
          <>
            <Input name="name" label="Methodology name" />
            <Input name="version" label="Adopted version" />
            <div className="grid grid-cols-2 gap-3">
              <Input name="lMin" label="Likelihood minimum" type="number" />
              <Input name="lMax" label="Likelihood maximum" type="number" />
              <Input name="sMin" label="Severity minimum" type="number" />
              <Input name="sMax" label="Severity maximum" type="number" />
            </div>
            <label className="block text-sm">
              Approved category bands: minimum,maximum,label (one per line)
              <textarea name="categories" required rows={4} className={cls} />
            </label>
          </>
        ) : (
          <>
            <Input name="ruleId" label="Approved rule identifier" />
            <Input name="version" label="Rule version" />
            <label className="block text-sm">
              Phase
              <select name="phase" className={cls}>
                {[
                  "PRE_DISASTER",
                  "HOUSEHOLD",
                  "POST_IMMEDIATE",
                  "POST_STABILIZATION",
                  "POST_MITIGATION",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Trigger field
              <select name="field" className={cls}>
                {[
                  "riskCategory",
                  "capacityGap",
                  "criticalFacilityUnverified",
                  "genericBarangay",
                  "hasInfantOrChild",
                  "hasOlderPerson",
                  "hasPwdOrMobilityLimitation",
                  "hasEssentialMedicineNeed",
                  "hasPets",
                  "communicationMethods",
                  "populationAwaitingValidation",
                  "waterNeedValidated",
                  "serviceDisruption",
                  "accessibilityConstraints",
                  "validationIncomplete",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Condition
              <select name="operator" className={cls}>
                {["EQ", "GT", "LT", "TRUTHY", "CONTAINS"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <Input
              name="threshold"
              label="Approved threshold / trigger value"
            />
            <Input name="en" label="Approved action (English)" />
            <Input name="fil" label="Approved action (Filipino)" />
            <Input name="whyEn" label="Why this applies (English)" />
            <Input name="whyFil" label="Why this applies (Filipino)" />
            <Input name="agency" label="Approving source agency" />
            <Input name="unit" label="Responsible unit" />
          </>
        )}
        <Input name="source" label="Source document / approval reference" />
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm text-emerald-700">
            Reference record saved and audit recorded.
          </p>
        )}
        <button
          disabled={busy}
          className="min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save approved record"}
        </button>
      </form>
    </details>
  );
}
