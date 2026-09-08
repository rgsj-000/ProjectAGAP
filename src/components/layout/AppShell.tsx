"use client";

import React from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileBottomNav } from "./MobileNavigation";
import { HelpDialog } from "./HelpDialog";
import { AdvisoryModal } from "../advisory/AdvisoryModal";
import { ModulePlaceholder } from "../modules/ModulePlaceholder";

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 antialiased font-sans">
      {/* 1. Desktop Primary Navigation */}
      <AppSidebar />

      {/* 2. Main Operational Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <AppHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 outline-hidden"
        >
          <ModulePlaceholder />
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