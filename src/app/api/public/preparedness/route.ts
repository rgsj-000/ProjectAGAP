import { z } from "zod";
import { fail, ok } from "@/lib/server/errors";
import {
  activeRules,
  activeVerifiedAdvisory,
  camelAdvisory,
} from "@/lib/server/repositories";
import { createPublicDataClient } from "@/lib/server/supabase";

async function getBarangayNames(
  db: ReturnType<typeof createPublicDataClient>,
) {
  const { data, error } = await db
    .from("barangays")
    .select("barangay_name")
    .not("barangay_name", "is", null)
    .order("barangay_name");

  if (error) throw error;

  return (data ?? [])
    .map((barangay) => barangay.barangay_name)
    .filter((name): name is string => Boolean(name));
}

export async function GET(request: Request) {
  try {
    const db = createPublicDataClient();
    const barangay = new URL(request.url).searchParams.get("barangay");

    if (!barangay) {
      return ok(await getBarangayNames(db));
    }

    const validatedBarangay = z
      .string()
      .trim()
      .min(1)
      .max(150)
      .parse(barangay);

    const advisory = await activeVerifiedAdvisory(db, validatedBarangay);
    const rules = await activeRules(db, "HOUSEHOLD");

    return ok({
      barangay: validatedBarangay,
      advisory: camelAdvisory(advisory),
      rules,
      lastSyncAt: new Date().toISOString(),
    });
  } catch (e) {
    return fail(e);
  }
}
