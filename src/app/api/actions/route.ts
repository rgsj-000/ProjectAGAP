import { requireLguUser } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/errors";
import { uuid } from "@/lib/server/validation";
export async function GET(request: Request) {
  try {
    const { supabase } = await requireLguUser();
    const outputId = uuid.parse(new URL(request.url).searchParams.get("outputId"));
    const { data, error } = await supabase.from("operational_actions").select("*").eq("generated_output_id", outputId).order("created_at");
    if (error) throw error; return ok(data);
  } catch (e) { return fail(e); }
}
