import { advisoryInput } from "@/lib/server/validation";
import { AppError, fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { audit } from "@/lib/server/audit";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireLguUser();
    const url = new URL(request.url);

    let query = supabase
      .from("advisories")
      .select("*")
      .order("issue_time", { ascending: false });

    if (url.searchParams.get("active") === "true") {
      query = query
        .eq("verification_status", "VERIFIED")
        .lte("validity_start", new Date().toISOString())
        .gt("validity_end", new Date().toISOString());
    }

    const barangay = url.searchParams.get("barangay");
    if (barangay) query = query.contains("affected_areas", [barangay]);

    const { data, error } = await query;
    if (error) throw error;

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireLguUser([
      "admin",
      "lgu_reviewer",
      "lgu_encoder",
    ]);

    const value = advisoryInput.parse(await request.json());
    const bulletinReference = value.bulletinReference.trim();
    const sourceAgency = value.sourceAgency.trim();

    const { data: existing, error: existingError } = await supabase
      .from("advisories")
      .select("*")
      .eq("bulletin_reference", bulletinReference)
      .maybeSingle();

    if (existingError) throw existingError;

    const record = {
      source_agency: sourceAgency,
      advisory_type: value.advisoryType,
      bulletin_reference: bulletinReference,
      warning_information: value.warningInformation,
      issue_time: value.issueTime.toISOString(),
      validity_start: value.validityStart.toISOString(),
      validity_end: value.validityEnd.toISOString(),
      affected_areas: value.affectedAreas,
      source_link: value.sourceLink,
      verification_status: "UNVERIFIED",
      raw_content: value.evidence
        ? { evidence: value.evidence }
        : existing?.raw_content ?? {},
    };

    if (existing) {
      const existingSource = String(existing.source_agency ?? "")
        .trim()
        .toLocaleLowerCase();
      const incomingSource = sourceAgency.toLocaleLowerCase();

      if (existingSource && existingSource !== incomingSource) {
        throw new AppError(
          "INVALID_INPUT",
          `Bulletin/reference "${bulletinReference}" already exists under another issuing source. Use the correct reference number or open the existing advisory.`,
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
      .insert({
        ...record,
        created_by: user.id,
      })
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
  } catch (error) {
    return fail(error);
  }
}
