import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("does not fabricate a barangay list when the database is unavailable", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        order: async () => ({ data: null, error: { message: "DB unavailable" } }),
      }),
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("https://example.test/api/public/preparedness"),
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.data).toBeUndefined();
  });
});
