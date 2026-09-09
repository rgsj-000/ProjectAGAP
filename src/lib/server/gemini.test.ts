import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "./errors";
import { explainWithGemini } from "./gemini";

describe("explainWithGemini", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
  });

  it("allows a pending Gemini response beyond 15 seconds and reports a timeout at 60 seconds", async () => {
    vi.useFakeTimers();
    let aborted = false;

    vi.stubGlobal("fetch", (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          aborted = true;
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      }),
    );

    const result = explainWithGemini({
      task: "Create a brief",
      verifiedInput: { risk: "HIGH" },
      language: "en",
    }).catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(15_000);
    expect(aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(45_000);
    const error = await result;

    expect(aborted).toBe(true);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).details).toMatchObject({ reason: "timeout" });
  });

  it("uses the stable default model when GEMINI_MODEL is blank", async () => {
    process.env.GEMINI_MODEL = "   ";
    let requestedUrl = "";

    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return Promise.resolve(new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                text: "Verified information only.",
                warnings: [],
                sourceFields: ["risk"],
              }),
            }],
          },
        }],
      }), { status: 200, headers: { "content-type": "application/json" } }));
    });

    const result = await explainWithGemini({
      task: "Explain",
      verifiedInput: { risk: "HIGH" },
      language: "en",
    });

    expect(result.text).toBe("Verified information only.");
    expect(requestedUrl).toContain("/models/gemini-3.6-flash:generateContent");
  });

  it("does not write raw transport errors or API keys to logs", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", () => Promise.reject(
      new Error("request failed for ?key=test-key with private provider detail"),
    ));

    await expect(explainWithGemini({
      task: "Explain",
      verifiedInput: { risk: "HIGH" },
      language: "en",
    })).rejects.toBeInstanceOf(AppError);

    const logged = JSON.stringify(errorLog.mock.calls);
    expect(logged).not.toContain("test-key");
    expect(logged).not.toContain("private provider detail");
    expect(logged).toContain("unavailable");
  });

  it("categorizes and logs missing API-key configuration", async () => {
    delete process.env.GEMINI_API_KEY;
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const error = await explainWithGemini({
      task: "Explain",
      verifiedInput: { risk: "HIGH" },
      language: "en",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).details).toMatchObject({ reason: "unavailable" });
    expect(JSON.stringify(errorLog.mock.calls)).toContain("unavailable");
  });

  it("reports timeout when Gemini headers arrive but the response body stalls", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.stubGlobal("fetch", (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = new ReadableStream({
        start(controller) {
          init?.signal?.addEventListener("abort", () => {
            controller.error(new DOMException("The operation was aborted", "AbortError"));
          });
        },
      });
      return Promise.resolve(new Response(body, {
        status: 200,
        headers: { "content-type": "application/json" },
      }));
    });

    const result = explainWithGemini({
      task: "Create a brief",
      verifiedInput: { risk: "HIGH" },
      language: "en",
    }).catch((caught: unknown) => caught);

    await vi.advanceTimersByTimeAsync(60_000);
    const error = await result;

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).details).toMatchObject({ reason: "timeout" });
  });

  it("classifies prohibited Gemini wording as an invalid response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              text: "Issue evacuation order now.",
              warnings: [],
              sourceFields: ["risk"],
            }),
          }],
        },
      }],
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const error = await explainWithGemini({
      task: "Explain",
      verifiedInput: { risk: "HIGH" },
      language: "en",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).details).toMatchObject({ reason: "invalid_response" });
  });
});
