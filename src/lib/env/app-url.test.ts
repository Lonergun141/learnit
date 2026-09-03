import { describe, expect, it } from "vitest";

import { resolveAppUrl } from "./app-url";

const production = { NODE_ENV: "production" } as const;

describe("resolveAppUrl", () => {
  it("uses the configured public origin", () => {
    expect(
      resolveAppUrl({ source: { ...production, NEXT_PUBLIC_APP_URL: "https://learnit.example" } }),
    ).toBe("https://learnit.example");
  });

  it("strips a trailing slash and any path so callers can append one", () => {
    expect(
      resolveAppUrl({ source: { ...production, NEXT_PUBLIC_APP_URL: "https://learnit.example/" } }),
    ).toBe("https://learnit.example");
    expect(
      resolveAppUrl({
        source: { ...production, NEXT_PUBLIC_APP_URL: "https://learnit.example/app?x=1" },
      }),
    ).toBe("https://learnit.example");
  });

  it("treats a blank variable as unset rather than as an origin", () => {
    expect(
      resolveAppUrl({
        source: {
          ...production,
          NEXT_PUBLIC_APP_URL: "   ",
          VERCEL_PROJECT_PRODUCTION_URL: "learnit.vercel.app",
        },
      }),
    ).toBe("https://learnit.vercel.app");
  });

  it("refuses a localhost origin in production and uses the Vercel domain", () => {
    expect(
      resolveAppUrl({
        source: {
          ...production,
          NEXT_PUBLIC_APP_URL: "http://localhost:3000",
          VERCEL_PROJECT_PRODUCTION_URL: "learnit.vercel.app",
        },
      }),
    ).toBe("https://learnit.vercel.app");
  });

  it("falls back to the request origin when nothing is configured", () => {
    expect(
      resolveAppUrl({ source: production, requestOrigin: "https://learnit.example" }),
    ).toBe("https://learnit.example");
  });

  it("falls back to the local default when every candidate is unusable", () => {
    // The loopback request origin is refused in production, so this is the
    // last-resort default rather than that origin being accepted.
    expect(
      resolveAppUrl({ source: production, requestOrigin: "http://localhost:3000" }),
    ).toBe("http://localhost:3000");
    expect(resolveAppUrl({ source: production })).toBe("http://localhost:3000");
  });

  it("keeps localhost usable in development", () => {
    expect(
      resolveAppUrl({
        source: { NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
      }),
    ).toBe("http://localhost:3000");
  });

  it("rejects a value that is not an absolute http(s) URL", () => {
    expect(
      resolveAppUrl({
        source: {
          ...production,
          NEXT_PUBLIC_APP_URL: "learnit.example",
          VERCEL_PROJECT_PRODUCTION_URL: "learnit.vercel.app",
        },
      }),
    ).toBe("https://learnit.vercel.app");
    expect(
      resolveAppUrl({
        source: {
          ...production,
          NEXT_PUBLIC_APP_URL: "javascript:alert(1)",
          VERCEL_PROJECT_PRODUCTION_URL: "learnit.vercel.app",
        },
      }),
    ).toBe("https://learnit.vercel.app");
  });

  it("prefers the stable production domain over a per-deployment host", () => {
    expect(
      resolveAppUrl({
        source: {
          ...production,
          VERCEL_PROJECT_PRODUCTION_URL: "learnit.vercel.app",
          VERCEL_URL: "learnit-abc123-team.vercel.app",
        },
      }),
    ).toBe("https://learnit.vercel.app");
  });
});
