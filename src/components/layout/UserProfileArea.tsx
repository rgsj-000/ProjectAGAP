"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  type DemoUserView,
  useNavigation,
} from "@/context/NavigationContext";
import { ChevronDown, Check, Building } from "lucide-react";

interface UserProfileAreaProps {
  compact?: boolean;
  menuPlacement?: "top" | "bottom";
}

interface DemoRole {
  view: DemoUserView;
  name: string;
  roleEn: string;
  roleFil: string;
  assigned: string;
  badgeEn: string;
  badgeFil: string;
}

const AVAILABLE_ROLES: DemoRole[] = [
  {
    view: "lgu",
    name: "Demo LGU User",
    roleEn: "Authorized LGU User",
    roleFil: "Awtorisadong LGU User",
    assigned: "City EOC (Lucena City)",
    badgeEn: "LGU",
    badgeFil: "LGU",
  },
  {
    view: "barangay-gulang-gulang",
    name: "Barangay Gulang-Gulang User",
    roleEn: "Barangay Official",
    roleFil: "Opisyal ng Barangay",
    assigned: "Barangay Gulang-Gulang, Lucena City",
    badgeEn: "Barangay",
    badgeFil: "Barangay",
  },
  {
    view: "public-resident",
    name: "Public / Resident",
    roleEn: "Household Preparedness Access",
    roleFil: "Household Preparedness Access",
    assigned: "Public Household Action Card",
    badgeEn: "Public",
    badgeFil: "Public",
  },
  {
    view: "field-responder",
    name: "Demo Field Responder",
    roleEn: "Field Responder",
    roleFil: "Field Responder",
    assigned: "Lucena City Field Operations",
    badgeEn: "Responder",
    badgeFil: "Responder",
  },
];

export const UserProfileArea: React.FC<UserProfileAreaProps> = ({
  compact = false,
  menuPlacement,
}) => {
  const { language } = useLanguage();
  const { userView, setUserView } = useNavigation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedRoleIndex = Math.max(
    0,
    AVAILABLE_ROLES.findIndex((role) => role.view === userView)
  );
  const currentUser = AVAILABLE_ROLES[selectedRoleIndex];
  const resolvedMenuPlacement = menuPlacement ?? (compact ? "bottom" : "top");

  const selectRole = (role: DemoRole) => {
    setUserView(role.view);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      {compact ? (
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 rounded-lg border border-transparent p-1.5 transition-colors hover:border-slate-200 hover:bg-slate-100"
          aria-label="User Profile"
          aria-expanded={isDropdownOpen}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-xs font-bold text-blue-700">
            {currentUser.name
              .split(" ")
              .map((name) => name[0])
              .join("")
              .slice(0, 2)}
          </div>
        </button>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group flex min-w-0 flex-1 items-center gap-2.5 text-left"
              aria-expanded={isDropdownOpen}
            >
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs">
                  {currentUser.name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"
                  title="Active / On Duty"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                  {currentUser.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {language === "en" ? currentUser.roleEn : currentUser.roleFil}
                </p>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform group-hover:text-slate-600 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-200/80 pt-2 text-[11px] text-slate-500">
            <span className="inline-flex max-w-[150px] items-center gap-1 truncate font-medium text-slate-600">
              <Building className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">{currentUser.assigned}</span>
            </span>
            <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
              {language === "en" ? currentUser.badgeEn : currentUser.badgeFil}
            </span>
          </div>
        </div>
      )}

      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
            aria-hidden="true"
          />
          <div
            className={`absolute left-0 z-50 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
              resolvedMenuPlacement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
            }`}
          >
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-xs font-bold text-slate-900">
                {language === "en" ? "Simulate User View" : "Subukan ang User View"}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === "en"
                  ? "Switch between the demo access views"
                  : "Lumipat sa iba't ibang demo access view"}
              </p>
            </div>

            <Link
              href="/login"
              onClick={() => setIsDropdownOpen(false)}
              className="my-1 flex items-center rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              Sign in with Supabase
            </Link>

            <div className="space-y-1 py-1">
              {AVAILABLE_ROLES.map((role) => {
                const isSelected = role.view === userView;

                return (
                  <button
                    key={role.view}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`flex w-full items-start justify-between gap-2 rounded-lg p-2.5 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-blue-50 font-medium text-blue-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{role.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {language === "en" ? role.roleEn : role.roleFil}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {role.assigned}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    )}
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
