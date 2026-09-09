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
} from "@/lib/mock-data";

export type DemoUserView = "lgu" | "barangay-gulang-gulang" | "field-responder" | "public-resident";

export const GULANG_GULANG_BARANGAY_ID = "gulang-gulang";

interface NavigationContextType {
  currentModule: PrimaryModuleId;
  setCurrentModule: (id: PrimaryModuleId) => void;
  activeNavItem: NavItemConfig;

  // Demo user access scope
  userView: DemoUserView;
  setUserView: (view: DemoUserView) => void;
  isBarangayUser: boolean;
  isFieldResponderUser: boolean;
  isPublicUser: boolean;
  assignedBarangayId: string | null;
  assignedBarangay: BarangayPriority | null;

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
  const [currentModule, setCurrentModuleState] = useState<PrimaryModuleId>("home");
  const [prepareSubView, setPrepareSubViewState] = useState<PrepareSubView>("menu");
  const [selectedBarangayId, setSelectedBarangayIdState] = useState<string>("dalahican");
  const [userView, setUserViewState] = useState<DemoUserView>("lgu");
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const allBarangays = [...TOP_BARANGAYS, ...OTHER_BARANGAYS];

  const isBarangayUser = userView === "barangay-gulang-gulang";
  const isFieldResponderUser = userView === "field-responder";
  const isPublicUser = userView === "public-resident";
  const assignedBarangayId = isBarangayUser ? GULANG_GULANG_BARANGAY_ID : null;
  const assignedBarangay =
    assignedBarangayId !== null
      ? allBarangays.find((barangay) => barangay.id === assignedBarangayId) ?? null
      : null;

  const selectedBarangay =
    allBarangays.find((barangay) => barangay.id === selectedBarangayId) ||
    assignedBarangay ||
    TOP_BARANGAYS[0];

  const activeNavItem =
    PRIMARY_NAV_ITEMS.find((item) => item.id === currentModule) || PRIMARY_NAV_ITEMS[0];

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const setUserView = (view: DemoUserView) => {
    setUserViewState(view);

    if (view === "barangay-gulang-gulang") {
      setSelectedBarangayIdState(GULANG_GULANG_BARANGAY_ID);

      // Barangay users never retain citywide assessment/recovery screens.
      if (currentModule === "recovery") {
        setCurrentModuleState("home");
      }

      if (
        currentModule === "prepare" &&
        (prepareSubView === "priority-barangays" || prepareSubView === "barangay-detail")
      ) {
        setPrepareSubViewState("barangay-detail");
      }
    }

    if (view === "field-responder") {
      setCurrentModuleState("home");
      setPrepareSubViewState("menu");
    }

    if (view === "public-resident") {
      // The public experience is rendered outside the internal LGU module shell.
      setCurrentModuleState("home");
      setPrepareSubViewState("menu");
    }

    scrollToTop();
  };

  const setSelectedBarangayId = (id: string) => {
    setSelectedBarangayIdState(
      isBarangayUser ? GULANG_GULANG_BARANGAY_ID : id
    );
  };

  const setPrepareSubView = (view: PrepareSubView) => {
    if (isFieldResponderUser) {
      setPrepareSubViewState("menu");
      return;
    }

    if (
      isBarangayUser &&
      (view === "priority-barangays" || view === "barangay-detail")
    ) {
      setSelectedBarangayIdState(GULANG_GULANG_BARANGAY_ID);
      setPrepareSubViewState("barangay-detail");
      return;
    }

    setPrepareSubViewState(view);
  };

  const setCurrentModule = (id: PrimaryModuleId) => {
    if (isFieldResponderUser && id !== "home" && id !== "report-damage") {
      setCurrentModuleState("home");
      scrollToTop();
      return;
    }

    // Recovery/Post Impact remains an LGU-level workflow for this barangay demo.
    if (isBarangayUser && id === "recovery") {
      setCurrentModuleState("home");
      scrollToTop();
      return;
    }

    setCurrentModuleState(id);

    if (id === "prepare") {
      setPrepareSubViewState("menu");
    }

    if (isBarangayUser) {
      setSelectedBarangayIdState(GULANG_GULANG_BARANGAY_ID);
    }

    scrollToTop();
  };

  const goToHome = () => {
    setCurrentModuleState("home");
    scrollToTop();
  };

  const goToPrepare = (subView: PrepareSubView = "menu") => {
    if (isFieldResponderUser) {
      setCurrentModuleState("home");
      setPrepareSubViewState("menu");
      scrollToTop();
      return;
    }

    setCurrentModuleState("prepare");
    setSelectedBarangayIdState(
      isBarangayUser ? GULANG_GULANG_BARANGAY_ID : selectedBarangayId
    );

    if (
      isBarangayUser &&
      (subView === "priority-barangays" || subView === "barangay-detail")
    ) {
      setPrepareSubViewState("barangay-detail");
    } else {
      setPrepareSubViewState(subView);
    }

    scrollToTop();
  };

  const goToPriorityBarangays = () => {
    if (isFieldResponderUser) {
      setCurrentModuleState("home");
      setPrepareSubViewState("menu");
      scrollToTop();
      return;
    }

    setCurrentModuleState("prepare");

    if (isBarangayUser) {
      setSelectedBarangayIdState(GULANG_GULANG_BARANGAY_ID);
      setPrepareSubViewState("barangay-detail");
    } else {
      setPrepareSubViewState("priority-barangays");
    }

    scrollToTop();
  };

  const goToBarangayDetail = (barangayId: string) => {
    if (isFieldResponderUser) {
      setCurrentModuleState("home");
      setPrepareSubViewState("menu");
      scrollToTop();
      return;
    }

    setCurrentModuleState("prepare");

    if (isBarangayUser) {
      setSelectedBarangayIdState(GULANG_GULANG_BARANGAY_ID);
    } else {
      setSelectedBarangayIdState(barangayId);
    }

    setPrepareSubViewState("barangay-detail");
    scrollToTop();
  };

  const goToReportDamage = () => {
    if (isBarangayUser) {
      setSelectedBarangayIdState(GULANG_GULANG_BARANGAY_ID);
    }

    setCurrentModuleState("report-damage");
    scrollToTop();
  };

  const goToRecovery = () => {
    if (isFieldResponderUser) {
      setCurrentModuleState("home");
      scrollToTop();
      return;
    }

    if (isBarangayUser) {
      setCurrentModuleState("home");
      scrollToTop();
      return;
    }

    setCurrentModuleState("recovery");
    scrollToTop();
  };

  return (
    <NavigationContext.Provider
      value={{
        currentModule,
        setCurrentModule,
        activeNavItem,
        userView,
        setUserView,
        isBarangayUser,
        isFieldResponderUser,
        isPublicUser,
        assignedBarangayId,
        assignedBarangay,
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
