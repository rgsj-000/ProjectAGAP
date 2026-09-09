import { z } from "zod";
import { requireLguUser } from "@/lib/server/auth";
import { uuid } from "@/lib/server/validation";
import { fail, ok } from "@/lib/server/errors";
export async function POST(r: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireLguUser(["admin", "lgu_reviewer"]);
    const { id } = await ctx.params; uuid.parse(id);
    const v = z.object({ reason: z.string().trim().min(10).max(2000) }).parse(await r.json());
    const { data, error } = await supabase.rpc("verify_field_report", { p_id: id, p_reason: v.reason });
    if (error) throw error;
    return ok(data);
  } catch (e) { return fail(e); }
}
