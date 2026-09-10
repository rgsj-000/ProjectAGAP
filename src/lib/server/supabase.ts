import { createBrowserClient as createBrowserSupabase } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AppError } from "./errors";

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new AppError(
      "CONFIGURATION_ERROR",
      "Supabase public environment variables are missing.",
      503,
    );
  }
  return { url, key };
}

export function createBrowserClient() {
  const { url, key } = publicConfig();
  return createBrowserSupabase(url, key);
}

/**
 * Server-side client that intentionally uses only the public anon key.
 *
 * Public preparedness flows should prefer this client so a bad service-role
 * secret cannot take the public Household Action Card offline. RLS remains
 * the authority for what this client can read.
 */
export function createPublicDataClient() {
  const { url, key } = publicConfig();
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new AppError(
      "CONFIGURATION_ERROR",
      "Supabase server environment variables are missing.",
      503,
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createRequestClient() {
  const { url, key } = publicConfig();
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items: Array<{ name: string; value: string; options?: any }>) => {
        try {
          items.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* Server Component */
        }
      },
    },
  });
}
