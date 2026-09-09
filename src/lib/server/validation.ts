import { z } from "zod";

export const uuid = z.string().uuid();
export const verificationState = z.enum(["UNVERIFIED", "FOR_REVIEW", "VERIFIED", "REJECTED"]);
export const advisoryFields = z.object({
  evidence: z.object({ type: z.string().max(100), reference: z.string().max(500) }).optional(),
  sourceCoverageLevel: z.enum(["PROVINCE","CITY_MUNICIPALITY","BARANGAY","SPECIFIC_AREA"]),
  sourceAffectedAreas: z.array(z.string().trim().min(1)).min(1).max(100),
  sourceAgency: z.string().trim().min(2).max(150), advisoryType: z.string().trim().min(2).max(100),
  bulletinReference: z.string().trim().min(1).max(150), warningInformation: z.string().trim().min(1).max(10000),
  issueTime: z.coerce.date(), validityStart: z.coerce.date(), validityEnd: z.coerce.date(),
  affectedAreas: z.array(z.string().trim().min(1)).min(1).max(100).optional(), sourceLink: z.string().url(),
});
export const advisoryInput = advisoryFields.refine(v => v.validityEnd > v.validityStart, { message: "Validity end must be after validity start.", path: ["validityEnd"] });
export const advisoryUpdateInput = advisoryFields.partial().refine(v => !v.validityStart || !v.validityEnd || v.validityEnd > v.validityStart, { message: "Validity end must be after validity start.", path: ["validityEnd"] });

export const riskInput = z.object({
  barangayId: uuid, advisoryId: uuid, methodologyId: uuid, hazardId: uuid, dataDate: z.string().date(),
  likelihood: z.number().int().positive(), severity: z.number().int().positive(),
  threatLevel: z.number().positive().optional(), adaptiveCapacity: z.number().positive().optional(),
  evidence: z.array(z.string().trim().min(1)).min(1), limitations: z.array(z.string()).default([]), confidenceLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const damageReportInput = z.object({
  advisoryId: uuid,
  damageSummary: z.string().trim().min(1).max(4000),
  serviceDisruption: z.string().max(2000).default(""),
  needs: z.array(z.enum(["food", "water", "shelter", "medicine", "rescue", "restoration"])).default([]),
  isDemo: z.boolean().default(false),
  clientId: z.string().uuid(), barangayId: uuid.optional(), barangayName: z.string().trim().min(1).max(150).optional(), purok: z.string().trim().max(100).optional(),
  reportedAffectedPersons: z.number().int().nonnegative(), reportedAffectedHouseholds: z.number().int().nonnegative(),
  vulnerableGroups: z.record(z.number().int().nonnegative()).default({}), damageType: z.string().trim().min(1),
  severity: z.enum(["MINOR", "MODERATE", "MAJOR", "DESTROYED", "UNDETERMINED"]),
  criticalFacilityCondition: z.string().max(2000).optional(), accessCondition: z.string().max(2000).optional(),
  evidence: z.array(z.object({ type: z.string(), reference: z.string() })).default([]), source: z.string().trim().min(1),
  deviceTimestamp: z.coerce.date(), baseVersion: z.number().int().nonnegative().default(0),
}).refine(v => Boolean(v.barangayId || v.barangayName), { message: "barangayId or barangayName is required." });

export const householdRequest = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("code"), householdCode: z.string().trim().regex(/^[A-Z0-9-]{6,40}$/), language: z.enum(["en", "fil"]).default("en") }),
  z.object({ mode: z.literal("generic"), barangay: z.string().trim().min(1).max(150), language: z.enum(["en", "fil"]).default("en") }),
  z.object({ mode: z.literal("quick-profile"), barangay: z.string().trim().min(1).max(150), householdSize: z.number().int().min(1).max(100).nullable(), hasInfantOrChild: z.boolean(), hasOlderPerson: z.boolean(), hasPwdOrMobilityLimitation: z.boolean(), hasEssentialMedicineNeed: z.boolean(), hasPets: z.boolean(), housingCharacteristics: z.string().max(1000), communicationMethods: z.array(z.string().max(100)).max(10), language: z.enum(["en", "fil"]).default("en") }),
]);
