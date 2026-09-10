"use client";

import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Baby,
  CheckCircle2,
  Home,
  PawPrint,
  Pill,
  Printer,
  Radio,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { getHelpContent } from "@/lib/help-content";

export type HouseholdMode = "code" | "quick-profile" | "generic";

export interface HouseholdQuickProfile {
  barangay: string;
  householdSize: number | null;
  hasInfantOrChild: boolean;
  hasOlderPerson: boolean;
  hasPwdOrMobilityLimitation: boolean;
  hasEssentialMedicineNeed: boolean;
  hasPets: boolean;
  housingCharacteristics: string;
  communicationMethods: string[];
}

export interface HouseholdCardOutput {
  barangay: string;
  householdCode?: string | null;
  advisoryTitle: string | null;
  advisoryReference: string | null;
  advisoryValidity: string | null;
  advisoryVerificationState: "UNVERIFIED" | "FOR_REVIEW" | "VERIFIED" | "STALE" | "PENDING";
  generatedAt: string | null;
  lastSyncAt: string | null;
  languageLabel: string | null;
  actions: Array<{
    id: string;
    title: string;
    explanation: string;
    sourceRule: string | null;
  }>;
  limitations?: string[];
}

export interface HouseholdActionCardProps {
  barangays: string[];
  initialBarangay?: string;
  lockedBarangay?: string;
  requireBarangaySelection?: boolean;
  output?: HouseholdCardOutput | null;
  isGenerating?: boolean;
  onGenerateByCode?: (householdCode: string) => void | Promise<void>;
  onGenerateQuickProfile?: (profile: HouseholdQuickProfile) => void | Promise<void>;
  onGenerateGeneric?: (barangay: string) => void | Promise<void>;
  className?: string;
}

const COMMUNICATION_OPTIONS = ["SMS", "Mobile Internet", "Radio", "Barangay Announcements"];

function formatHouseholdDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

