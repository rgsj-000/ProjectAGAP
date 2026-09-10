import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LOGIN_PATH } from "@/lib/domain/applicationRoutes";
import { createRequestClient } from "@/lib/server/supabase";

export const metadata: Metadata = {
  title: "Operations | Project AGAP",
  description: "Authorized Project AGAP disaster decision-support workspace.",
};

export default async function OperationsPage() {
  const supabase = await createRequestClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  return <AppShell />;
}
