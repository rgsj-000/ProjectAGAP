import { AppError } from "./errors";
import { createRequestClient } from "./supabase";

export type LguRole = "admin" | "lgu_reviewer" | "lgu_encoder" | "field_reporter";

export async function requireLguUser(roles?: LguRole[]) {
  const supabase = await createRequestClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AppError("UNAUTHORIZED", "Authentication is required.", 401);
  const { data: profile } = await supabase.from("user_profiles").select("role,active_status,is_active").eq("id", user.id).single();
  if (!profile?.active_status || !profile.is_active) throw new AppError("FORBIDDEN", "This LGU account is inactive.", 403);
  profile.role = profile.role === "ADMIN" ? "admin" : profile.role === "LGU" ? "lgu_encoder" : profile.role;
  if (roles && !roles.includes(profile.role as LguRole)) throw new AppError("FORBIDDEN", "Your LGU role cannot perform this action.", 403);
  return { supabase, user, role: profile.role as LguRole };
}

export function requireOverrideReason(reason: unknown) {
  if (typeof reason !== "string" || reason.trim().length < 10) {
    throw new AppError("INVALID_INPUT", "Overrides require a specific reason of at least 10 characters.", 422);
  }
  return reason.trim();
}
