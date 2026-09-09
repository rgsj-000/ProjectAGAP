"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/client/api";
import { cacheOfflinePack, readOfflinePack } from "@/lib/client/offlineQueue";
import { generateHouseholdCard } from "@/lib/domain/actionCards";
type Row = Record<string, any>;
export function OfflineOperationsPack({ card }: { card: Row }) {
  const container = useRef<HTMLDivElement>(null);
  const [household, setHousehold] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const a = card.situation.currentVerifiedAdvisory,
    p = card.preparednessCapacity,
    e = card.potentialExposure;
  async function prepare() {
    setBusy(true);
    setError("");
    try {
      const key = `public:${card.situation.barangay}`;
      let pack: Row;
      if (navigator.onLine) {
        pack = await api<Row>(
          `/api/public/preparedness?barangay=${encodeURIComponent(card.situation.barangay)}`,
        );
        await cacheOfflinePack(key, pack);
      } else {
        const saved = await readOfflinePack<Row>(key);
        if (!saved)
          throw new Error("Load the generic household card online first.");
        pack = saved.data;
      }
      const result = generateHouseholdCard({
        barangay: pack.barangay,
        profile: { genericBarangay: true },
        advisory: pack.advisory,
        rules: pack.rules,
        language: "en",
      });
      setHousehold(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  function print() {
    if (!container.current) return;
    document.body.classList.add("printing-agap-pack");
    const restore = () => document.body.classList.remove("printing-agap-pack");
    window.addEventListener("afterprint", restore, { once: true });
    try {
      window.print();
    } finally {
      restore();
    }
  }
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold">Barangay Offline Operations Pack</h2>
      <p className="text-sm text-slate-600">
        Prepare a paper fallback before power or connectivity is lost. Includes
        source dates, readiness sheets and blank reporting forms.
      </p>
      <div className="flex gap-3">
        <button
          disabled={busy}
          onClick={() => void prepare()}
          className="min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
        >
          {busy ? "Preparing…" : "Prepare pack"}
        </button>
        <button
          disabled={!household}
          onClick={print}
          className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Print / Save as PDF
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {household && (
        <div ref={container} className="agap-print-pack space-y-5 text-sm">
          <h2 className="text-xl font-bold">
            {card.situation.barangay} — Offline Operations Pack
          </h2>
          <p>
            {a.isDemo
              ? "SYNTHETIC DEMONSTRATION — NOT OFFICIAL INFORMATION"
              : "Source-anchored planning snapshot"}
          </p>
          <p>
            Advisory: {a.bulletinReference} · {a.sourceAgency}
            <br />
            Issued: {a.issueTime} · Valid until: {a.validityEnd}
            <br />
            Source: {a.sourceLink}
          </p>
          <h3 className="font-bold">LGU action summary</h3>
          <p>
            {card.situation.deterministicCalculation} ·{" "}
            {card.situation.riskCategory} · Assessed{" "}
            {card.situation.assessmentDate}
          </p>
          <ul className="list-disc pl-5">
            {card.recommendedActions.map((r: Row) => (
              <li key={r.actionRuleId}>
                {r.action} · {r.responsibleUnit} · Rule {r.actionRuleId} ·{" "}
                {r.source}
              </li>
            ))}
          </ul>
          <h3 className="font-bold">Exposure, vulnerable groups & capacity</h3>
          <p>
            Estimated potentially exposed: {e.estimatedPopulation} persons /{" "}
            {e.estimatedHouseholds} households. Method: {e.estimationMethod};
            confidence: {e.confidenceLevel}; source: {e.source}; date:{" "}
            {e.referenceDate}.
          </p>
          <p>
            Supported vulnerable-group estimates:{" "}
            {JSON.stringify(e.vulnerableGroupEstimates)}. Validated capacity:{" "}
            {p.validatedCapacity}; potential gap: {p.capacityGap}. This is not
            an evacuation order.
          </p>
          <h3 className="font-bold">
            Facility readiness / shelter capacity sheet
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left">Facility</th>
                <th className="border p-2 text-left">
                  Recorded status / capacity
                </th>
                <th className="border p-2 text-left">Field confirmation</th>
              </tr>
            </thead>
            <tbody>
              {p.criticalFacilities.map((f: Row) => (
                <tr key={f.id}>
                  <td className="border p-2">{f.name}</td>
                  <td className="border p-2">
                    {f.operationalStatus} / {f.capacity ?? "not recorded"}
                  </td>
                  <td className="border p-2">________________</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="font-bold">Authorized emergency contacts</h3>
          <p>
            No verified contact registry is connected. An authorized barangay
            officer must complete and confirm this list before distribution.
          </p>
          <p>
            Agency / unit: __________________ Contact: __________________
            Verified on: __________
          </p>
          <h3 className="font-bold">Generic household preparedness card</h3>
          <ul className="list-disc pl-5">
            {household.actions.map((r: Row) => (
              <li key={r.id}>
                {r.title} · {r.sourceRule}
              </li>
            ))}
          </ul>
          <p>
            Follow current instructions from your barangay and LGU. This
            snapshot is not a current warning once its validity has expired.
          </p>
          <h3 className="font-bold">Blank damage report — UNVERIFIED</h3>
          <p>
            Event / barangay / purok:
            __________________________________________________
          </p>
          <p>
            Date / source / evidence:
            __________________________________________________
          </p>
          <p>
            Reported persons: ______ Households: ______ Vulnerable groups:
            ______________
          </p>
          <p>
            Damage / severity:
            _______________________________________________________
          </p>
          <p>
            Facility / services / access:
            ________________________________________________
          </p>
          <h3 className="font-bold">Blank needs report — UNVERIFIED</h3>
          <p>
            Food ___ Water ___ Shelter ___ Medicine ___ Rescue ___ Restoration
            ___
          </p>
          <p>
            Evidence / urgency / reporting source:
            ______________________________________
          </p>
          <h3 className="font-bold">Post-impact validation sheet</h3>
          <p>
            Reported persons: _____ Validated persons: _____ Awaiting
            validation: _____
          </p>
          <p>Reported households: _____ Validated households: _____</p>
          <p>
            Verification evidence / reviewer / date:
            _____________________________________
          </p>
          <p>
            Action / responsible unit / status / decision reason:
            __________________________
          </p>
          <h3 className="font-bold">Reconciliation after service returns</h3>
          <p>
            Encode each distinct paper report once. Retain its original source
            and device/report timestamp. Paper reports remain unverified until
            reviewed. Check for overlapping household counts before
            consolidation. Resolve conflicting records with an authorized
            reviewer; retain the audit reason.
          </p>
        </div>
      )}
    </section>
  );
}
