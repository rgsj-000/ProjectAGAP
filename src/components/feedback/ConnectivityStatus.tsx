"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { getHelpContent } from "@/lib/help-content";

export type ConnectivityState =
  | "ONLINE"
  | "OFFLINE"
  | "STALE"
  | "SYNCING"
  | "ACTION_REQUIRED";

export interface ConnectivityStatusProps {
  status?: ConnectivityState;
  lastSyncAt?: string | null;
  advisoryValidity?: string | null;
  pendingSyncCount?: number;
  staleReason?: string | null;
  actionRequiredMessage?: string | null;
  onOpenSyncQueue?: () => void;
  compact?: boolean;
  className?: string;
}

const statusStyles: Record<
  ConnectivityState,
  {
    container: string;
    badge: string;
    icon: React.ReactNode;
  }
> = {
  ONLINE: {
    container: "border-emerald-200 bg-emerald-50/70",
    badge: "border-emerald-200 bg-white text-emerald-700",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />,
  },
  OFFLINE: {
    container: "border-slate-300 bg-slate-50",
    badge: "border-slate-300 bg-white text-slate-700",
    icon: <CloudOff className="h-4 w-4 text-slate-600" aria-hidden="true" />,
  },
  STALE: {
    container: "border-amber-300 bg-amber-50",
    badge: "border-amber-300 bg-white text-amber-800",
    icon: <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />,
  },
  SYNCING: {
    container: "border-blue-200 bg-blue-50/70",
    badge: "border-blue-200 bg-white text-blue-700",
    icon: <RotateCw className="h-4 w-4 animate-spin text-blue-700" aria-hidden="true" />,
  },
  ACTION_REQUIRED: {
    container: "border-rose-300 bg-rose-50",
    badge: "border-rose-300 bg-white text-rose-700",
    icon: <AlertTriangle className="h-4 w-4 text-rose-700" aria-hidden="true" />,
  },
};

