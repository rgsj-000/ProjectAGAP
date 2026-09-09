"use client";

import React from "react";
import { useNavigation } from "@/context/NavigationContext";
import { useLanguage } from "@/context/LanguageContext";
import { PRIMARY_NAV_ITEMS, NavItemConfig } from "@/lib/mock-data";
import { LanguageSelector } from "./LanguageSelector";
import { UserProfileArea } from "./UserProfileArea";
import { ProjectAgapBrand } from "@/components/branding/ProjectAgapBrand";
import {
  Home,
  Shield,
  FileEdit,
  TrendingUp,
  HelpCircle,
  MapPin,
} from "lucide-react";

export const AppSidebar: React.FC = () => {
  const {
    currentModule,
    setCurrentModule,
    setIsHelpOpen,
    setPrepareSubView,
    isBarangayUser,
    isFieldResponderUser,
  } = useNavigation();
  const { language, t } = useLanguage();

  const getNavIcon = (iconName: string, isActive: boolean) => {
    const className = `w-5 h-5 shrink-0 transition-colors ${
      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
    }`;
    switch (iconName) {
      case "Home":
        return <Home className={className} />;
      case "Shield":
        return <Shield className={className} />;
      case "FileEdit":
        return <FileEdit className={className} />;
      case "TrendingUp":
        return <TrendingUp className={className} />;
      default:
        return <Home className={className} />;
    }
  };

  const handleNavClick = (item: NavItemConfig) => {
    setCurrentModule(item.id);
    if (item.id === "prepare") {
      setPrepareSubView("menu");
    }
  };

  const visibleNavItems = isFieldResponderUser
    ? PRIMARY_NAV_ITEMS.filter(
        (item) => item.id === "home" || item.id === "report-damage"
      )
    : isBarangayUser
      ? PRIMARY_NAV_ITEMS.filter((item) => item.id !== "recovery")
      : PRIMARY_NAV_ITEMS;

  return (
    <aside
      className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30 select-none"
      aria-label="Desktop Navigation Sidebar"
    >
      {/* Branding Area */}
      <div className="p-6 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setCurrentModule("home")}
          className="text-left group block w-full"
        >
          <div className="space-y-2">
            <ProjectAgapBrand
              width={176}
              height={52}
              priority
              className="h-auto max-h-11 w-auto max-w-full"
            />
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
              <span>
                {isBarangayUser
                  ? "Barangay Gulang-Gulang"
                  : isFieldResponderUser
                    ? "Lucena City Field Operations"
                    : "Lucena City, Quezon"}
              </span>
            </span>
          </div>
        </button>
      </div>

      {/* Role-scoped primary navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = currentModule === item.id;
          const title = language === "en" ? item.titleEn : item.titleFil;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all min-h-[44px] group ${
                isActive
                  ? "bg-blue-50 text-blue-900 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {getNavIcon(item.iconName, isActive)}
              <span className="text-sm tracking-tight">{title}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Secondary Access: Help, Language, User */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* Help & Emergency */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-xs font-medium transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>{t("help")}</span>
          </div>
          <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
            911
          </span>
        </button>

        {/* Language Selector */}
        <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium">Wika / Lang</span>
          <LanguageSelector variant="pill" />
        </div>

        {/* User Capsule */}
        <div className="pt-1">
          <UserProfileArea />
        </div>
      </div>
    </aside>
  );
};