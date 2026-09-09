"use client";

import React from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileBottomNav } from "./MobileNavigation";
import { HelpDialog } from "./HelpDialog";
import { AdvisoryModal } from "../advisory/AdvisoryModal";
import { OperationalWorkspace } from "../modules/OperationalWorkspace";
import { PublicHouseholdView } from "../public/PublicHouseholdView";
import { useNavigation } from "@/context/NavigationContext";

export const AppShell: React.FC = () => {
  const { isPublicUser } = useNavigation();

  if (isPublicUser) {
    return <PublicHouseholdView showDemoSwitcher />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 antialiased font-sans">
      {/* 1. Desktop Left Sidebar (4 Clean Primary Items) */}
      <AppSidebar />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <AppHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-4xl w-full mx-auto outline-hidden"
        >
          <OperationalWorkspace />
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation (4 Direct Tabs) */}
      <MobileBottomNav />

      {/* 4. Help & Emergency Modal */}
      <HelpDialog />

      {/* 5. Official Advisory Modal */}
      <AdvisoryModal />
    </div>
  );
};
