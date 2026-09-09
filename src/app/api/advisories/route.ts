import { advisoryInput } from "@/lib/server/validation";
import { AppError, fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { audit } from "@/lib/server/audit";
import { resolveAdvisoryApplicability } from "@/lib/domain/advisoryCoverage";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireLguUser();
    const url = new URL(request.url);
    let q = supabase.from("advisories").select("*").order("issue_time", { ascending: false });
    if (url.searchParams.get("active") === "true") {
      q = q
        .eq("verification_status", "VERIFIED")
        .lte("validity_start", new Date().toISOString())
        .gt("validity_end", new Date().toISOString());
    }
    const barangay = url.searchParams.get("barangay");
    if (barangay) q = q.contains("affected_areas", [barangay]);
    const { data, error } = await q;
    if (error) throw error;
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireLguUser([
      "admin",
      "lgu_reviewer",
      "lgu_encoder",
    ]);
    const v = advisoryInput.parse(await request.json());

    const { data: barangays, error: barangaysError } = await supabase
      .from("barangays")
      .select("barangay_name,city")
      .limit(1000);
    if (barangaysError) throw barangaysError;

    const applicableBarangays = resolveAdvisoryApplicability({
      coverageLevel: v.sourceCoverageLevel,
      sourceAreas: v.sourceAffectedAreas,
      barangays: barangays ?? [],
    });

    const rawContent = {
      evidence: v.evidence ?? null,
      sourceCoverage: {
        level: v.sourceCoverageLevel,
        areas: v.sourceAffectedAreas,
      },
      resolvedApplicability: {
        barangays: applicableBarangays,
        resolvedAt: new Date().toISOString(),
        requiresReviewerConfirmation: true,
      },
    };

    const bulletinReference = v.bulletinReference.trim();
    const { data: existing, error: existingError } = await supabase
      .from("advisories")
      .select("*")
      .eq("bulletin_reference", bulletinReference)
      .maybeSingle();
    if (existingError) throw existingError;

    const record = {
      source_agency: v.sourceAgency,
      advisory_type: v.advisoryType,
      bulletin_reference: bulletinReference,
      warning_information: v.warningInformation,
      issue_time: v.issueTime.toISOString(),
      validity_start: v.validityStart.toISOString(),
      validity_end: v.validityEnd.toISOString(),
      affected_areas: applicableBarangays,
      source_link: v.sourceLink,
      verification_status: "FOR_REVIEW",
      verified_by: null,
      verified_at: null,
      raw_content: rawContent,
    };

    if (existing) {
      const existingSource = String(existing.source_agency ?? "").trim().toLowerCase();
      if (existingSource && existingSource !== v.sourceAgency.trim().toLowerCase()) {
        throw new AppError(
          "INVALID_INPUT",
          `Bulletin/reference "${bulletinReference}" already exists under another issuing source.`,
          409,
        );
      }

      const { data, error } = await supabase
        .from("advisories")
        .update(record)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;

      await audit(supabase, {
        userId: user.id,
        action: "MODIFICATION",
        entityType: "advisory",
        entityId: existing.id,
        oldValue: existing,
        newValue: data,
      });
      return ok(data);
    }

    const { data, error } = await supabase
      .from("advisories")
      .insert({ ...record, created_by: user.id })
      .select()
      .single();
    if (error) throw error;

    await audit(supabase, {
      userId: user.id,
      action: "CREATE",
      entityType: "advisory",
      entityId: data.id,
      newValue: data,
    });

    return ok(data, 201);
  } catch (e) {
    return fail(e);
  }
}
