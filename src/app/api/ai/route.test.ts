import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/server/errors";

const { explainWithGemini, requireLguUser } = vi.hoisted(() => ({
  explainWithGemini: vi.fn(),
  requireLguUser: vi.fn(),
}));

vi.mock("@/lib/server/gemini", () => ({ explainWithGemini }));
vi.mock("@/lib/server/auth", () => ({ requireLguUser }));

describe("AI route", () => {
  beforeEach(() => {
    explainWithGemini.mockReset();
    requireLguUser.mockReset();

    requireLguUser.mockResolvedValue({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  content: {
                    situation: { riskCategory: "HIGH" },
                    recommendedActions: [],
                  },
                  source_snapshot: { advisoryId: "verified-advisory" },
                },
                error: null,
              }),
            }),
          }),
        }),
      },
    });
  });

  it("returns a safe timeout reason with the deterministic fallback", async () => {
    explainWithGemini.mockRejectedValue(new AppError(
      "GEMINI_UNAVAILABLE",
      "Gemini response failed validation. Use the deterministic template.",
      503,
      { reason: "timeout", elapsedMs: 60_000 },
    ));

    const { POST } = await import("./route");
    const response = await POST(new Request("https://example.test/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        outputId: "11111111-1111-4111-8111-111111111111",
        language: "en",
        mode: "brief",
      }),
    }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.fallback).toBe(true);
    expect(json.data.fallbackReason).toBe("timeout");
    expect(json.data.fallbackMessage).toBe(
      "Gemini took too long to respond. This brief uses persisted verified data and approved actions.",
    );
    expect(json.data.text).toContain("Situation:");
    expect(JSON.stringify(json)).not.toContain("elapsedMs");
  });

  it("does not expose unapproved Gemini error details", async () => {
    explainWithGemini.mockRejectedValue(new AppError(
      "GEMINI_UNAVAILABLE",
      "provider request contained api-key-secret",
      503,
      { reason: "api-key-secret", raw: "private provider detail" },
    ));

    const { POST } = await import("./route");
    const response = await POST(new Request("https://example.test/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        outputId: "11111111-1111-4111-8111-111111111111",
        language: "en",
        mode: "brief",
      }),
    }));
    const json = await response.json();
    const serialized = JSON.stringify(json);

    expect(json.data.fallbackReason).toBe("unavailable");
    expect(serialized).not.toContain("api-key-secret");
    expect(serialized).not.toContain("private provider detail");
  });
});
