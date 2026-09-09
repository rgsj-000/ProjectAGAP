import { z } from "zod";
import { requireLguUser } from "@/lib/server/auth";
import { fail, ok, AppError } from "@/lib/server/errors";
import { buildPostImpact } from "@/lib/server/postImpact";
export async function POST(r: Request) {
 try { const { supabase } = await requireLguUser(["admin", "lgu_reviewer"]);
 const { barangay } = z.object({ barangay: z.string().trim().min(1).max(150) }).parse(await r.json());
 const { data, error } = await supabase.from("post_impact_reviews").select("*,barangays!inner(barangay_name)").eq("barangays.barangay_name",barangay).order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(error) throw error; if(!data) throw new AppError("RECORD_NOT_FOUND","Consolidate field reports first.",404);
 return ok(await buildPostImpact(supabase,data));
 } catch(e) { return fail(e); }
}
