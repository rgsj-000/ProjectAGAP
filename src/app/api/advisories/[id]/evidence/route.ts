import { fail, ok, AppError } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { uuid } from "@/lib/server/validation";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    uuid.parse(params.id);
    const { supabase } = await requireLguUser(["admin", "lgu_reviewer"]);

    const { data: advisory, error } = await supabase
      .from("advisories")
      .select("raw_content")
      .eq("id", params.id)
      .single();
    if (error) throw error;

    const evidence = advisory?.raw_content?.evidence;
    const reference =
      evidence && typeof evidence.reference === "string"
        ? evidence.reference
        : null;
    if (!reference) {
      throw new AppError(
        "RECORD_NOT_FOUND",
        "No uploaded advisory evidence is attached to this record.",
        404,
      );
    }

    const slash = reference.indexOf("/");
    const bucket = reference.slice(0, slash);
    const path = reference.slice(slash + 1);
    if (!bucket || !path || bucket !== "advisory-evidence") {
      throw new AppError("INVALID_INPUT", "Invalid advisory evidence reference.", 422);
    }

    const { data, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 300);
    if (signedError) throw signedError;

    return ok({ url: data.signedUrl, expiresInSeconds: 300 });
  } catch (error) {
    return fail(error);
  }
}
