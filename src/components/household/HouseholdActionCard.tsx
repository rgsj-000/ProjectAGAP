"use client";

import React, { FormEvent, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Baby,
  CheckCircle2,
  Home,
  Info,
  PawPrint,
  Pill,
  Printer,
  Radio,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

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
  output?: HouseholdCardOutput | null;
  isGenerating?: boolean;
  onGenerateByCode?: (householdCode: string) => void | Promise<void>;
  onGenerateQuickProfile?: (profile: HouseholdQuickProfile) => void | Promise<void>;
  onGenerateGeneric?: (barangay: string) => void | Promise<void>;
  className?: string;
}

const COMMUNICATION_OPTIONS = ["SMS", "Mobile Internet", "Radio", "Barangay Announcements"];

export const HouseholdActionCard: React.FC<HouseholdActionCardProps> = ({
  barangays,
  initialBarangay,
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
    () => initialBarangay ?? barangays[0] ?? "",
    [initialBarangay, barangays]
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
          ? "Household-code lookup is not connected to the backend yet."
          : "Hindi pa nakakonekta sa backend ang household-code lookup."
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
          ? "Quick-profile generation is not connected to the backend yet."
          : "Hindi pa nakakonekta sa backend ang quick-profile generation."
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
          ? "Generic barangay card generation is not connected to the backend yet."
          : "Hindi pa nakakonekta sa backend ang generic barangay card generation."
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
          ? "Use a pseudonymous household code when one has been issued."
          : "Gumamit ng pseudonymous household code kung mayroon nang naibigay.",
      icon: <UserRound className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: "quick-profile",
      title: language === "en" ? "Quick Household Profile" : "Quick Household Profile",
      description:
        language === "en"
          ? "Answer a short preparedness profile without providing a name or exact address."
          : "Sagutan ang maikling preparedness profile nang walang pangalan o eksaktong address.",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: "generic",
      title: language === "en" ? "Generic Barangay Card" : "Generic Barangay Card",
      description:
        language === "en"
          ? "Receive general barangay guidance without household characteristics."
          : "Tumanggap ng pangkalahatang gabay ng barangay nang walang household characteristics.",
      icon: <Home className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <header>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
          {language === "en" ? "Public Preparedness Output" : "Pampublikong Gabay sa Paghahanda"}
        </span>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {language === "en" ? "Household Action Card" : "Household Action Card"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          {language === "en"
            ? "Choose how you want AGAP to prepare household guidance. Names and exact home addresses are not required for the MVP."
            : "Piliin kung paano ihahanda ng AGAP ang household guidance. Hindi kailangan ang pangalan o eksaktong address ng tahanan para sa MVP."}
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
                <h2 className="text-base font-bold text-slate-900">
                  {language === "en" ? "Enter Household Code" : "Ilagay ang Household Code"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {language === "en"
                    ? "Use the pseudonymous code issued by the barangay. The code should link only to the minimum preparedness profile required by AGAP."
                    : "Gamitin ang pseudonymous code na ibinigay ng barangay. Dapat naka-link lamang ito sa minimum preparedness profile na kailangan ng AGAP."}
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
                <h2 className="text-base font-bold text-slate-900">
                  {language === "en" ? "Quick Household Profile" : "Quick Household Profile"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {language === "en"
                    ? "Provide only the preparedness characteristics needed to match approved household actions."
                    : "Ibigay lamang ang preparedness characteristics na kailangan para ma-match ang approved household actions."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    ? "Household Preparedness Characteristics"
                    : "Household Preparedness Characteristics"}
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
                  {language === "en" ? "Housing Characteristics" : "Katangian ng Tahanan"}
                </span>
                <textarea
                  value={housingCharacteristics}
                  onChange={(event) => setHousingCharacteristics(event.target.value)}
                  rows={3}
                  placeholder={
                    language === "en"
                      ? "Optional brief description relevant to preparedness"
                      : "Opsyonal na maikling paglalarawan na may kaugnayan sa paghahanda"
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <fieldset>
                <legend className="text-xs font-bold text-slate-700">
                  {language === "en" ? "Communication Methods" : "Paraan ng Komunikasyon"}
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
                <h2 className="text-base font-bold text-slate-900">
                  {language === "en" ? "Generic Barangay Card" : "Generic Barangay Card"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {language === "en"
                    ? "Choose a barangay to receive general guidance based only on the verified advisory and approved general actions."
                    : "Pumili ng barangay upang makatanggap ng pangkalahatang gabay batay lamang sa verified advisory at approved general actions."}
                </p>
              </div>

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
                      ? "Prepare Generic Card"
                      : "Ihanda ang Generic Card"}
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

          <div className="mt-5 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-blue-900">
              {language === "en"
                ? "Privacy: the MVP does not require a resident name or exact address. If authoritative household-level spatial data are unavailable, the card must not claim that a specific home will be affected."
                : "Privacy: hindi kailangan ng MVP ang pangalan ng residente o eksaktong address. Kung walang authoritative household-level spatial data, hindi dapat sabihin ng card na tiyak na maaapektuhan ang isang partikular na tahanan."}
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
                {language === "en" ? "Preparedness Card Preview" : "Preview ng Preparedness Card"}
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
                  {language === "en" ? "No household card generated yet" : "Wala pang nagagawang household card"}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {language === "en"
                    ? "Verified advisory content and approved action rules will appear here after the generation handler is connected."
                    : "Lalabas dito ang verified advisory content at approved action rules kapag nakakonekta na ang generation handler."}
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === "en" ? "Verified Advisory" : "Verified Advisory"}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {output.advisoryTitle ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {output.advisoryReference ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === "en" ? "Advisory Validity" : "Advisory Validity"}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {output.advisoryValidity ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {output.advisoryVerificationState.replaceAll("_", " ")}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "en" ? "Approved Preparedness Actions" : "Approved Preparedness Actions"}
                </h3>

                {output.actions.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {output.actions.map((action) => (
                      <article
                        key={action.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex gap-3">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            aria-hidden="true"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {action.title}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              {action.explanation}
                            </p>
                            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {language === "en" ? "Source Rule" : "Source Rule"}:{" "}
                              {action.sourceRule ?? "—"}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
                    <p className="text-xs text-slate-500">
                      {language === "en"
                        ? "No approved actions were supplied."
                        : "Walang approved actions na ibinigay."}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === "en" ? "Generated" : "Nagawa"}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {output.generatedAt ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === "en" ? "Last Synchronization" : "Huling Synchronization"}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {output.lastSyncAt ?? "—"}
                  </p>
                </div>
              </div>

              {output.limitations && output.limitations.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-xs font-bold text-amber-900">
                    {language === "en" ? "Limitations" : "Mga Limitasyon"}
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
