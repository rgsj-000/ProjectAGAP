import { DomainError } from "./errors";
export function assertCurrentAdvisory(
  advisory: {
    verificationStatus: string;
    validityStart?: string;
    validityEnd: string;
    affectedAreas?: string[];
  },
  barangay?: string,
  now = new Date(),
) {
  if (advisory.verificationStatus !== "VERIFIED")
    throw new DomainError("ADVISORY_NOT_VERIFIED", "A verified advisory is required.", 409);
  if (
    !Number.isFinite(Date.parse(advisory.validityEnd)) ||
    Date.parse(advisory.validityEnd) <= now.getTime()
  )
    throw new DomainError("ADVISORY_EXPIRED", "The advisory has expired or has no valid end time.", 409);
  if (
    advisory.validityStart &&
    Date.parse(advisory.validityStart) > now.getTime()
  )
    throw new DomainError("STALE_DATA", "The advisory is not yet effective.", 409);
  if (barangay && !advisory.affectedAreas?.includes(barangay))
    throw new DomainError("INVALID_INPUT", "The advisory does not cover this barangay.", 422);
}