export const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({
  status,
  lastSyncAt = null,
  advisoryValidity = null,
  pendingSyncCount = 0,
  staleReason = null,
  actionRequiredMessage = null,
  onOpenSyncQueue,
  compact = false,
  className = "",
}) => {
  const { language } = useLanguage();
  const [browserOnline, setBrowserOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => setBrowserOnline(window.navigator.onLine);
    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const effectiveStatus = useMemo<ConnectivityState>(() => {
    if (status) return status;

    if (browserOnline === false) return "OFFLINE";
    return "ONLINE";
  }, [status, browserOnline]);

  const labels: Record<ConnectivityState, { en: string; fil: string }> = {
    ONLINE: { en: "Online", fil: "Online" },
    OFFLINE: { en: "Offline", fil: "Offline" },
    STALE: { en: "Stale / Outdated", fil: "Luma / Hindi Napapanahon" },
    SYNCING: { en: "Syncing", fil: "Nagsi-sync" },
    ACTION_REQUIRED: { en: "Action Required", fil: "Kailangang Aksyon" },
  };

  const descriptions: Record<ConnectivityState, { en: string; fil: string }> = {
    ONLINE: {
      en: "Connected to the internet. Check the last data sync and advisory validity before relying on operational information.",
      fil: "May internet connection. Tingnan ang huling data sync at validity ng advisory bago gamitin ang impormasyon para sa operational decisions.",
    },
    OFFLINE: {
      en: "No usable internet connection. Use only previously synchronized data and clearly marked cached records.",
      fil: "Walang magamit na internet connection. Gamitin lamang ang dating synchronized data at malinaw na marked cached records.",
    },
    STALE: {
      en: "Cached operational information may be outdated. Do not treat it as current until verified.",
      fil: "Maaaring luma na ang cached operational information. Huwag itong ituring na kasalukuyan hangga't hindi nabeberipika.",
    },
    SYNCING: {
      en: "Connectivity has returned and pending records are being reconciled.",
      fil: "Bumalik ang koneksyon at kasalukuyang nire-reconcile ang pending records.",
    },
    ACTION_REQUIRED: {
      en: "A synchronization, verification, or conflict issue needs authorized review.",
      fil: "May synchronization, verification, o conflict issue na nangangailangan ng awtorisadong review.",
    },
  };

  const meta = statusStyles[effectiveStatus];
  const label = labels[effectiveStatus][language];
  const description = descriptions[effectiveStatus][language];

  if (compact) {
    return (
      <div
        className={`inline-flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${meta.container} ${className}`}
        role="status"
        aria-live="polite"
      >
        {meta.icon}
        <span className="text-xs font-bold text-slate-800">{label}</span>
        <HelpTooltip
          content={getHelpContent("onlineStatus", language)}
          align="right"
        />

        {lastSyncAt ? (
          <>
            <span className="text-slate-300" aria-hidden="true">•</span>
            <span className="text-[11px] text-slate-500">
              {language === "en" ? "Last sync" : "Huling sync"}: {lastSyncAt}
            </span>
          </>
        ) : null}

        {pendingSyncCount > 0 ? (
          <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold text-blue-700">
            {pendingSyncCount} {language === "en" ? "Pending Sync" : "Pending Sync"}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${meta.container} ${className}`}
      aria-label={language === "en" ? "Connection and data freshness status" : "Kalagayan ng koneksyon at pagiging bago ng data"}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {meta.icon}

            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}
            >
              {label}
            </span>

            <HelpTooltip
              content={getHelpContent("onlineStatus", language)}
              align="left"
            />

            {pendingSyncCount > 0 ? (
              <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                {pendingSyncCount} {language === "en" ? "Pending Sync" : "Pending Sync"}
              </span>
            ) : null}
          </div>

          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-700">
            {description}
          </p>

          {effectiveStatus === "STALE" && staleReason ? (
            <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-white/80 p-3 text-xs leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{staleReason}</span>
            </div>
          ) : null}

          {effectiveStatus === "ACTION_REQUIRED" && actionRequiredMessage ? (
            <div className="mt-3 flex gap-2 rounded-xl border border-rose-200 bg-white/80 p-3 text-xs leading-relaxed text-rose-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{actionRequiredMessage}</span>
            </div>
          ) : null}
        </div>

        {onOpenSyncQueue ? (
          <button
            type="button"
            onClick={onOpenSyncQueue}
            className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {language === "en" ? "View Sync Queue" : "Tingnan ang Sync Queue"}
          </button>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/80 bg-white/70 p-3">
          <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>{language === "en" ? "Internet Connection" : "Koneksyon sa Internet"}</span>
            <HelpTooltip
              content={getHelpContent("onlineStatus", language)}
              align="left"
            />
          </dt>
          <dd className="mt-1 text-xs font-semibold text-slate-800">{label}</dd>
        </div>

        <div className="rounded-xl border border-white/80 bg-white/70 p-3">
          <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>{language === "en" ? "Last Data Sync" : "Huling Data Sync"}</span>
            <HelpTooltip
              content={getHelpContent("lastDataSync", language)}
              align="center"
            />
          </dt>
          <dd className="mt-1 text-xs font-semibold text-slate-800">
            {lastSyncAt ?? (language === "en" ? "Not available" : "Hindi available")}
          </dd>
        </div>

        <div className="rounded-xl border border-white/80 bg-white/70 p-3">
          <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>
              {language === "en" ? "Advisory Valid Until" : "Balido ang Advisory Hanggang"}
            </span>
            <HelpTooltip
              content={getHelpContent("advisoryValidUntil", language)}
              align="right"
            />
          </dt>
          <dd className="mt-1 text-xs font-semibold text-slate-800">
            {advisoryValidity ?? (language === "en" ? "Not available" : "Hindi available")}
          </dd>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
        <Cloud className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          {language === "en"
            ? "Internet connection alone does not guarantee that the displayed information is current. Check the last data sync and advisory validity before using the information for operational decisions."
            : "Ang internet connection lamang ay hindi garantiya na kasalukuyan ang ipinapakitang impormasyon. Tingnan ang huling data sync at validity ng advisory bago ito gamitin sa operational decisions."}
        </span>
      </p>
    </section>
  );
};
