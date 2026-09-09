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
  const formatDate = (value: unknown) => {
    if (!value) return "Not recorded";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short" }).format(date);
  };
  const facilities = Array.isArray(p.criticalFacilities) ? p.criticalFacilities : [];
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
          {busy ? "Preparing..." : "Generate offline pack"}
        </button>
        <button
          disabled={!household}
          onClick={print}
          className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Print / Save offline pack
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {household && (
        <div ref={container} className="agap-print-pack space-y-5 text-sm">
          <article className="agap-pack-page space-y-4">
            <h2 className="text-2xl font-black">{card.situation.barangay} Preparedness Brief</h2>
            <p className="text-lg font-bold">{card.situation.hazard}</p>
            <p className="font-semibold">Status: PRIORITY LGU REVIEW</p>
            <p>{a.isDemo ? "Synthetic demonstration scenario. Not official disaster information." : "Source-anchored planning snapshot."}</p>
            <p>Advisory status: {a.isDemo ? "Valid for demonstration only" : a.verificationStatus}<br />Valid until: {formatDate(a.validityEnd)}</p>
            <h3 className="pt-4 text-lg font-bold">Situation</h3>
            <p className="whitespace-pre-wrap">{a.warningInformation}</p>
            <h3 className="pt-4 text-lg font-bold">Why this barangay needs attention</h3>
            <p>Risk category: <strong>{card.situation.riskCategory}</strong><br />Likelihood: {card.whyAttentionIsNeeded.riskInputs?.likelihood}<br />Severity: {card.whyAttentionIsNeeded.riskInputs?.severity}</p>
            <p>Estimated exposed population: {e.estimatedPopulation}<br />Estimated households: {e.estimatedHouseholds}<br />Confidence: {e.confidenceLevel} · Method: {e.estimationMethod}</p>
            <p className="border-l-4 border-amber-400 bg-amber-50 p-3 font-semibold">This is a decision support assessment, not an evacuation order. Confirm current instructions with authorized disaster officials.</p>
          </article>

          <article className="agap-pack-page space-y-4">
            <h2 className="text-xl font-bold">LGU Action Card</h2>
            <p>Barangay: {card.situation.barangay} · Hazard: {card.situation.hazard}</p>
            <p>Assessment: {card.situation.deterministicCalculation} · {card.situation.riskCategory}</p>
            <h3 className="pt-3 font-bold">Recommended LGU actions</h3>
            <ol className="list-decimal space-y-3 pl-5">
              {card.recommendedActions.map((r: Row) => <li key={r.actionRuleId}><strong>{r.action}</strong><br /><span>Responsible unit: {r.responsibleUnit ?? "To be assigned"} · Status: {r.status ?? "Recommended"}</span></li>)}
            </ol>
          </article>

          <article className="agap-pack-page space-y-4">
            <h2 className="text-xl font-bold">Population & Vulnerable Groups Summary</h2>
            <p>Estimated potentially exposed population: <strong>{e.estimatedPopulation}</strong></p>
            <p>Estimated households: <strong>{e.estimatedHouseholds}</strong></p>
            <p>Confidence: {e.confidenceLevel} · Method: {e.estimationMethod}</p>
            <h3 className="pt-3 font-bold">Vulnerable group estimates</h3>
            <table className="w-full border-collapse"><tbody>{Object.entries(e.vulnerableGroupEstimates ?? {}).map(([key, value]) => <tr key={key}><td className="border p-2">{key}</td><td className="border p-2">{String(value)}</td><td className="border p-2">Field confirmation: __________</td></tr>)}</tbody></table>
            <p>Source: {e.source ?? "Not recorded"} · Reference date: {formatDate(e.referenceDate)}</p>
          </article>

          <article className="agap-pack-page space-y-4">
            <h2 className="text-xl font-bold">Evacuation / Shelter Capacity Checklist</h2>
            <p>Recorded capacity: <strong>{p.validatedCapacity}</strong> · Potential capacity gap: <strong>{p.capacityGap}</strong></p>
            <table className="w-full border-collapse"><thead><tr><th className="border p-2 text-left">Check</th><th className="border p-2 text-left">Status / notes</th></tr></thead><tbody>{["Available spaces confirmed", "Accessibility checked", "Water and sanitation available", "Utilities / backup power checked", "Occupancy confirmed", "Transport and access route checked"].map((item) => <tr key={item}><td className="border p-2">{item}</td><td className="border p-2">________________________________</td></tr>)}</tbody></table>
          </article>

          <article className="agap-pack-page space-y-4">
            <h2 className="text-xl font-bold">Critical Facility Readiness Checklist</h2>
            <table className="w-full border-collapse"><thead><tr><th className="border p-2 text-left">Facility</th><th className="border p-2 text-left">Recorded status</th><th className="border p-2 text-left">Confirmation / date</th></tr></thead><tbody>{facilities.map((f: Row, index: number) => <tr key={f.id ?? index}><td className="border p-2">{f.name}</td><td className="border p-2">{f.operationalStatus} · {f.capacity ?? "Capacity not recorded"}</td><td className="border p-2">________________</td></tr>)}</tbody></table>
            {facilities.length === 0 ? <p>No critical facility records are currently available. Confirm with barangay officials.</p> : null}
          </article>

          <article className="agap-pack-page space-y-4">
            <h2 className="text-xl font-bold">Generic Household Preparedness Card</h2>
            <p>Barangay: {card.situation.barangay} · Advisory valid until: {formatDate(a.validityEnd)}</p>
            <ul className="list-disc space-y-3 pl-5">{household.actions.map((r: Row) => <li key={r.id}><strong>{r.title}</strong><br />{r.explanation}</li>)}</ul>
            <p className="border-l-4 border-amber-400 bg-amber-50 p-3">Follow current instructions from authorized barangay and LGU officials. This card is not an evacuation order.</p>
          </article>

          <article className="agap-pack-page space-y-4">
            <h2 className="text-xl font-bold">Emergency Contacts</h2>
            <p>Complete and verify this list with an authorized barangay or LGU officer before distribution.</p>
            <table className="w-full border-collapse"><thead><tr><th className="border p-2 text-left">Agency / unit</th><th className="border p-2 text-left">Contact</th><th className="border p-2 text-left">Verified on</th></tr></thead><tbody>{["Lucena City CDRRMO", "Barangay contact", "Health facility", "Police / fire / rescue", "Shelter coordinator"].map((item) => <tr key={item}><td className="border p-2">{item}</td><td className="border p-2">________________</td><td className="border p-2">________________</td></tr>)}</tbody></table>
          </article>

          <article className="agap-pack-page space-y-4">
            <h2 className="text-xl font-bold">Blank Damage Report</h2>
            <p className="font-semibold">UNVERIFIED until authorized LGU review</p>
            <p>Event / barangay / purok: ________________________________________________</p>
            <p>Date / time / reporting source: _________________________________________</p>
            <p>Reported persons: ______ · Households: ______ · Vulnerable groups: __________________</p>
            <p>Damage type / severity: __________________________________________________</p>
            <p>Facility condition / service disruption: _________________________________</p>
            <p>Road / access condition: _________________________________________________</p>
            <p>Evidence reference: _____________________________________________________</p>
          </article>

          <article className="agap-pack-page space-y-4">
            <h2 className="text-xl font-bold">Blank Needs Report</h2>
            <p className="font-semibold">UNVERIFIED until authorized LGU review</p>
            <p>Food [ ] Water [ ] Shelter [ ] Medicine [ ] Rescue [ ] Restoration [ ]</p>
            <p>Barangay / location: ____________________________________________________</p>
            <p>Need description and urgency: ___________________________________________</p>
            <p>Estimated people / households affected: _________________________________</p>
            <p>Reporting source / evidence: ____________________________________________</p>
            <p>Reviewer / date / decision: ______________________________________________</p>
          </article>

          <article className="agap-pack-page space-y-4">
            <h2 className="text-xl font-bold">Post Impact Validation Sheet</h2>
            <p>Event reference: ________________________________________________________</p>
            <p>Reported persons: ______ · Validated persons: ______ · Awaiting validation: ______</p>
            <p>Reported households: ______ · Validated households: ______</p>
            <p>Vulnerable groups validated: ____________________________________________</p>
            <p>Damage / facility / service findings: ___________________________________</p>
            <p>Verification evidence / reviewer / date: _________________________________</p>
            <p>Action / responsible unit / status / decision reason: ____________________</p>
            <h3 className="pt-4 font-bold">Paper record reconciliation</h3>
            <p>Encode each distinct paper report once. Retain the original source and timestamp. Keep paper reports unverified until review, check overlapping counts, and record the reason for resolved conflicts.</p>
          </article>
        </div>
      )}
    </section>
  );
}
