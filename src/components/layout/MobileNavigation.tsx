"use client";

import React from "react";
import { useNavigation } from "@/context/NavigationContext";
import { useLanguage } from "@/context/LanguageContext";
import { PrimaryModuleId } from "@/lib/mock-data";
import { LayoutDashboard, Shield, FileEdit, TrendingUp } from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const { currentModule, setCurrentModule, setPrepareSubView } = useNavigation();
  const { language, t } = useLanguage();

  const handleNavClick = (moduleId: PrimaryModuleId) => {
    setCurrentModule(moduleId);
    if (moduleId === "prepare") {
      setPrepareSubView("menu");
    }
  };

  const navItems = [
    {
      id: "home" as PrimaryModuleId,
      label: language === "en" ? "Home" : "Tahanan",
      accessibleLabel: t("navHome"),
      icon: LayoutDashboard,
    },
    {
      id: "prepare" as PrimaryModuleId,
      label: language === "en" ? "Prepare" : "Paghahanda",
      accessibleLabel: t("navPrepare"),
      icon: Shield,
    },
    {
      id: "report-damage" as PrimaryModuleId,
      label: language === "en" ? "Report" : "Ulat",
      accessibleLabel: t("navReport"),
      icon: FileEdit,
    },
    {
      id: "recovery" as PrimaryModuleId,
      label: language === "en" ? "Recovery" : "Pagbangon",
      accessibleLabel: t("navRecovery"),
      icon: TrendingUp,
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary mobile navigation"
    >
      <div className="grid h-16 grid-cols-4 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = currentModule === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`group flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                isActive ? "text-blue-700" : "text-slate-500 hover:text-slate-800"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.accessibleLabel}
              title={item.accessibleLabel}
            >
              <span
                className={`flex h-8 w-10 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-700"
                }`}
                aria-hidden="true"
              >
                <Icon className="h-[19px] w-[19px]" />
              </span>

              <span
                className={`max-w-full truncate text-[10px] leading-none tracking-tight ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