function householdRuleReference(value: string | null | undefined) {
  if (!value) return { id: "—", source: "—" };
  const match = value.match(/^([^\s(]+)\s*\((.+)\)$/);
  if (match) return { id: match[1], source: match[2] };
  const [id, ...source] = value.split(" · ");
  return { id: id?.trim() || "—", source: source.join(" · ").trim() || "—" };
}

export const HouseholdActionCard: React.FC<HouseholdActionCardProps> = ({
  barangays,
  initialBarangay,
  lockedBarangay,
  requireBarangaySelection = false,
  output = null,
  isGenerating = false,
  onGenerateByCode,
  onGenerateQuickProfile,
  onGenerateGeneric,
  className = "",
}) => {
  const { language } = useLanguage();
  const printableCardRef = useRef<HTMLDivElement>(null);

  const defaultBarangay = useMemo(
    () =>
      lockedBarangay ??
      initialBarangay ??
      (requireBarangaySelection ? "" : barangays[0] ?? ""),
    [lockedBarangay, initialBarangay, requireBarangaySelection, barangays]
  );

  const [mode, setMode] = useState<HouseholdMode>("code");
  const [householdCode, setHouseholdCode] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState(defaultBarangay);
  const [householdSize, setHouseholdSize] = useState("");
  const [hasInfantOrChild, setHasInfantOrChild] = useState(false);
  const [hasOlderPerson, setHasOlderPerson] = useState(false);
  const [hasPwdOrMobilityLimitation, setHasPwdOrMobilityLimitation] = useState(false);
  const [hasEssentialMedicineNeed, setHasEssentialMedicineNeed] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [housingCharacteristics, setHousingCharacteristics] = useState("");
  const [communicationMethods, setCommunicationMethods] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (lockedBarangay) {
      setSelectedBarangay(lockedBarangay);
    }
  }, [lockedBarangay]);
  useEffect(() => {
    if (!selectedBarangay && barangays.length > 0 && !lockedBarangay) {
      setSelectedBarangay(barangays[0]);
    }
  }, [barangays, lockedBarangay, selectedBarangay]);

  const toggleCommunicationMethod = (value: string) => {
    setCommunicationMethods((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    const cleanCode = householdCode.trim();

    if (!cleanCode) {
      setFormError(
        language === "en"
          ? "Enter a household code before continuing."
          : "Ilagay muna ang household code bago magpatuloy."
      );
      return;
    }

    if (!onGenerateByCode) {
      setFormError(
        language === "en"
          ? "Household Code lookup is not available yet. Please try another option or try again later."
          : "Hindi pa available ang Household Code lookup. Gumamit muna ng ibang option o subukan muli mamaya."
      );
      return;
    }

    await onGenerateByCode(cleanCode);
  };

  const submitQuickProfile = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!selectedBarangay) {
      setFormError(
        language === "en"
          ? "Select a barangay before continuing."
          : "Pumili muna ng barangay bago magpatuloy."
      );
      return;
    }

    const parsedSize = householdSize.trim() ? Number(householdSize) : null;

    if (parsedSize !== null && (!Number.isFinite(parsedSize) || parsedSize < 1)) {
      setFormError(
        language === "en"
          ? "Household size must be at least 1."
          : "Ang household size ay dapat hindi bababa sa 1."
      );
      return;
    }

    if (!onGenerateQuickProfile) {
      setFormError(
        language === "en"
          ? "Quick Household Profile is not available yet. Please try another option or try again later."
          : "Hindi pa available ang Quick Household Profile. Gumamit muna ng ibang option o subukan muli mamaya."
      );
      return;
    }

    await onGenerateQuickProfile({
      barangay: selectedBarangay,
      householdSize: parsedSize,
      hasInfantOrChild,
      hasOlderPerson,
      hasPwdOrMobilityLimitation,
      hasEssentialMedicineNeed,
      hasPets,
      housingCharacteristics: housingCharacteristics.trim(),
      communicationMethods,
    });
  };

  const submitGeneric = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!selectedBarangay) {
      setFormError(
        language === "en"
          ? "Select a barangay before continuing."
          : "Pumili muna ng barangay bago magpatuloy."
      );
      return;
    }

    if (!onGenerateGeneric) {
      setFormError(
        language === "en"
          ? "The general barangay preparedness card is not available yet. Please try again later."
          : "Hindi pa available ang general barangay preparedness card. Subukan muli mamaya."
      );
      return;
    }

    await onGenerateGeneric(selectedBarangay);
  };

  const printHouseholdCard = () => {
    if (!output || !printableCardRef.current || typeof window === "undefined") return;

    const printWindow = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=900,height=800"
    );

    if (!printWindow) {
      window.print();
      return;
    }

    const styles = Array.from(
      document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
        'link[rel="stylesheet"], style'
      )
    )
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Project AGAP - Household Action Card - ${output.barangay}</title>
          ${styles}
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: #ffffff;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }

            .agap-household-print-card {
              max-width: 780px !important;
              margin: 0 auto !important;
              border: 0 !important;
              box-shadow: none !important;
            }

            .agap-household-print-hide {
              display: none !important;
            }

            @page {
              size: auto;
              margin: 14mm;
            }
          </style>
        </head>
        <body>
          ${printableCardRef.current.outerHTML}
          <script>
            window.onload = function () {
              window.focus();
              window.print();
              window.onafterprint = function () {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const modes: Array<{
    id: HouseholdMode;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "code",
      title: language === "en" ? "Household Code" : "Household Code",
      description:
        language === "en"
          ? "Use this option if your barangay gave your household a code."
          : "Gamitin ito kung binigyan ng barangay ng code ang inyong household.",
      icon: <UserRound className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: "quick-profile",
      title: language === "en" ? "Quick Household Profile" : "Quick Household Profile",
      description:
        language === "en"
          ? "Answer a few questions so AGAP can prepare guidance that fits your household."
          : "Sagutin ang ilang tanong upang makapaghanda ang AGAP ng gabay na akma sa inyong household.",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: "generic",
      title:
        language === "en"
          ? "General Barangay Preparedness Card"
          : "Pangkalahatang Barangay Preparedness Card",
      description:
        language === "en"
          ? "Get general preparedness guidance without answering household questions."
          : "Kumuha ng pangkalahatang preparedness guidance nang hindi sumasagot ng household questions.",
      icon: <Home className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <header>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
          {language === "en" ? "Household Preparedness Guide" : "Gabay sa Paghahanda ng Household"}
        </span>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {language === "en" ? "Household Action Card" : "Household Action Card"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          {language === "en"
            ? "Choose how you want AGAP to prepare guidance for your household. You do not need to enter your name or exact home address."
            : "Piliin kung paano ihahanda ng AGAP ang gabay para sa inyong household. Hindi kailangang ilagay ang pangalan o eksaktong address ng tahanan."}
        </p>
      </header>

      {/* Mode selector */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3" aria-label="Household card modes">
        {modes.map((item) => {
          const active = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id);
                setFormError("");
              }}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                active
                  ? "border-blue-300 bg-blue-50/70"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
              aria-pressed={active}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {item.icon}
              </div>
              <h2 className="mt-3 text-sm font-bold text-slate-900">{item.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
            </button>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Input */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          {mode === "code" && (
            <form onSubmit={submitCode} className="space-y-5">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-slate-900">
                    {language === "en" ? "Enter Household Code" : "Ilagay ang Household Code"}
                  </h2>
                  <HelpTooltip
                    content={getHelpContent("householdCode", language)}
                    align="left"
                  />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {language === "en"
                    ? "Enter the code issued by your barangay. It lets AGAP use basic household preparedness information without asking for your name or exact address."
                    : "Ilagay ang code na ibinigay ng barangay. Ginagamit ito ng AGAP para sa basic household preparedness information nang hindi hinihingi ang pangalan o eksaktong address."}
                </p>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  {language === "en" ? "Household Code" : "Household Code"}
                </span>
                <input
                  type="text"
                  value={householdCode}
                  onChange={(event) => setHouseholdCode(event.target.value)}
                  placeholder="e.g. DLH-P03-HH0048"
                  autoComplete="off"
                  className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  {isGenerating
                    ? language === "en"
                      ? "Preparing..."
                      : "Inihahanda..."
                    : language === "en"
                      ? "Continue"
                      : "Magpatuloy"}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}

          {mode === "quick-profile" && (
            <form onSubmit={submitQuickProfile} className="space-y-5">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-slate-900">
                    {language === "en" ? "Quick Household Profile" : "Quick Household Profile"}
                  </h2>
                  <HelpTooltip
                    content={getHelpContent("quickHouseholdProfile", language)}
                    align="left"
                  />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {language === "en"
                    ? "Answer only the questions needed to prepare relevant household guidance. Your name and exact address are not required."
                    : "Sagutin lamang ang mga tanong na kailangan para sa relevant household guidance. Hindi kailangan ang pangalan o eksaktong address."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {lockedBarangay ? (
                  <div>
                    <span className="text-xs font-bold text-slate-700">
                      {language === "en" ? "Barangay" : "Barangay"}
                    </span>
                    <div className="mt-2 flex min-h-[44px] items-center rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 text-sm font-semibold text-blue-900">
                      Barangay {lockedBarangay}
                    </div>
                  </div>
                ) : (
                  <label>
                    <span className="text-xs font-bold text-slate-700">
                      {language === "en" ? "Barangay" : "Barangay"}
                    </span>
                    <select
                      value={selectedBarangay}
                      onChange={(event) => setSelectedBarangay(event.target.value)}
                      className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        {language === "en" ? "Select barangay" : "Pumili ng barangay"}
                      </option>
                      {barangays.map((barangay) => (
                        <option key={barangay} value={barangay}>
                          {barangay}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  <span className="text-xs font-bold text-slate-700">
                    {language === "en" ? "Household Size" : "Bilang ng Tao sa Tahanan"}
                  </span>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={householdSize}
                    onChange={(event) => setHouseholdSize(event.target.value)}
                    placeholder="e.g. 5"
                    className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <fieldset>
                <legend className="text-xs font-bold text-slate-700">
                  {language === "en"
                    ? "Household Members and Special Needs"
                    : "Household Members at Special Needs"}
                </legend>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    {
                      checked: hasInfantOrChild,
                      setChecked: setHasInfantOrChild,
                      label: language === "en" ? "Infant or child" : "Sanggol o bata",
                      icon: <Baby className="h-4 w-4" aria-hidden="true" />,
                    },
                    {
                      checked: hasOlderPerson,
                      setChecked: setHasOlderPerson,
                      label: language === "en" ? "Older person" : "Nakatatanda",
                      icon: <Users className="h-4 w-4" aria-hidden="true" />,
                    },
                    {
                      checked: hasPwdOrMobilityLimitation,
                      setChecked: setHasPwdOrMobilityLimitation,
                      label:
                        language === "en"
                          ? "PWD or mobility limitation"
                          : "PWD o may limitasyon sa paggalaw",
                      icon: <UserRound className="h-4 w-4" aria-hidden="true" />,
                    },
                    {
                      checked: hasEssentialMedicineNeed,
                      setChecked: setHasEssentialMedicineNeed,
                      label:
                        language === "en"
                          ? "Essential medicine need"
                          : "May mahalagang gamot na kailangan",
                      icon: <Pill className="h-4 w-4" aria-hidden="true" />,
                    },
                    {
                      checked: hasPets,
                      setChecked: setHasPets,
                      label: language === "en" ? "Pets" : "May alagang hayop",
                      icon: <PawPrint className="h-4 w-4" aria-hidden="true" />,
                    },
                  ].map((item) => (
                    <label
                      key={item.label}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(event) => item.setChecked(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <span className="text-slate-500">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  {language === "en" ? "Home / Housing Information" : "Impormasyon tungkol sa Tahanan"}
                </span>
                <textarea
                  value={housingCharacteristics}
                  onChange={(event) => setHousingCharacteristics(event.target.value)}
                  rows={3}
                  placeholder={
                    language === "en"
                      ? "Optional: add any home condition that may affect disaster preparedness."
                      : "Opsyonal: ilagay ang kondisyon ng tahanan na maaaring makaapekto sa disaster preparedness."
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <fieldset>
                <legend className="text-xs font-bold text-slate-700">
                  {language === "en" ? "Ways You Can Receive Updates" : "Paraan ng Pagtanggap ng Updates"}
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {COMMUNICATION_OPTIONS.map((item) => {
                    const active = communicationMethods.includes(item);

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleCommunicationMethod(item)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                        aria-pressed={active}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  {isGenerating
                    ? language === "en"
                      ? "Preparing..."
                      : "Inihahanda..."
                    : language === "en"
                      ? "Prepare Household Card"
                      : "Ihanda ang Household Card"}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}

          {mode === "generic" && (
            <form onSubmit={submitGeneric} className="space-y-5">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-slate-900">
                    {language === "en"
                      ? "General Barangay Preparedness Card"
                      : "Pangkalahatang Barangay Preparedness Card"}
                  </h2>
                  <HelpTooltip
                    content={getHelpContent("genericBarangayCard", language)}
                    align="left"
                  />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {language === "en"
                    ? lockedBarangay
                      ? `General preparedness guidance for Barangay ${lockedBarangay}. This option does not ask for household details.`
                      : "Choose your barangay to receive general preparedness guidance. This option does not ask for household details."
                    : lockedBarangay
                      ? `Pangkalahatang preparedness guidance para sa Barangay ${lockedBarangay}. Hindi humihingi ang option na ito ng household details.`
                      : "Piliin ang inyong barangay upang makatanggap ng pangkalahatang preparedness guidance. Hindi humihingi ang option na ito ng household details."}
                </p>
              </div>

              {lockedBarangay ? (
                <div>
                  <span className="text-xs font-bold text-slate-700">
                    {language === "en" ? "Barangay" : "Barangay"}
                  </span>
                  <div className="mt-2 flex min-h-[44px] items-center rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 text-sm font-semibold text-blue-900">
                    Barangay {lockedBarangay}
                  </div>
                </div>
              ) : (
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">
                    {language === "en" ? "Barangay" : "Barangay"}
                  </span>
                  <select
                    value={selectedBarangay}
                    onChange={(event) => setSelectedBarangay(event.target.value)}
                    className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      {language === "en" ? "Select barangay" : "Pumili ng barangay"}
                    </option>
                    {barangays.map((barangay) => (
                      <option key={barangay} value={barangay}>
                        {barangay}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  {isGenerating
                    ? language === "en"
                      ? "Preparing..."
                      : "Inihahanda..."
                    : language === "en"
                      ? "Prepare Barangay Card"
                      : "Ihanda ang Barangay Card"}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}

          {formError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900"
            >
              {formError}
            </div>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
            <HelpTooltip
              content={getHelpContent("householdPrivacy", language)}
              align="left"
            />
            <p className="text-xs leading-relaxed text-blue-900">
              {language === "en"
                ? "Privacy: your full name and exact home address are not required."
                : "Privacy: hindi kailangan ang buong pangalan at eksaktong address ng tahanan."}
            </p>
          </div>
        </section>

        {/* Output */}
        <section
          ref={printableCardRef}
          className="agap-household-print-card rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-900">
                {language === "en" ? "Your Household Preparedness Card" : "Inyong Household Preparedness Card"}
              </h2>
            </div>

            <button
              type="button"
              onClick={printHouseholdCard}
              disabled={!output}
              className="agap-household-print-hide inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              {language === "en" ? "Print Card" : "I-print ang Card"}
            </button>
          </div>

          {!output ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                  <Radio className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-800">
                  {language === "en" ? "Your preparedness card will appear here" : "Dito lalabas ang inyong preparedness card"}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {language === "en"
                    ? "Complete one of the options on the left to prepare your household guidance."
                    : "Kumpletuhin ang isa sa mga option sa kaliwa upang maihanda ang inyong household guidance."}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="hidden print:block">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                  Project AGAP
                </span>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {language === "en" ? "Household Action Card" : "Household Action Card"}
                </h3>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === "en" ? "Barangay" : "Barangay"}
                </span>
                <h3 className="mt-1 text-lg font-black text-slate-900">{output.barangay}</h3>
                {output.householdCode ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Household Code: {output.householdCode}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {language === "en"
                        ? "Official Advisory Information"
                        : "Impormasyon ng Opisyal na Advisory"}
                    </span>
                    <HelpTooltip
                      content={getHelpContent("advisoryVerificationStatus", language)}
                      align="left"
                      className="agap-household-print-hide"
                    />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {output.advisoryTitle ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {output.advisoryReference ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {language === "en" ? "Advisory Valid Until" : "Balido ang Advisory Hanggang"}
                    </span>
                    <HelpTooltip
                      content={getHelpContent("advisoryValidUntil", language)}
                      align="right"
                      className="agap-household-print-hide"
                    />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatHouseholdDateTime(output.advisoryValidity)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {output.advisoryVerificationState.replaceAll("_", " ")}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {language === "en"
                      ? "Approved Preparedness Actions"
                      : "Approved Preparedness Actions"}
                  </h3>
                  <HelpTooltip
                    content={getHelpContent("approvedPreparednessActions", language)}
                    align="left"
                    className="agap-household-print-hide"
                  />
                </div>

                {output.actions.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {output.actions.map((action) => {
                      const rule = householdRuleReference(action.sourceRule);
                      return (
                        <article
                          key={action.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex gap-3">
                            <CheckCircle2
                              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                              aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold leading-relaxed text-slate-900">
                                {action.title}
                              </h4>
                              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                {action.explanation}
                              </p>
                              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                <span className="font-semibold text-slate-900">
                                  {language === "en" ? "Guidance rule: " : "Guidance rule: "}
                                </span>
                                {rule.id}
                              </div>
                              {rule.source !== "—" ? (
                                <details className="agap-household-print-hide mt-2 text-xs">
                                  <summary className="cursor-pointer font-semibold text-blue-700">
                                    {language === "en" ? "View source details" : "Tingnan ang source details"}
                                  </summary>
                                  <p className="mt-2 break-words rounded-lg border border-slate-200 bg-slate-50 p-3 leading-relaxed text-slate-600">
                                    {rule.source}
                                  </p>
                                </details>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
                    <p className="text-xs text-slate-500">
                      {language === "en"
                        ? "No approved preparedness actions are available yet."
                        : "Wala pang available na approved preparedness actions."}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === "en" ? "Card Prepared" : "Oras ng Paghahanda ng Card"}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {formatHouseholdDateTime(output.generatedAt)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {language === "en" ? "Last Data Sync" : "Huling Data Sync"}
                    </span>
                    <HelpTooltip
                      content={getHelpContent("lastDataSync", language)}
                      align="right"
                      className="agap-household-print-hide"
                    />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {output.lastSyncAt ? formatHouseholdDateTime(output.lastSyncAt) : (language === "en" ? "Not available" : "Hindi available")}
                  </p>
                </div>
              </div>

              {output.limitations && output.limitations.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-xs font-bold text-amber-900">
                    {language === "en" ? "Important Limitations" : "Mahahalagang Limitasyon"}
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-amber-900">
                    {output.limitations.map((item, index) => (
                      <li key={`${item}-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
