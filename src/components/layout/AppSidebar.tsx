"use client";

import React from "react";
import { useNavigation } from "@/context/NavigationContext";
import { useLanguage } from "@/context/LanguageContext";
import { PRIMARY_NAV_ITEMS, NavItemConfig } from "@/lib/mock-data";
import { LanguageSelector } from "./LanguageSelector";
import { UserProfileArea } from "./UserProfileArea";
import {
  LayoutDashboard,
  Shield,
  FileEdit,
  TrendingUp,
  HelpCircle,
  MapPin,
} from "lucide-react";

export const AppSidebar: React.FC = () => {
  const { currentModule, setCurrentModule, setIsHelpOpen, setPrepareSubView } =
    useNavigation();
  const { language, t } = useLanguage();

  const getNavTitle = (item: NavItemConfig) =>
    language === "en" ? item.titleEn : item.titleFil;

  const getNavIcon = (iconName: string, isActive: boolean) => {
    const className = `w-5 h-5 shrink-0 transition-colors ${
      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
    }`;

    switch (iconName) {
      case "Home":
        return <LayoutDashboard className={className} aria-hidden="true" />;
      case "Shield":
        return <Shield className={className} aria-hidden="true" />;
      case "FileEdit":
        return <FileEdit className={className} aria-hidden="true" />;
      case "TrendingUp":
        return <TrendingUp className={className} aria-hidden="true" />;
      default:
        return <LayoutDashboard className={className} aria-hidden="true" />;
    }
  };

  const handleNavClick = (item: NavItemConfig) => {
    setCurrentModule(item.id);

    if (item.id === "prepare") {
      setPrepareSubView("menu");
    }
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30 select-none"
      aria-label="Project AGAP primary navigation"
    >
      {/* Project identity */}
      <div className="p-6 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setCurrentModule("home")}
          className="text-left group block w-full"
          aria-label={language === "en" ? "Go to Home" : "Pumunta sa Tahanan"}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-base shadow-xs">
              A
            </div>

            <div className="min-w-0">
              <span className="font-black text-slate-900 tracking-tight text-base block group-hover:text-blue-700 transition-colors">
                PROJECT AGAP
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate">Lucena City, Quezon</span>
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Primary operational navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Main sections">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = currentModule === item.id;
          const title = getNavTitle(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors min-h-[44px] group ${
                isActive
                  ? "bg-blue-50 text-blue-900 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {getNavIcon(item.iconName, isActive)}
              <span className="text-sm tracking-tight leading-tight">{title}</span>
            </button>
          );
        })}
      </nav>

      {/* Persistent secondary access */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-xs font-medium transition-colors"
          aria-label={t("help")}
        >
          <HelpCircle className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span>{t("help")}</span>
        </button>

        <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium">Wika / Lang</span>
          <LanguageSelector variant="pill" />
        </div>

        <div className="pt-1">
          <UserProfileArea />
        </div>
      </div>
    </aside>
  );
};
