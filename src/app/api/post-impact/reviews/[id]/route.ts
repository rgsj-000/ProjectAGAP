import { z } from "zod";
import { requireLguUser } from "@/lib/server/auth";
import { uuid } from "@/lib/server/validation";
import { fail, ok } from "@/lib/server/errors";
import { audit } from "@/lib/server/audit";

const schema = z.object({
  action: z.enum(["REQUEST_UPDATE", "RECORD_DECISION"]),
  reason: z.string().trim().min(10).max(2000),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    uuid.parse(params.id);
    const { supabase, user } = await requireLguUser(["admin", "lgu_reviewer"]);
    const input = schema.parse(await request.json());

    const { data: previous, error: previousError } = await supabase
      .from("post_impact_reviews")
      .select("*")
      .eq("id", params.id)
      .single();
    if (previousError) throw previousError;

    const reviewState =
      input.action === "REQUEST_UPDATE" ? "UPDATE_REQUESTED" : "DECISION_RECORDED";

    const { data, error } = await supabase
      .from("post_impact_reviews")
      .update({ review_state: reviewState })
      .eq("id", params.id)
      .select("*")
      .single();
    if (error) throw error;

    await audit(supabase, {
      userId: user.id,
      action: input.action,
      entityType: "post_impact_review",
      entityId: params.id,
      oldValue: previous,
      newValue: data,
      reason: input.reason,
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
