"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileBottomNav } from "./MobileNavigation";
import { HelpDialog } from "./HelpDialog";
import { AdvisoryModal } from "../advisory/AdvisoryModal";
import { PublicHouseholdView } from "../public/PublicHouseholdView";
import { useNavigation } from "@/context/NavigationContext";
import { DemoLanding } from "@/components/demo/DemoLanding";

const DemoWorkspace = dynamic(
  () => import("@/components/demo/DemoWorkspace").then((module) => module.DemoWorkspace),
  {
    loading: () => (
      <div className="space-y-4" role="status" aria-label="Opening the LGU demo">
        <span className="sr-only">Opening LGU demo</span>
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-32 rounded-xl bg-slate-200" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 rounded-xl bg-slate-200" />)}
        </div>
      </div>
    ),
  },
);

export const AppShell: React.FC = () => {
  const { isPublicUser } = useNavigation();
  const [demoOpen, setDemoOpen] = useState(false);

  if (isPublicUser) {
    return <PublicHouseholdView showDemoSwitcher />;
  }

  if (!demoOpen) {
    return <DemoLanding onOpenDemo={() => setDemoOpen(true)} />;
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
          className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 outline-hidden sm:px-8 sm:py-8 lg:px-10"
        >
          <DemoWorkspace />
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
