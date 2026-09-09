import type { AdvisoryFormValues } from "@/components/advisory/AdvisoryForm";
import type { HouseholdCardOutput, HouseholdQuickProfile } from "@/components/household/HouseholdActionCard";

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Project AGAP request failed.");
  return body.data as T;
}

export function saveAdvisory(values: AdvisoryFormValues, evidence?: unknown) {
  const issueTime = new Date(values.issuedTime); const validityEnd = new Date(values.validity);
  if (Number.isNaN(issueTime.valueOf()) || Number.isNaN(validityEnd.valueOf())) throw new Error("Issued time and validity must be valid dates.");
  return api("/api/advisories", { method: "POST", body: JSON.stringify({ sourceAgency: values.source, advisoryType: values.title, bulletinReference: values.bulletinNumber, warningInformation: [values.warningInformation, values.message, ...values.precautions].filter(Boolean).join("\n"), issueTime: issueTime.toISOString(), validityStart: issueTime.toISOString(), validityEnd: validityEnd.toISOString(), sourceCoverageLevel: values.coverageLevel, sourceAffectedAreas: values.affectedLocations.split(",").map(x => x.trim()).filter(Boolean), sourceLink: values.sourceUrl, evidence }) });
}

export function householdCardByCode(householdCode: string, language: "en" | "fil") {
  return api<HouseholdCardOutput>("/api/households/action-card", { method: "POST", body: JSON.stringify({ mode: "code", householdCode, language }) });
}
export function householdCardByProfile(profile: HouseholdQuickProfile, language: "en" | "fil") {
  return api<HouseholdCardOutput>("/api/households/action-card", { method: "POST", body: JSON.stringify({ mode: "quick-profile", ...profile, language }) });
}
export function genericHouseholdCard(barangay: string, language: "en" | "fil") {
  return api<HouseholdCardOutput>("/api/households/action-card", { method: "POST", body: JSON.stringify({ mode: "generic", barangay, language }) });
}

export async function generateLguActionCard(barangayName: string) {
  const [barangays, hazards] = await Promise.all([api<any[]>("/api/barangays"), api<any[]>("/api/hazards")]);
  const barangay = barangays.find(item => item.barangay_name === barangayName); const hazard = hazards[0];
  if (!barangay || !hazard) throw new Error("Barangay or hazard data is unavailable.");
  return api<any>("/api/action-cards/lgu", { method: "POST", body: JSON.stringify({ barangayId: barangay.id, hazardId: hazard.id }) });
}

export function generatePostImpactByBarangay(barangay: string) {
  return api<any>("/api/post-impact/by-barangay", { method: "POST", body: JSON.stringify({ barangay }) });
}
