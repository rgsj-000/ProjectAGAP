"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { MOCK_USER } from "@/lib/mock-data"
import { User, ShieldCheck, ChevronDown, Check, Building } from "lucide-react";

interface UserProfileAreaProps {
  compact?: boolean;
}

const AVAILABLE_ROLES = [
  {
    name: "Engr. Maria Santos",
    roleEn: "CDRRMO Operations Officer",
    roleFil: "Opisyal ng Operasyon ng CDRRMO",
    assigned: "City EOC (Lucena City)",
    badgeEn: "LGU Admin",
    badgeFil: "LGU Tagapangasiwa",
  },
  {
    name: "Hon. Roberto Ilagan",
    roleEn: "Barangay Captain",
    roleFil: "Punong Barangay",
    assigned: "Barangay Cotta, Lucena City",
    badgeEn: "Barangay Official",
    badgeFil: "Opisyal ng Barangay",
  },
  {
    name: "Capt. Danilo Alcala",
    roleEn: "Disaster Response Lead",
    roleFil: "Lider ng Disaster Response",
    assigned: "Barangay Dalahican Coastal Unit",
    badgeEn: "Field Responder",
    badgeFil: "Responder sa Komunidad",
  },
];

export const UserProfileArea: React.FC<UserProfileAreaProps> = ({ compact = false }) => {
  const { language } = useLanguage();
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentUser = AVAILABLE_ROLES[selectedRoleIndex];

  return (
    <div className="relative">
      {compact ? (
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          aria-label="User Profile"
          aria-expanded={isDropdownOpen}
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
        </button>
      ) : (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 text-left flex-1 min-w-0 group"
              aria-expanded={isDropdownOpen}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white"
                  title="Active / On Duty"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {language === "en" ? currentUser.roleEn : currentUser.roleFil}
                </p>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium text-slate-600 truncate max-w-[150px]">
              <Building className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{currentUser.assigned}</span>
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {language === "en" ? currentUser.badgeEn : currentUser.badgeFil}
            </span>
          </div>
        </div>
      )}

      {/* Role Switcher Menu */}
      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900">
                {language === "en" ? "Simulate User Role" : "Subukan ang Tungkulin"}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === "en"
                  ? "Test Project AGAP through different user views"
                  : "Subukan ang AGAP sa iba't ibang antas ng opisyal"}
              </p>
            </div>

            <div className="py-1 space-y-1">
              {AVAILABLE_ROLES.map((role, idx) => {
                const isSelected = idx === selectedRoleIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedRoleIndex(idx);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{role.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        {language === "en" ? role.roleEn : role.roleFil}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{role.assigned}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
