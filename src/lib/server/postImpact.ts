import type { SupabaseClient } from "@supabase/supabase-js";
import { postImpactFacts } from "@/lib/domain/postImpact";
import { generatePostImpactActionCard } from "@/lib/domain/actionCards";
import { activeRules } from "./repositories";
import { persistOutput } from "./output";

export async function buildPostImpact(
  db: SupabaseClient,
  review: Record<string, any>,
) {
  const { data: needs, error } = await db
    .from("needs_reports")
    .select("*")
    .in("damage_report_id", review.report_ids ?? []);
  if (error) throw error;
  const rules = await activeRules(db, "LGU");
  const card = generatePostImpactActionCard({
    barangay: review.barangays.barangay_name,
    eventReference: review.event_reference,
    facts: postImpactFacts(review, needs ?? []),
    rules,
  });
  return {
    review,
    card: await persistOutput(db, review.barangay_id, card, {
      review,
      needs,
      rules,
    }),
  };
}
