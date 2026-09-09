import { z } from "zod";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { audit } from "@/lib/server/audit";
import { uuid } from "@/lib/server/validation";

const input = z.object({
  reason: z.string().trim().min(5).max(1000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    uuid.parse(params.id);
    const { supabase, user } = await requireLguUser(["admin", "lgu_reviewer"]);
    const { reason } = input.parse(await request.json());

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
        verification_status: "REJECTED",
        verified_by: null,
        verified_at: null,
        raw_content: {
          ...rawContent,
          review: {
            status: "REJECTED",
            reason,
            reviewedBy: user.id,
            reviewedAt: new Date().toISOString(),
          },
        },
      })
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
