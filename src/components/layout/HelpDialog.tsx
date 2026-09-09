"use client";

import React, { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useNavigation } from "@/context/NavigationContext";
import { LUCENA_EMERGENCY_CONTACTS } from "@/lib/mock-data"
import {
  PhoneCall,
  ShieldAlert,
  HelpCircle,
  X,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

interface HelpDialogProps {
  audience?: "auto" | "public";
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ audience = "auto" }) => {
  const { isHelpOpen, setIsHelpOpen, isPublicUser } = useNavigation();
  const { language, t } = useLanguage();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isHelpOpen) {
        setIsHelpOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHelpOpen, setIsHelpOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isHelpOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isHelpOpen]);

  if (!isHelpOpen) return null;


  const isPublicAudience = audience === "public" || isPublicUser;

  if (isPublicAudience) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4"
        onClick={() => setIsHelpOpen(false)}
      >
        <div
          className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
            <div>
              <h2 id="help-dialog-title" className="text-lg font-bold">
                {language === "en" ? "Help & Emergency" : "Tulong at Emergency"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-300">
                {language === "en"
                  ? "Household preparedness support for Lucena City"
                  : "Household preparedness support para sa Lucena City"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {language === "en" ? "Use official instructions" : "Sundin ang official instructions"}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  {language === "en"
                    ? "Project AGAP does not issue forecasts, warnings, evacuation orders, or safety declarations. Confirm the latest instructions from PAGASA, Lucena CDRRMO, your barangay, or other authorized agencies."
                    : "Hindi naglalabas ang Project AGAP ng forecast, warning, evacuation order, o safety declaration. Kumpirmahin ang pinakabagong instructions mula sa PAGASA, Lucena CDRRMO, inyong barangay, o ibang authorized agencies."}
                </p>
              </div>
            </div>

            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
                {language === "en" ? "Using the Household Action Card" : "Paggamit ng Household Action Card"}
              </h3>
              <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
                <p>
                  {language === "en"
                    ? "Use a Household Code if your barangay issued one, complete a Quick Household Profile, or choose the General Barangay Preparedness Card."
                    : "Gumamit ng Household Code kung may ibinigay ang barangay, kumpletuhin ang Quick Household Profile, o piliin ang General Barangay Preparedness Card."}
                </p>
                <p>
                  {language === "en"
                    ? "Your full name and exact home address are not required for the MVP."
                    : "Hindi kailangan ang buong pangalan at eksaktong home address para sa MVP."}
                </p>
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <PhoneCall className="h-4 w-4 text-red-600" aria-hidden="true" />
                {language === "en" ? "Emergency Contacts" : "Emergency Contacts"}
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-2.5">
                {LUCENA_EMERGENCY_CONTACTS.map((contact, index) => {
                  const hasNumber =
                    Boolean(contact.contactNumber) &&
                    contact.contactNumber.trim() !== "—";

                  return (
                    <div
                      key={`${contact.agencyEn}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-xs font-bold text-slate-900">
                        {language === "en" ? contact.agencyEn : contact.agencyFil}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {language === "en" ? contact.descriptionEn : contact.descriptionFil}
                      </p>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-200/70 pt-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {hasNumber
                            ? contact.contactNumber
                            : language === "en"
                              ? "Official number not yet verified in AGAP"
                              : "Hindi pa verified sa AGAP ang official number"}
                        </span>
                        {hasNumber ? (
                          <a
                            href={`tel:${contact.contactNumber.replace(/[^0-9+]/g, "")}`}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700"
                          >
                            {language === "en" ? "Call" : "Tawagan"}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-100 px-5 py-3.5">
            <span className="text-xs text-slate-500">
              {language === "en" ? "Project AGAP Public Preparedness" : "Project AGAP Public Preparedness"}
            </span>
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="help-dialog-title" className="text-lg font-bold">
                {language === "en" ? "Help & Emergency Support" : "Tulong at Serbisyong Pang-emergency"}
              </h2>
              <p className="text-xs text-slate-300">
                {language === "en"
                  ? "Lucena City Disaster Operations & AGAP Guide"
                  : "Operasyon sa Sakuna ng Lucena at Gabay sa AGAP"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsHelpOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label={t("close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Important Mandate Disclaimer */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3.5 items-start">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900 text-sm">
                {language === "en"
                  ? "Official Authority & Mandate Notice"
                  : "Paunawa Ukol sa Opisyal na Kapangyarihan"}
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                {language === "en"
                  ? "Project AGAP does NOT predict disasters and does NOT replace PAGASA, DOST, Lucena CDRRMO, or National authorities. AGAP assists local officials in organizing verified official advisories and local barangay data to prioritize emergency actions."
                  : "Ang Project AGAP ay HINDI naghuhula ng kalamidad at HINDI pamalit sa mga abiso ng PAGASA, DOST, Lucena CDRRMO, o pambansang ahensya. Tinutulungan lamang nito ang mga opisyal na isaayos ang beripikadong ulat at datos ng barangay upang maunang tugunan ang higit na nangangailangan."}
              </p>
            </div>
          </div>

          {/* Emergency Hotlines Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-red-600" aria-hidden="true" />
                <span>{language === "en" ? "Lucena City Emergency Hotlines" : "Mga Hotline sa Lungsod ng Lucena"}</span>
              </h3>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700">
                24/7 Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LUCENA_EMERGENCY_CONTACTS.map((contact, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    contact.isPrimary
                      ? "bg-red-50/70 border-red-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {language === "en" ? contact.agencyEn : contact.agencyFil}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {language === "en" ? contact.descriptionEn : contact.descriptionFil}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {contact.contactNumber}
                    </span>
                    <a
                      href={`tel:${contact.contactNumber.replace(/[^0-9+]/g, "")}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs"
                    >
                      <span>{language === "en" ? "Call" : "Tawagan"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Color & Label Legend */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span>{language === "en" ? "Priority Level Guide" : "Gabay sa Antas ng Priyoridad"}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {language === "en"
                ? "AGAP always pairs colors with written labels to ensure accessibility across all screens."
                : "Laging may kasamang malinaw na teksto ang bawat kulay upang madaling maunawaan sa anumang telepono o screen."}
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-900">
                <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                      {language === "en" ? "Very High / Urgent" : "Napakataas / Agaran"}
                    </span>
                    <span className="text-xs font-medium text-red-800">
                      {language === "en" ? "Immediate life-safety or evacuation needed" : "Kailangang ilikas o iligtas agad"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-900">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-orange-600 text-white">
                      {language === "en" ? "High Priority" : "Mataas na Priyoridad"}
                    </span>
                    <span className="text-xs font-medium text-orange-800">
                      {language === "en" ? "Preposition boats, relief, and alert responders" : "Ihanda ang bangka, relief, at responders"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-900">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-yellow-600 text-white">
                      {language === "en" ? "Moderate Priority" : "Katamtamang Priyoridad"}
                    </span>
                    <span className="text-xs font-medium text-yellow-800">
                      {language === "en" ? "Monitor river gauges & clear drainage" : "Bantayan ang antas ng ilog at daluyan ng tubig"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-green-600 text-white">
                      {language === "en" ? "Low Priority" : "Mababang Priyoridad"}
                    </span>
                    <span className="text-xs font-medium text-green-800">
                      {language === "en" ? "Normal readiness & periodic checking" : "Normal na kahandaan at regular na pagsusuri"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Workflow: SEE -> UNDERSTAND -> ACT */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">
              {language === "en" ? "AGAP Operating Principle" : "Prinsipyo ng Paggamit sa AGAP"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="font-bold text-blue-700 block">1. SEE</span>
                <span className="text-slate-600 text-[11px]">
                  {language === "en" ? "What is happening right now in Lucena?" : "Ano ang kasalukuyang nagaganap sa lungsod?"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="font-bold text-blue-700 block">2. UNDERSTAND</span>
                <span className="text-slate-600 text-[11px]">
                  {language === "en" ? "Why is this barangay high priority?" : "Bakit ito ang unang kailangang tutukan?"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="font-bold text-blue-700 block">3. ACT</span>
                <span className="text-slate-600 text-[11px]">
                  {language === "en" ? "Where should resources go first?" : "Saan dapat dalhin ang tulong at kagamitan?"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {language === "en" ? "Lucena City Pilot Support" : "Suporta sa Pilot ng Lungsod ng Lucena"}
          </span>
          <button
            type="button"
            onClick={() => setIsHelpOpen(false)}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};
