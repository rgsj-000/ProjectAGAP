"use client";
import { useEffect, useState } from "react";
import {
  HouseholdActionCard,
  type HouseholdCardOutput,
} from "./HouseholdActionCard";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/client/api";
import { cacheOfflinePack, readOfflinePack } from "@/lib/client/offlineQueue";
import { generateHouseholdCard } from "@/lib/domain/actionCards";
import { ConnectivityStatus } from "@/components/feedback/ConnectivityStatus";

type PublicAdvisory = {
  id: string;
  sourceAgency: string;
  advisoryType: string;
  bulletinReference: string;
  warningInformation: string;
  issueTime: string;
  validityEnd: string;
  affectedAreas: string[];
  sourceLink: string;
  verificationStatus: "VERIFIED";
};

export function ConnectedHouseholdCard() {
  const { language } = useLanguage();
  const [barangays, setBarangays] = useState<string[]>([]);
  const [currentAdvisories, setCurrentAdvisories] = useState<PublicAdvisory[]>([]);
  const [output, setOutput] = useState<HouseholdCardOutput | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const displayedOutput = output && Date.parse(output.advisoryValidity ?? "") <= now
    ? { ...output, advisoryVerificationState: "STALE" as const } : output;
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    void (async () => {
      try {
        const [names, advisories] = await Promise.all([
          api<string[]>("/api/public/preparedness"),
          api<PublicAdvisory[]>("/api/public/advisories"),
        ]);
        setBarangays(names);
        setCurrentAdvisories(advisories);
        await Promise.all([
          cacheOfflinePack("public:barangays", names),
          cacheOfflinePack("public:advisories", advisories),
        ]);
      } catch (e) {
        const [cachedBarangays, cachedAdvisories] = await Promise.all([
          readOfflinePack<string[]>("public:barangays").catch(() => undefined),
          readOfflinePack<PublicAdvisory[]>("public:advisories").catch(() => undefined),
        ]);
        if (cachedBarangays) setBarangays(cachedBarangays.data);
        if (cachedAdvisories) setCurrentAdvisories(cachedAdvisories.data);
        if (!cachedBarangays)
          setError(
            navigator.onLine
              ? "Household data is temporarily unavailable. Please try again later or contact your barangay."
              : "Connect to load the barangay directory first.",
          );
      }
    })();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  async function generate(request: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setOutput(null);
    try {
      let card: HouseholdCardOutput;
      const code = String(request.householdCode ?? "")
        .trim()
        .toUpperCase();
      if (navigator.onLine) {
        card = await api<HouseholdCardOutput>("/api/households/action-card", {
          method: "POST",
          body: JSON.stringify({
            ...request,
            ...(code ? { householdCode: code } : {}),
            language,
          }),
        });
        card.lastSyncAt = new Date().toISOString();
        try { const pack = await api<any>(
          `/api/public/preparedness?barangay=${encodeURIComponent(card.barangay)}`,
        );
        await cacheOfflinePack(`public:${card.barangay}`, pack);
        if (code)
          await cacheOfflinePack(`household-card:${code}:${language}`, card);
        } catch { card.limitations = [...(card.limitations ?? []), "Offline storage could not be prepared. Keep a printed copy of this card."]; }
      } else if (code) {
        const saved = await readOfflinePack<HouseholdCardOutput>(
          `household-card:${code}:${language}`,
        );
        if (!saved)
          throw new Error(
            "This household code has not been cached. Use Quick Profile or Generic Barangay Card with a previously loaded barangay.",
          );
        card = saved.data;
      } else {
        const saved = await readOfflinePack<any>(`public:${request.barangay}`);
        if (!saved)
          throw new Error(
            "Load a card for this barangay online before using it offline.",
          );
        const { advisory, rules } = saved.data;
        if (Date.parse(advisory.validityEnd) <= Date.now())
          throw new Error(
            "The cached advisory has expired. Connect to confirm the latest advisory; no new card was generated.",
          );
        card = generateHouseholdCard({
          barangay: String(request.barangay),
          profile:
            request.mode === "generic" ? { genericBarangay: true } : request,
          advisory,
          rules,
          language,
        }) as HouseholdCardOutput;
        card.lastSyncAt = saved.savedAt;
      }
      if (Date.parse(card.advisoryValidity ?? "") <= Date.now())
        card = {
          ...card,
          advisoryVerificationState: "STALE",
          limitations: [
            ...(card.limitations ?? []),
            "Saved card is outdated. Confirm current LGU instructions before relying on it.",
          ],
        };
      setOutput(card);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <ConnectivityStatus
        audience="public"
        status={
          displayedOutput?.advisoryVerificationState === "STALE"
            ? "STALE"
            : offline
              ? "OFFLINE"
              : "ONLINE"
        }
        lastSyncAt={output?.lastSyncAt}
        advisoryValidity={output?.advisoryValidity}
      />
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {currentAdvisories.length > 0 ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Current verified advisory
              </p>
              <p className="mt-1 text-sm text-emerald-950">
                Household cards use the newest verified advisory that applies to the selected barangay.
              </p>
            </div>
            <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-800">
              VERIFIED
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {currentAdvisories.slice(0, 3).map((advisory) => (
              <article key={advisory.id} className="rounded-xl border border-emerald-200 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-950">
                      {advisory.advisoryType} · {advisory.bulletinReference}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {advisory.sourceAgency} · Valid until {new Date(advisory.validityEnd).toLocaleString("en-PH")}
                    </p>
                  </div>
                  <a
                    href={advisory.sourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-700 underline"
                  >
                    Official source
                  </a>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-700">
                  Applies to {advisory.affectedAreas.length} Lucena City barangay(s).
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No current verified advisory is available yet. Household cards will become available after an authorized LGU reviewer verifies a valid advisory for the barangay.
        </section>
      )}
      <HouseholdActionCard
        barangays={barangays}
        requireBarangaySelection
        output={displayedOutput}
        isGenerating={busy}
        onGenerateByCode={(householdCode) =>
          generate({ mode: "code", householdCode })
        }
        onGenerateQuickProfile={(profile) =>
          generate({ mode: "quick-profile", ...profile })
        }
        onGenerateGeneric={(barangay) =>
          generate({ mode: "generic", barangay })
        }
      />
    </div>
  );
}
