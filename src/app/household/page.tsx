import type { Metadata } from "next";
import { PublicHouseholdView } from "@/components/public/PublicHouseholdView";

export const metadata: Metadata = {
  title: "Household Preparedness | Project AGAP",
  description:
    "Public Household Action Card and preparedness guidance for the Project AGAP Lucena City pilot.",
};

export default function HouseholdPage() {
  return <PublicHouseholdView />;
}
