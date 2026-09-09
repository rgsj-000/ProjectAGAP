import { ok } from "@/lib/server/errors";
export const dynamic = "force-dynamic";
export async function GET() { return ok({ status: "ok", service: "project-agap", time: new Date().toISOString() }); }
