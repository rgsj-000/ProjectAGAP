import { requireLguUser } from "@/lib/server/auth";
import { fail, ok, AppError } from "@/lib/server/errors";
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireLguUser();
    const form = await request.formData(); const file = form.get("file");
    const bucket = form.get("kind") === "advisory" ? "advisory-evidence" : "damage-evidence";
    if (!(file instanceof File) || file.size > 6 * 1024 * 1024 || !["application/pdf", "image/png", "image/jpeg"].includes(file.type)) throw new AppError("INVALID_INPUT", "Choose a PDF, PNG or JPEG up to 6 MB.", 422);
    const path = `${user.id}/${crypto.randomUUID()}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
    if (error) throw error;
    return ok({ type: file.type, reference: `${bucket}/${path}` }, 201);
  } catch (e) { return fail(e); }
}
