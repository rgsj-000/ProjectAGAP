import type { SupabaseClient } from "@supabase/supabase-js";

export async function audit(supabase: SupabaseClient, event: {
  userId?: string | null; action: string; entityType: string; entityId?: string | null;
  oldValue?: unknown; newValue?: unknown; reason?: string | null; metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("audit_logs").insert({
    user_id: event.userId ?? null, action: event.action, entity_type: event.entityType,
    entity_id: event.entityId ?? null, old_value: event.oldValue ?? null,
    new_value: event.newValue ?? null, reason: event.reason ?? null, metadata: event.metadata ?? {},
  });
  if (error) throw error;
}
