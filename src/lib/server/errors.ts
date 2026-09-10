import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/lib/domain/errors";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "ADVISORY_NOT_VERIFIED"
  | "ADVISORY_EXPIRED"
  | "METHODOLOGY_MISSING"
  | "ACTION_RULE_MISSING"
  | "SYNCHRONIZATION_CONFLICT"
  | "STALE_DATA"
  | "GEMINI_UNAVAILABLE"
  | "RECORD_NOT_FOUND"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const value = (error as { message?: unknown }).message;
  return typeof value === "string" ? value : "";
}

function errorCode(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const value = (error as { code?: unknown }).code;
  return typeof value === "string" ? value : "";
}

function isSupabaseCredentialError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("invalid api key") ||
    message.includes("invalid jwt") ||
    errorCode(error) === "PGRST301"
  );
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Request validation failed.",
          details: error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  if (error instanceof AppError || error instanceof DomainError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  if (isSupabaseCredentialError(error)) {
    console.error("AGAP data-service credential error", {
      code: errorCode(error) || undefined,
      message: errorMessage(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONFIGURATION_ERROR",
          message:
            "Preparedness data is temporarily unavailable. Please try again shortly.",
        },
      },
      { status: 503 },
    );
  }

  if (errorCode(error) === "23505") {
    console.warn("AGAP duplicate record rejected", {
      code: errorCode(error),
      message: errorMessage(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "This record already exists.",
        },
      },
      { status: 409 },
    );
  }

  console.error("Unhandled AGAP error", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred.",
      },
    },
    { status: 500 },
  );
}
