import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/lib/domain/errors";

export type ErrorCode =
  | "UNAUTHORIZED" | "FORBIDDEN" | "INVALID_INPUT" | "ADVISORY_NOT_VERIFIED"
  | "ADVISORY_EXPIRED" | "METHODOLOGY_MISSING" | "ACTION_RULE_MISSING"
  | "SYNCHRONIZATION_CONFLICT" | "STALE_DATA" | "GEMINI_UNAVAILABLE"
  | "RECORD_NOT_FOUND" | "CONFIGURATION_ERROR" | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public status = 400, public details?: unknown) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Request validation failed.", details: error.flatten() } }, { status: 422 });
  }
  if (error instanceof AppError || error instanceof DomainError) {
    return NextResponse.json({ success: false, error: { code: error.code, message: error.message, details: error.details } }, { status: error.status });
  }
  console.error("Unhandled AGAP error", error);
  return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." } }, { status: 500 });
}
