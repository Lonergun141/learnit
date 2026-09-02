import { describe, expect, it } from "vitest";

import { describeCallbackFailure, safeNextPath } from "./callback";

describe("auth callback", () => {
  it("keeps a safe relative next path", () => {
    expect(safeNextPath("/topics")).toBe("/topics");
  });

  it("refuses a protocol-relative or absolute next path", () => {
    expect(safeNextPath("//evil.test")).toBe("/dashboard");
    expect(safeNextPath("https://evil.test")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
  });

  it("prefers the reason Supabase itself gave", () => {
    expect(
      describeCallbackFailure({
        providerError: "access_denied",
        providerDescription: "Email link is invalid or has expired",
        exchangeError: null,
      }),
    ).toBe("Email link is invalid or has expired.");
  });

  it("explains a missing verifier as a different browser rather than an expired link", () => {
    expect(
      describeCallbackFailure({
        providerError: null,
        providerDescription: null,
        exchangeError: "both auth code and code verifier should be non-empty",
      }),
    ).toBe(
      "Open the confirmation link in the same browser you signed up in, then try again.",
    );
  });

  it("falls back when there is no code and no reported error", () => {
    expect(
      describeCallbackFailure({
        providerError: null,
        providerDescription: null,
        exchangeError: null,
      }),
    ).toBe("Your sign-in link is invalid or expired.");
  });

  it("never repeats a trailing full stop", () => {
    expect(
      describeCallbackFailure({
        providerError: "access_denied",
        providerDescription: "Email link is invalid or has expired.",
        exchangeError: null,
      }),
    ).toBe("Email link is invalid or has expired.");
  });
});
