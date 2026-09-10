import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiClientError } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("preserves the server error code and HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication is required.",
              details: { route: "/api/operations" },
            },
          }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
      ),
    );

    const request = api("/api/operations");

    await expect(request).rejects.toBeInstanceOf(ApiClientError);
    await expect(request).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
      details: { route: "/api/operations" },
    });
  });
});
