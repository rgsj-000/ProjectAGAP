"use client";

import React from "react";
import { useNavigation } from "@/context/NavigationContext";
import { useLanguage } from "@/context/LanguageContext";
import { PrimaryModuleId } from "@/lib/mock-data"
import { Home, Shield, FileEdit, TrendingUp } from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const {
    currentModule,
    setCurrentModule,
    setPrepareSubView,
    isBarangayUser,
    isFieldResponderUser,
  } = useNavigation();
  const { t } = useLanguage();

  const handleNavClick = (moduleId: PrimaryModuleId) => {
    setCurrentModule(moduleId);
    if (moduleId === "prepare") {
      setPrepareSubView("menu");
    }
  };

  const navItems = [
    {
      id: "home" as PrimaryModuleId,
      label: t("navHome"),
      icon: Home,
    },
    {
      id: "prepare" as PrimaryModuleId,
      label: t("navPrepare"),
      icon: Shield,
    },
    {
      id: "report-damage" as PrimaryModuleId,
      label: t("navReport"),
      icon: FileEdit,
    },
    {
      id: "recovery" as PrimaryModuleId,
      label: t("navRecovery"),
      icon: TrendingUp,
    },
  ];

  const visibleNavItems = isFieldResponderUser
    ? navItems.filter(
        (item) => item.id === "home" || item.id === "report-damage"
      )
    : isBarangayUser
      ? navItems.filter((item) => item.id !== "recovery")
      : navItems;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-3 pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Navigation"
    >
      <div
        className={`grid h-16 max-w-md mx-auto items-center ${
          isFieldResponderUser
            ? "grid-cols-2"
            : isBarangayUser
              ? "grid-cols-3"
              : "grid-cols-4"
        }`}
      >
        {visibleNavItems.map((item) => {
          const isActive = currentModule === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center gap-1 h-full transition-colors min-h-[48px] ${
                isActive
                  ? "text-blue-700 font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
