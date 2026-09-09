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

export function ConnectedHouseholdCard() {
  const { language } = useLanguage();
  const [barangays, setBarangays] = useState<string[]>([]);
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
        const names = await api<string[]>("/api/public/preparedness");
        setBarangays(names);
        await cacheOfflinePack("public:barangays", names);
      } catch (e) {
        const cached = await readOfflinePack<string[]>("public:barangays").catch(() => undefined);
        if (cached) setBarangays(cached.data);
        else
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
