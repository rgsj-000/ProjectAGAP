"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "pill" | "full";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "pill",
  className = "",
}) => {
  const { language, setLanguage } = useLanguage();

  if (variant === "full") {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          <span>Wika / Language</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
              language === "en"
                ? "bg-white text-blue-700 shadow-sm font-semibold border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
            aria-pressed={language === "en"}
          >
            <span>English</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage("fil")}
            className={`py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
              language === "fil"
                ? "bg-white text-blue-700 shadow-sm font-semibold border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
            aria-pressed={language === "fil"}
          >
            <span>Filipino</span>
          </button>
        </div>
      </div>
    );
  }

  // Compact Pill
  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 text-xs rounded-md transition-all min-h-[36px] flex items-center gap-1 ${
          language === "en"
            ? "bg-white text-blue-700 font-bold shadow-sm"
            : "text-slate-600 hover:text-slate-900 font-medium"
        }`}
        aria-pressed={language === "en"}
        title="Switch to English"
      >
        <span>EN</span>
      </button>
      <div className="w-[1px] h-3 bg-slate-300 mx-0.5" />
      <button
        type="button"
        onClick={() => setLanguage("fil")}
        className={`px-2.5 py-1 text-xs rounded-md transition-all min-h-[36px] flex items-center gap-1 ${
          language === "fil"
            ? "bg-white text-blue-700 font-bold shadow-sm"
            : "text-slate-600 hover:text-slate-900 font-medium"
        }`}
        aria-pressed={language === "fil"}
        title="Lumipat sa Filipino"
      >
        <span>FIL</span>
      </button>
    </div>
  );
};
