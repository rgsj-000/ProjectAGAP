import { saveFieldReport } from "@/lib/server/fieldReports";
import { damageReportInput } from "@/lib/server/validation";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { audit } from "@/lib/server/audit";
import { resolveBarangayId } from "@/lib/server/repositories";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireLguUser();
    const barangayId = new URL(request.url).searchParams.get("barangayId");
    let query = supabase.from("damage_reports").select("*").order("reported_at", { ascending: false });
    if (barangayId) query = query.eq("barangay_id", barangayId);
    const { data, error } = await query; if (error) throw error; return ok(data);
  } catch (error) { return fail(error); }
}


export async function POST(request: Request) {
  try {
    const { supabase } = await requireLguUser();
    return ok(await saveFieldReport(supabase, await request.json()), 201);
  } catch (e) { return fail(e); }
}
