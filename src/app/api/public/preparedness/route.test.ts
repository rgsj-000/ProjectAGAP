import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/server/supabase", () => ({
  createPublicDataClient: () => ({
    from: mockFrom,
  }),
}));

describe("public preparedness route", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("falls back to the demo barangay list when the database query fails", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        not: () => ({
          order: async () => ({ data: null, error: { message: "DB unavailable" } }),
        }),
      }),
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("https://example.test/api/public/preparedness"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toContain("Dalahican");
    expect(json.data).toContain("Gulang-gulang");
  });
});
