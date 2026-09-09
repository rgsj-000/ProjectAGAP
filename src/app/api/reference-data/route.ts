import { z } from "zod";
import { requireLguUser } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/errors";
import { uuid } from "@/lib/server/validation";
import { audit } from "@/lib/server/audit";
const text = z.string().trim().min(1).max(2000);
const scale = z
  .object({
    min: z.number().int().positive().max(100),
    max: z.number().int().positive().max(100),
  })
  .refine((s) => s.max >= s.min);
const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("capacity"),
    barangayId: uuid,
    evacuationCapacity: z.number().int().nonnegative(),
    temporaryShelterCapacity: z.number().int().nonnegative(),
    source: text,
    validationDate: z.string().date(),
    communicationAccess: z.array(text),
    limitations: z.array(text),
  }),
  z.object({
    kind: z.literal("methodology"),
    name: text,
    source: text,
    version: text,
    likelihoodScale: scale,
    severityScale: scale,
    categories: z
      .array(
        z.object({
          min: z.number().nonnegative(),
          max: z.number().nonnegative(),
          label: text,
        }),
      )
      .min(1),
  }),
  z.object({
    kind: z.literal("rule"),
    ruleId: text,
    phase: z.enum([
      "PRE_DISASTER",
      "HOUSEHOLD",
      "POST_IMMEDIATE",
      "POST_STABILIZATION",
      "POST_MITIGATION",
    ]),
    field: text,
    operator: z.enum(["EQ", "GT", "LT", "TRUTHY", "CONTAINS"]),
    threshold: z.union([z.string(), z.number(), z.boolean()]),
    approvedAction: text,
    approvedActionFil: text,
    whyItApplies: text,
    whyItAppliesFil: text,
    sourceAgency: text,
    sourceDocument: text,
    responsibleUnit: text,
    version: text,
  }),
]);
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireLguUser(["admin", "lgu_reviewer"]);
    const v = schema.parse(await r.json());
    let table: string, record: Record<string, unknown>;
    if (v.kind === "capacity") {
      table = "preparedness_capacities";
      record = {
        barangay_id: v.barangayId,
        evacuation_capacity: v.evacuationCapacity,
        temporary_shelter_capacity: v.temporaryShelterCapacity,
        source: v.source,
        validation_date: v.validationDate,
        communication_access: v.communicationAccess,
        limitations: v.limitations,
      };
    } else if (v.kind === "methodology") {
      for (let l = v.likelihoodScale.min; l <= v.likelihoodScale.max; l++)
        for (let s = v.severityScale.min; s <= v.severityScale.max; s++) {
          if (
            v.categories.filter((c) => l * s >= c.min && l * s <= c.max)
              .length !== 1
          )
            throw new Error(
              "Each possible risk result must match exactly one category.",
            );
        }
      table = "methodologies";
      record = {
        name: v.name,
        description: "Reviewer-recorded adopted methodology",
        source: v.source,
        version: v.version,
        likelihood_scale: v.likelihoodScale,
        severity_scale: v.severityScale,
        parameters: { categories: v.categories },
        active_status: true,
      };
    } else {
      table = "action_rules";
      record = {
        rule_id: v.ruleId,
        disaster_phase: v.phase,
        hazard_or_condition: v.field,
        fact_field: v.field,
        operator: v.operator,
        threshold: v.threshold,
        approved_action: v.approvedAction,
        approved_action_fil: v.approvedActionFil,
        why_it_applies: v.whyItApplies,
        why_it_applies_fil: v.whyItAppliesFil,
        source_agency: v.sourceAgency,
        source_document: v.sourceDocument,
        responsible_unit: v.responsibleUnit,
        version: v.version,
        target_audience: v.phase === "HOUSEHOLD" ? "HOUSEHOLD" : "LGU",
        requires_lgu_confirmation: v.phase !== "HOUSEHOLD",
        active_status: true,
      };
    }
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    await audit(supabase, {
      userId: user.id,
      action:
        v.kind === "methodology" ? "METHODOLOGY_CHANGE" : "REFERENCE_DATA",
      entityType: table,
      entityId: data.id,
      newValue: data,
    });
    return ok(data, 201);
  } catch (e) {
    return fail(e);
  }
}
