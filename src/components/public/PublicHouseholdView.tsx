"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useNavigation } from "@/context/NavigationContext";
import {
  CURRENT_OFFICIAL_ADVISORY,
  OTHER_BARANGAYS,
  TOP_BARANGAYS,
} from "@/lib/mock-data";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { UserProfileArea } from "@/components/layout/UserProfileArea";
import { HelpDialog } from "@/components/layout/HelpDialog";
import { AdvisoryModal } from "@/components/advisory/AdvisoryModal";
import {
  HouseholdActionCard,
  type HouseholdCardOutput,
  type HouseholdQuickProfile,
} from "@/components/household/HouseholdActionCard";
import { ConnectivityStatus } from "@/components/feedback/ConnectivityStatus";
import { ProjectAgapBrand } from "@/components/branding/ProjectAgapBrand";

interface PublicHouseholdViewProps {
  showDemoSwitcher?: boolean;
}

export const PublicHouseholdView: React.FC<PublicHouseholdViewProps> = ({
  showDemoSwitcher = false,
}) => {
  const { language } = useLanguage();
  const {
    setIsHelpOpen,
    setIsAdvisoryModalOpen,
  } = useNavigation();

  const advisory = CURRENT_OFFICIAL_ADVISORY;
  const advisoryTitle =
    language === "en" ? advisory.titleEn : advisory.titleFil;
  const advisoryMessage =
    language === "en" ? advisory.leadParagraphEn : advisory.leadParagraphFil;
  const normalizeVerificationState = (
    value: string | null | undefined
  ): HouseholdCardOutput["advisoryVerificationState"] => {
    switch (value) {
      case "FOR_REVIEW":
      case "VERIFIED":
      case "STALE":
      case "PENDING":
      case "UNVERIFIED":
        return value;
      default:
        return "UNVERIFIED";
    }
  };

  const advisoryVerificationState = normalizeVerificationState(
    advisory.verificationState
  );

  const barangays = useMemo(
    () =>
      [...TOP_BARANGAYS, ...OTHER_BARANGAYS]
        .map((barangay) => barangay.name)
        .filter((name, index, all) => all.indexOf(name) === index)
        .sort((a, b) => a.localeCompare(b)),
    []
  );

  const [output, setOutput] = useState<HouseholdCardOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const makeBaseOutput = (
    barangay: string,
    householdCode?: string | null
  ): HouseholdCardOutput => ({
    barangay,
    householdCode: householdCode ?? null,
    advisoryTitle,
    advisoryReference: advisory.bulletinNumber ?? null,
    advisoryValidity: advisory.validity ?? null,
    advisoryVerificationState,
    generatedAt: new Date().toLocaleString(),
    lastSyncAt: null,
    languageLabel: language === "en" ? "English" : "Filipino",
    actions: [],
    limitations: [
      language === "en"
        ? "This frontend demo uses only the household personalization triggers documented in the Project AGAP blueprint. Production must use approved action-rule IDs from the connected rule library."
        : "Ang frontend demo na ito ay gumagamit lamang ng household personalization triggers na nasa Project AGAP blueprint. Sa production, dapat gumamit ng approved action-rule IDs mula sa connected rule library.",
      language === "en"
        ? "AGAP does not determine whether a specific home will be affected and does not replace official LGU or barangay instructions."
        : "Hindi tinutukoy ng AGAP kung maaapektuhan ang isang partikular na bahay at hindi nito pinapalitan ang official LGU o barangay instructions.",
    ],
  });

  const addConfirmationAction = (card: HouseholdCardOutput) => {
    card.actions.push({
      id: "public-confirm-latest-instructions",
      title:
        language === "en"
          ? "Confirm the latest local instructions"
          : "Kumpirmahin ang pinakabagong local instructions",
      explanation:
        language === "en"
          ? "When communication is available, check the latest instructions from your barangay or LGU before relying on saved preparedness information."
          : "Kapag may communication, tingnan ang pinakabagong instructions mula sa inyong barangay o LGU bago umasa sa saved preparedness information.",
      sourceRule:
        "Project AGAP Technical Build Blueprint — Offline Household Action Card requirement",
    });
  };

  const handleGenerateByCode = async (householdCode: string) => {
    setIsGenerating(true);
    try {
      const card = makeBaseOutput(
        language === "en"
          ? "Household barangay pending profile lookup"
          : "Barangay ng household pending profile lookup",
        householdCode
      );

      addConfirmationAction(card);
      card.limitations = [
        ...(card.limitations ?? []),
        language === "en"
          ? "Household Code lookup requires a connected or previously cached minimal household profile. This frontend demo does not invent a barangay or household profile from the code."
          : "Ang Household Code lookup ay nangangailangan ng connected o previously cached minimal household profile. Hindi nag-iimbento ang frontend demo na ito ng barangay o household profile mula sa code.",
      ];
      setOutput(card);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuickProfile = async (
    profile: HouseholdQuickProfile
  ) => {
    setIsGenerating(true);
    try {
      const card = makeBaseOutput(profile.barangay);
      addConfirmationAction(card);

      if (profile.hasInfantOrChild) {
        card.actions.push({
          id: "blueprint-trigger-child",
          title:
            language === "en"
              ? "Prepare for infant or child needs"
              : "Maghanda para sa pangangailangan ng sanggol o bata",
          explanation:
            language === "en"
              ? "Include child-specific food, medicine, clothing, and hygiene preparation that your household already uses or has been instructed to prepare."
              : "Isama ang child-specific food, medicine, clothing, at hygiene preparation na ginagamit na ng inyong household o ipinayo ng authorized local guidance.",
          sourceRule:
            "Project AGAP Technical Build Blueprint — Infant or child personalization trigger",
        });
      }

      if (profile.hasOlderPerson) {
        card.actions.push({
          id: "blueprint-trigger-older-person",
          title:
            language === "en"
              ? "Prepare for an older household member"
              : "Maghanda para sa nakatatandang household member",
          explanation:
            language === "en"
              ? "Prepare relevant medicine, mobility aids, caregiver support, and personal items."
              : "Ihanda ang relevant medicine, mobility aids, caregiver support, at personal items.",
          sourceRule:
            "Project AGAP Technical Build Blueprint — Older person personalization trigger",
        });
      }

      if (profile.hasPwdOrMobilityLimitation) {
        card.actions.push({
          id: "blueprint-trigger-accessibility",
          title:
            language === "en"
              ? "Prepare accessibility and assistive-device needs"
              : "Ihanda ang accessibility at assistive-device needs",
          explanation:
            language === "en"
              ? "Include accessibility support and assistive devices that the household member normally requires."
              : "Isama ang accessibility support at assistive devices na karaniwang kailangan ng household member.",
          sourceRule:
            "Project AGAP Technical Build Blueprint — PWD or mobility limitation personalization trigger",
        });
      }

      if (profile.hasEssentialMedicineNeed) {
        card.actions.push({
          id: "blueprint-trigger-medicine",
          title:
            language === "en"
              ? "Prepare essential medicine information"
              : "Ihanda ang essential medicine information",
          explanation:
            language === "en"
              ? "Prepare the needed medicine supply and relevant prescription information."
              : "Ihanda ang kinakailangang medicine supply at relevant prescription information.",
          sourceRule:
            "Project AGAP Technical Build Blueprint — Essential medicine personalization trigger",
        });
      }

      if (profile.hasPets) {
        card.actions.push({
          id: "blueprint-trigger-pet",
          title:
            language === "en"
              ? "Prepare basic pet needs"
              : "Ihanda ang basic pet needs",
          explanation:
            language === "en"
              ? "Prepare pet food, water, a carrier or restraint, and basic supplies."
              : "Ihanda ang pet food, tubig, carrier o restraint, at basic supplies.",
          sourceRule:
            "Project AGAP Technical Build Blueprint — Pet personalization trigger",
        });
      }

      setOutput(card);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateGeneric = async (barangay: string) => {
    setIsGenerating(true);
    try {
      const card = makeBaseOutput(barangay);
      addConfirmationAction(card);
      card.limitations = [
        ...(card.limitations ?? []),
        language === "en"
          ? "The production General Barangay Preparedness Card must be populated from approved general action rules for the selected barangay."
          : "Sa production, ang General Barangay Preparedness Card ay dapat manggaling sa approved general action rules para sa napiling barangay.",
      ];
      setOutput(card);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[82px] w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="min-w-0">
            <ProjectAgapBrand
              width={220}
              height={64}
              priority
              className="h-12 w-auto max-w-[220px]"
            />

            <p className="mt-1 truncate text-[11px] text-slate-500">
              {language === "en"
                ? "Public Household Preparedness • Lucena City"
                : "Public Household Preparedness • Lucena City"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector variant="pill" />
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                {language === "en" ? "Help" : "Tulong"}
              </span>
            </button>
            {showDemoSwitcher ? (
              <UserProfileArea compact menuPlacement="bottom" />
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {language === "en" ? "Public Access" : "Public Access"}
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {language === "en"
                ? "Household Preparedness"
                : "Paghahanda ng Household"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              {language === "en"
                ? "Get household preparedness guidance without an LGU dashboard account. Your full name and exact home address are not required."
                : "Kumuha ng household preparedness guidance nang walang LGU dashboard account. Hindi kailangan ang buong pangalan at eksaktong home address."}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  {language === "en" ? "Current Official Advisory" : "Current Official Advisory"}
                </span>
                <span className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  {advisoryVerificationState.replaceAll("_", " ")}
                </span>
              </div>
              <h2 className="mt-1 text-base font-bold text-slate-900">
                {advisoryTitle}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {advisory.source} • {advisory.issuedTime}
              </p>
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-700">
                {advisoryMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              {language === "en" ? "View Advisory" : "Tingnan ang Advisory"}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </section>

        <ConnectivityStatus
          audience="public"
          lastSyncAt={null}
          advisoryValidity={advisory.validity ?? null}
        />

        {advisoryVerificationState !== "VERIFIED" ? (
          <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-white p-3 text-xs leading-relaxed text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {language === "en"
                ? "No verified current advisory is available in this demo data. The Household Action Card must not be treated as a forecast, warning, or statement that a specific home will be affected."
                : "Walang verified current advisory sa demo data na ito. Hindi dapat ituring ang Household Action Card bilang forecast, warning, o pahayag na maaapektuhan ang isang partikular na bahay."}
            </span>
          </div>
        ) : null}

        <HouseholdActionCard
          barangays={barangays}
          requireBarangaySelection
          output={output}
          isGenerating={isGenerating}
          onGenerateByCode={handleGenerateByCode}
          onGenerateQuickProfile={handleGenerateQuickProfile}
          onGenerateGeneric={handleGenerateGeneric}
        />

        <footer className="border-t border-slate-200 py-5 text-center text-[11px] leading-relaxed text-slate-500">
          {language === "en"
            ? "Project AGAP provides preparedness decision support. Confirm the latest instructions from your barangay, Lucena CDRRMO, PAGASA, or other authorized agencies."
            : "Nagbibigay ang Project AGAP ng preparedness decision support. Kumpirmahin ang pinakabagong instructions mula sa inyong barangay, Lucena CDRRMO, PAGASA, o ibang authorized agencies."}
        </footer>
      </main>

      <HelpDialog audience="public" />
      <AdvisoryModal />
    </div>
  );
};
