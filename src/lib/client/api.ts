import type { AdvisoryFormValues } from "@/components/advisory/AdvisoryForm";
import type { HouseholdCardOutput, HouseholdQuickProfile } from "@/components/household/HouseholdActionCard";

type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: ApiErrorPayload;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new ApiClientError(
      "Unable to reach Project AGAP.",
      "NETWORK_ERROR",
      0,
      error,
    );
  }

  let body: ApiEnvelope<T>;

  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError(
      "Project AGAP returned an unreadable response.",
      "INVALID_RESPONSE",
      response.status,
    );
  }

  if (!response.ok || body.success !== true) {
    throw new ApiClientError(
      body.error?.message ?? "Project AGAP request failed.",
      body.error?.code ?? "REQUEST_FAILED",
      response.status,
      body.error?.details,
    );
  }

  return body.data as T;
}

function advisoryPayload(values: AdvisoryFormValues, evidence?: unknown) {
  const issueTime = new Date(values.issuedTime);
  const validityEnd = new Date(values.validity);
  if (Number.isNaN(issueTime.valueOf()) || Number.isNaN(validityEnd.valueOf())) {
    throw new Error("Issued time and validity must be valid dates.");
  }
  return {
    sourceAgency: values.source,
    advisoryType: values.title,
    bulletinReference: values.bulletinNumber,
    warningInformation: values.warningInformation,
    message: values.message,
    precautions: values.precautions,
    issueTime: issueTime.toISOString(),
    validityStart: issueTime.toISOString(),
    validityEnd: validityEnd.toISOString(),
    sourceCoverageLevel: values.coverageLevel,
    sourceAffectedAreas: values.affectedLocations.split(",").map(x => x.trim()).filter(Boolean),
    sourceLink: values.sourceUrl,
    ...(evidence !== undefined ? { evidence } : {}),
  };
}

export function saveAdvisory(values: AdvisoryFormValues, evidence?: unknown) {
  return api("/api/advisories", {
    method: "POST",
    body: JSON.stringify(advisoryPayload(values, evidence)),
  });
}

export function updateAdvisory(id: string, values: AdvisoryFormValues, evidence?: unknown) {
  return api(`/api/advisories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(advisoryPayload(values, evidence)),
  });
}

export function deleteAdvisory(id: string) {
  return api(`/api/advisories/${id}`, { method: "DELETE" });
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
