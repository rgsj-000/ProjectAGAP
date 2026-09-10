import { resolveAdvisoryApplicability } from "@/lib/domain/advisoryCoverage";
import { audit } from "@/lib/server/audit";
import { requireLguUser } from "@/lib/server/auth";
import { AppError, fail, ok } from "@/lib/server/errors";
import { advisoryUpdateInput, uuid } from "@/lib/server/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const params = await context.params;
  try {
    uuid.parse(params.id);
    const { supabase, user } = await requireLguUser([
      "admin",
      "lgu_reviewer",
      "lgu_encoder",
    ]);
    const value = advisoryUpdateInput.parse(await request.json());

    const { data: old, error: oldError } = await supabase
      .from("advisories")
      .select("*")
      .eq("id", params.id)
      .single();
    if (oldError) throw oldError;

    const rawContent =
      old.raw_content && typeof old.raw_content === "object"
        ? old.raw_content
        : {};

    const sourceCoverageLevel =
      value.sourceCoverageLevel ??
      rawContent.sourceCoverage?.level ??
      "SPECIFIC_AREA";
    const sourceAffectedAreas =
      value.sourceAffectedAreas ??
      rawContent.sourceCoverage?.areas ??
      old.affected_areas ??
      [];

    const { data: barangays, error: barangaysError } = await supabase
      .from("barangays")
      .select("barangay_name,city")
      .limit(1000);
    if (barangaysError) throw barangaysError;

    const applicableBarangays = resolveAdvisoryApplicability({
      coverageLevel: sourceCoverageLevel,
      sourceAreas: sourceAffectedAreas,
      barangays: barangays ?? [],
    });

    const patch: Record<string, unknown> = {
      verification_status: "FOR_REVIEW",
      verified_by: null,
      verified_at: null,
      affected_areas: applicableBarangays,
      raw_content: {
        ...rawContent,
        evidence:
          value.evidence !== undefined
            ? value.evidence
            : rawContent.evidence ?? null,
        sourceCoverage: {
          level: sourceCoverageLevel,
          areas: sourceAffectedAreas,
        },
        sourceMessage:
          value.message !== undefined
            ? value.message
            : rawContent.sourceMessage ?? null,
        sourcePrecautions:
          value.precautions !== undefined
            ? value.precautions
            : rawContent.sourcePrecautions ?? [],
        resolvedApplicability: {
          barangays: applicableBarangays,
          resolvedAt: new Date().toISOString(),
          requiresReviewerConfirmation: true,
        },
        review: {
          status: "FOR_REVIEW",
          reason: "Advisory content was edited and requires re-verification.",
          updatedBy: user.id,
          updatedAt: new Date().toISOString(),
        },
      },
    };

    const fieldMap = {
      sourceAgency: "source_agency",
      advisoryType: "advisory_type",
      bulletinReference: "bulletin_reference",
      warningInformation: "warning_information",
      issueTime: "issue_time",
      validityStart: "validity_start",
      validityEnd: "validity_end",
      sourceLink: "source_link",
    } as const;

    for (const [key, column] of Object.entries(fieldMap)) {
      const next = (value as Record<string, unknown>)[key];
      if (next !== undefined) {
        patch[column] = next instanceof Date ? next.toISOString() : next;
      }
    }

    const { data, error } = await supabase
      .from("advisories")
      .update(patch)
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;

    await audit(supabase, {
      userId: user.id,
      action: "MODIFICATION",
      entityType: "advisory",
      entityId: params.id,
      oldValue: old,
      newValue: data,
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const params = await context.params;
  try {
    uuid.parse(params.id);
    const { supabase, user } = await requireLguUser(["admin"]);

    const { data: advisory, error: advisoryError } = await supabase
      .from("advisories")
      .select("*")
      .eq("id", params.id)
      .single();
    if (advisoryError) throw advisoryError;

    const dependentTables = [
      "risk_assessments",
      "damage_reports",
      "post_impact_reviews",
    ] as const;

    const dependencyChecks = await Promise.all(
      dependentTables.map((table) =>
        supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("advisory_id", params.id),
      ),
    );

    dependencyChecks.forEach((result) => {
      if (result.error) throw result.error;
    });

    const dependencyCount = dependencyChecks.reduce(
      (sum, result) => sum + Number(result.count ?? 0),
      0,
    );

    if (dependencyCount > 0) {
      throw new AppError(
        "INVALID_INPUT",
        "This advisory already has assessment or incident records and cannot be deleted. Keep it for audit history or return/edit it instead.",
        409,
      );
    }

    await audit(supabase, {
      userId: user.id,
      action: "DELETE",
      entityType: "advisory",
      entityId: params.id,
      oldValue: advisory,
      newValue: {
        deletedAt: new Date().toISOString(),
        deletedBy: user.id,
      },
    });

    const { error } = await supabase
      .from("advisories")
      .delete()
      .eq("id", params.id);
    if (error) throw error;

    return ok({ id: params.id, deleted: true });
  } catch (error) {
    return fail(error);
  }
}
