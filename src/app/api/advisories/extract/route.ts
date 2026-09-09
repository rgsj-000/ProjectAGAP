import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { extractAdvisoryWithGemini } from "@/lib/server/advisoryExtraction";

export const runtime = "nodejs";

const MAX_ADVISORY_FILE_BYTES = 6 * 1024 * 1024;

type AdvisoryMimeType = "application/pdf" | "image/png" | "image/jpeg";

const MIME_BY_EXTENSION = new Map<string, AdvisoryMimeType>([
  ["pdf", "application/pdf"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
]);

function fileExtension(name: string) {
  return name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "" : "";
}

export async function POST(request: Request) {
  try {
    await requireLguUser(["admin", "lgu_reviewer", "lgu_encoder"]);

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { success: false, error: { message: "Attach one official advisory file." } },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_ADVISORY_FILE_BYTES) {
      return Response.json(
        { success: false, error: { message: "Advisory file must be 6 MB or smaller." } },
        { status: 413 },
      );
    }

    const extension = fileExtension(file.name);
    const expectedMime = MIME_BY_EXTENSION.get(extension);
    const mimeType = file.type || expectedMime;

    if (!expectedMime || mimeType !== expectedMime) {
      return Response.json(
        {
          success: false,
          error: { message: "Use a PDF, PNG, JPG, or JPEG advisory file." },
        },
        { status: 415 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await extractAdvisoryWithGemini({
      bytes,
      mimeType: expectedMime,
      fileName: file.name,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
