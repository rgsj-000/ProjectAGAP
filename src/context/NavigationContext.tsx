"use client";

import React, { createContext, useContext, useState } from "react";
import {
  PrimaryModuleId,
  PrepareSubView,
  PRIMARY_NAV_ITEMS,
  NavItemConfig,
  TOP_BARANGAYS,
  OTHER_BARANGAYS,
  BarangayPriority,
} from "@/lib/mock-data"

interface NavigationContextType {
  currentModule: PrimaryModuleId;
  setCurrentModule: (id: PrimaryModuleId) => void;
  activeNavItem: NavItemConfig;

  // Prepare sub-routing
  prepareSubView: PrepareSubView;
  setPrepareSubView: (view: PrepareSubView) => void;
  selectedBarangayId: string;
  setSelectedBarangayId: (id: string) => void;
  selectedBarangay: BarangayPriority;

  // Modals
  isAdvisoryModalOpen: boolean;
  setIsAdvisoryModalOpen: (open: boolean) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;

  // Quick navigation helpers
  goToHome: () => void;
  goToPrepare: (subView?: PrepareSubView) => void;
  goToPriorityBarangays: () => void;
  goToBarangayDetail: (barangayId: string) => void;
  goToReportDamage: () => void;
  goToRecovery: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState<PrimaryModuleId>("home");
  const [prepareSubView, setPrepareSubView] = useState<PrepareSubView>("menu");
  const [selectedBarangayId, setSelectedBarangayId] = useState<string>("dalahican");
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const activeNavItem =
    PRIMARY_NAV_ITEMS.find((item) => item.id === currentModule) || PRIMARY_NAV_ITEMS[0];

  const allBarangays = [...TOP_BARANGAYS, ...OTHER_BARANGAYS];
  const selectedBarangay =
    allBarangays.find((b) => b.id === selectedBarangayId) || TOP_BARANGAYS[0];

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSetCurrentModule = (id: PrimaryModuleId) => {
    setCurrentModule(id);
    if (id === "prepare") {
      setPrepareSubView("menu");
    }
    scrollToTop();
  };

  const goToHome = () => {
    setCurrentModule("home");
    scrollToTop();
  };

  const goToPrepare = (subView: PrepareSubView = "menu") => {
    setCurrentModule("prepare");
    setPrepareSubView(subView);
    scrollToTop();
  };

  const goToPriorityBarangays = () => {
    setCurrentModule("prepare");
    setPrepareSubView("priority-barangays");
    scrollToTop();
  };

  const goToBarangayDetail = (barangayId: string) => {
    setSelectedBarangayId(barangayId);
    setCurrentModule("prepare");
    setPrepareSubView("barangay-detail");
    scrollToTop();
  };

  const goToReportDamage = () => {
    setCurrentModule("report-damage");
    scrollToTop();
  };

  const goToRecovery = () => {
    setCurrentModule("recovery");
    scrollToTop();
  };

  return (
    <NavigationContext.Provider
      value={{
        currentModule,
        setCurrentModule: handleSetCurrentModule,
        activeNavItem,
        prepareSubView,
        setPrepareSubView,
        selectedBarangayId,
        setSelectedBarangayId,
        selectedBarangay,
        isAdvisoryModalOpen,
        setIsAdvisoryModalOpen,
        isHelpOpen,
        setIsHelpOpen,
        goToHome,
        goToPrepare,
        goToPriorityBarangays,
        goToBarangayDetail,
        goToReportDamage,
        goToRecovery,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
