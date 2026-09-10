"use client";

import Link from "next/link";
import { ConnectedHouseholdCard } from "@/components/household/ConnectedHouseholdCard";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ProjectAgapBrand } from "@/components/branding/ProjectAgapBrand";
import { useLanguage } from "@/context/LanguageContext";
import { LOGIN_PATH, PUBLIC_HOME } from "@/lib/domain/applicationRoutes";

export function PublicHouseholdView() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href={PUBLIC_HOME} aria-label="Project AGAP home">
            <ProjectAgapBrand
              width={220}
              height={64}
              priority
              className="h-12 w-auto max-w-[180px]"
            />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="pill" />
            <Link
              href={LOGIN_PATH}
              className="rounded-md text-sm font-semibold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
            >
              LGU sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Public access · Lucena City
          </p>
          <h1 className="mt-2 text-3xl font-black">
            {language === "en"
              ? "Household preparedness"
              : "Paghahanda ng sambahayan"}
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            {language === "en"
              ? "Get guidance from verified advisories and approved preparedness rules. No LGU account, full name, or exact home address is required."
              : "Gabay mula sa beripikadong advisory at aprubadong tuntunin. Hindi kailangan ng LGU account, buong pangalan, o eksaktong tirahan."}
          </p>
        </section>

        <ConnectedHouseholdCard />

        <footer className="border-t border-slate-200 pt-5 text-sm text-slate-600">
          {language === "en"
            ? "Confirm current instructions with your barangay or LGU. AGAP does not issue evacuation orders or declare homes safe."
            : "Kumpirmahin ang kasalukuyang tagubilin sa barangay o LGU. Hindi nag-uutos ang AGAP ng paglikas o nagdedeklarang ligtas ang bahay."}
        </footer>
      </main>
    </div>
  );
}
