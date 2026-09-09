import { createAdminClient } from "@/lib/server/supabase";
import { activeRules, activeVerifiedAdvisory, camelAdvisory } from "@/lib/server/repositories";
import { fail, ok } from "@/lib/server/errors";
import { z } from "zod";
export async function GET(request: Request) {
  try {
    const db = createAdminClient();
    const barangay = new URL(request.url).searchParams.get("barangay");
    if (!barangay) {
      const { data, error } = await db.from("barangays").select("barangay_name").order("barangay_name");
      if (error) throw error; return ok(data.map(b => b.barangay_name));
    }
    z.string().trim().min(1).max(150).parse(barangay);
    return ok({ barangay, advisory: camelAdvisory(await activeVerifiedAdvisory(db, barangay)), rules: await activeRules(db, "HOUSEHOLD"), lastSyncAt: new Date().toISOString() });
  } catch (e) { return fail(e); }
}
