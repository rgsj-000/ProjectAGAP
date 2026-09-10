import { NextResponse } from "next/server";
import {
  LOGIN_PATH,
  OPERATIONS_HOME,
} from "@/lib/domain/applicationRoutes";
import { createRequestClient } from "@/lib/server/supabase";

function callbackError(origin: string) {
  const target = new URL(LOGIN_PATH, origin);
  target.searchParams.set("error", "callback");
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return callbackError(url.origin);
  }

  try {
    const supabase = await createRequestClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return callbackError(url.origin);
    }

    return NextResponse.redirect(new URL(OPERATIONS_HOME, url.origin));
  } catch {
    return callbackError(url.origin);
  }
}
