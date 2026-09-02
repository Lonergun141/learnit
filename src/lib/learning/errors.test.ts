import { describe, expect, it } from "vitest";

import { describeDatabaseFailure } from "./errors";

describe("describeDatabaseFailure", () => {
  it("explains the daily capture limit in the user's own terms", () => {
    expect(
      describeDatabaseFailure(
        { message: "Daily learning item limit reached" },
        "We could not save that link. Please try again.",
      ),
    ).toBe("You have reached today's capture limit. Save more links tomorrow.");
  });

  it("explains an item that is no longer retryable", () => {
    expect(
      describeDatabaseFailure(
        { message: "Learning item is not in a retryable state" },
        "fallback",
      ),
    ).toBe("This item cannot be retried from its current state.");
  });

  it("explains a missing item without leaking that it may belong to someone else", () => {
    expect(describeDatabaseFailure({ message: "Learning item not found" }, "fallback")).toBe(
      "That item is no longer in your library.",
    );
  });

  it("explains unconfigured playlist capture", () => {
    expect(
      describeDatabaseFailure(
        { message: "Playlist capture must be configured and enabled" },
        "fallback",
      ),
    ).toBe("Turn on playlist capture and save a playlist first.");
  });

  it("falls back for an unrecognized database error", () => {
    expect(
      describeDatabaseFailure({ message: 'duplicate key value violates unique constraint "x"' }, "fallback"),
    ).toBe("fallback");
  });

  it("falls back when there is no error detail at all", () => {
    expect(describeDatabaseFailure(null, "fallback")).toBe("fallback");
    expect(describeDatabaseFailure({}, "fallback")).toBe("fallback");
  });
});
