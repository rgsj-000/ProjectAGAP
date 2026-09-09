import { z } from "zod";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { damageReportInput } from "@/lib/server/validation";
import { saveFieldReport } from "@/lib/server/fieldReports";
export async function POST(request: Request) {
  try {
    const { supabase } = await requireLguUser();
    const { records } = z.object({ records: z.array(damageReportInput).max(100) }).parse(await request.json());
    const results = [];
    for (const record of records) results.push(await saveFieldReport(supabase, record));
    return ok({ results, lastSyncAt: new Date().toISOString(), conflictCount: results.filter(r => r.status === "ACTION_REQUIRED").length });
  } catch (e) { return fail(e); }
}
