import type { SupabaseClient } from "@supabase/supabase-js";
export async function persistOutput(
  db: SupabaseClient,
  barangayId: string,
  card: Record<string, unknown>,
  snapshot: Record<string, unknown>,
) {
  const { data, error } = await db.rpc("save_operational_output", {
    p_barangay: barangayId,
    p_card: card,
    p_snapshot: snapshot,
  });
  if (error) throw error;
  return { ...card, outputId: data };
}
