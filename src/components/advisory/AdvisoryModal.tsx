"use client";

import React, { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useNavigation } from "@/context/NavigationContext";
import { CURRENT_OFFICIAL_ADVISORY } from "@/lib/mock-data"
import { Radio, X, ExternalLink, ShieldCheck } from "lucide-react";

export const AdvisoryModal: React.FC = () => {
  const { isAdvisoryModalOpen, setIsAdvisoryModalOpen } = useNavigation();
  const { language, t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAdvisoryModalOpen) {
        setIsAdvisoryModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdvisoryModalOpen, setIsAdvisoryModalOpen]);

  if (!isAdvisoryModalOpen) return null;

  const advisory = CURRENT_OFFICIAL_ADVISORY;
  const title = language === "en" ? advisory.titleEn : advisory.titleFil;
  const lead = language === "en" ? advisory.leadParagraphEn : advisory.leadParagraphFil;
  const precautions =
    language === "en" ? advisory.precautionsEn : advisory.precautionsFil;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="advisory-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {language === "en" ? advisory.status : advisory.statusFil}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {advisory.source} • {advisory.issuedTime}
                </span>
              </div>
              <h3 id="advisory-modal-title" className="text-lg font-bold text-slate-900 mt-1">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAdvisoryModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={t("close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <p className="leading-relaxed text-slate-800 font-medium">
            {lead}
          </p>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === "en" ? "Key Directives & Precautions:" : "Mga Pangunahing Tagubilin:"}
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {precautions.map((p, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {language === "en"
                ? "Official advisory verified by Lucena CDRRMO Operations Center."
                : "Opisyal na babalang beripikado ng Sentro ng Operasyon ng Lucena CDRRMO."}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">{advisory.bulletinNumber}</span>
          <button
            type="button"
            onClick={() => setIsAdvisoryModalOpen(false)}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};
