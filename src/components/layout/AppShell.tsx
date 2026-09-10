"use client";

import React from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileBottomNav } from "./MobileNavigation";
import { HelpDialog } from "./HelpDialog";
import { AdvisoryModal } from "../advisory/AdvisoryModal";
import { OperationalWorkspace } from "../modules/OperationalWorkspace";

export const AppShell: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <AppHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 outline-hidden sm:px-8 sm:py-8 lg:px-12"
        >
          <OperationalWorkspace />
        </main>
      </div>

      <MobileBottomNav />
      <HelpDialog />
      <AdvisoryModal />
    </div>
  );
};
