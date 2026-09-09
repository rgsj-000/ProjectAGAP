import { z } from "zod";
import { requireLguUser } from "@/lib/server/auth";
import { uuid } from "@/lib/server/validation";
import { fail, ok } from "@/lib/server/errors";
import { buildPostImpact } from "@/lib/server/postImpact";
export async function POST(r: Request) {
 try { const { supabase } = await requireLguUser(["admin", "lgu_reviewer"]);
 const { reviewId } = z.object({ reviewId: uuid }).parse(await r.json());
 const { data, error } = await supabase.from("post_impact_reviews").select("*,barangays(barangay_name)").eq("id", reviewId).single();
 if(error) throw error; return ok(await buildPostImpact(supabase,data));
 } catch(e) { return fail(e); }
}
