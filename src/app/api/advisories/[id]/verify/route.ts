import { uuid } from "@/lib/server/validation";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { audit } from "@/lib/server/audit";

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    uuid.parse(params.id);
    const { supabase, user } = await requireLguUser(["admin", "lgu_reviewer"]);

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

    const { data, error } = await supabase
      .from("advisories")
      .update({
        verification_status: "VERIFIED",
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        raw_content: {
          ...rawContent,
          review: {
            status: "VERIFIED",
            reviewedBy: user.id,
            reviewedAt: new Date().toISOString(),
            applicabilityConfirmed: true,
          },
        },
      })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;

    await audit(supabase, {
      userId: user.id,
      action: "VERIFICATION",
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
