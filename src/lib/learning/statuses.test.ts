import { describe, expect, it } from "vitest";

import {
  determineItemPhase,
  determineRetryStage,
  hasWorkInFlight,
  isPhaseInFlight,
  phaseCopy,
  type ItemPhase,
} from "./statuses";

describe("determineItemPhase", () => {
  it("reads a freshly saved item as fetching", () => {
    expect(determineItemPhase({ status: "new", failureStage: null })).toBe("fetching");
  });

  it("reads a fetched item as sorting", () => {
    expect(determineItemPhase({ status: "fetched", failureStage: null })).toBe("sorting");
  });

  it("reads a sorted item as building", () => {
    expect(determineItemPhase({ status: "sorted", failureStage: null })).toBe("building");
  });

  it("reads a finished item as done", () => {
    expect(determineItemPhase({ status: "done", failureStage: null })).toBe("done");
  });

  it("reads a fetch failure as failed", () => {
    expect(determineItemPhase({ status: "failed", failureStage: "fetch" })).toBe("failed");
  });

  // The worker leaves a classify failure at status 'fetched' with a failure stage
  // set, so status alone would read as in-flight and spin an indicator forever.
  it("reads a classify failure as stalled rather than sorting", () => {
    expect(determineItemPhase({ status: "fetched", failureStage: "classify" })).toBe("stalled");
  });

  it("reads a build failure as stalled rather than building", () => {
    expect(determineItemPhase({ status: "sorted", failureStage: "build_topic" })).toBe("stalled");
  });

  it("returns to in-flight once a retry clears the failure stage", () => {
    expect(determineItemPhase({ status: "fetched", failureStage: null })).toBe("sorting");
  });
});

describe("isPhaseInFlight", () => {
  it.each<[ItemPhase, boolean]>([
    ["fetching", true],
    ["sorting", true],
    ["building", true],
    ["stalled", false],
    ["done", false],
    ["failed", false],
  ])("treats %s as in-flight: %s", (phase, expected) => {
    expect(isPhaseInFlight(phase)).toBe(expected);
  });
});

describe("hasWorkInFlight", () => {
  it("is false for an empty list", () => {
    expect(hasWorkInFlight([])).toBe(false);
  });

  it("is false when every item has settled", () => {
    expect(
      hasWorkInFlight([
        { status: "done", failureStage: null },
        { status: "failed", failureStage: "fetch" },
        { status: "sorted", failureStage: "build_topic" },
      ]),
    ).toBe(false);
  });

  it("is true when a single item is still moving", () => {
    expect(
      hasWorkInFlight([
        { status: "done", failureStage: null },
        { status: "new", failureStage: null },
      ]),
    ).toBe(true);
  });
});

describe("phaseCopy", () => {
  it("gives every phase a badge and a row label", () => {
    const phases: ItemPhase[] = [
      "fetching",
      "sorting",
      "building",
      "stalled",
      "done",
      "failed",
    ];
    for (const phase of phases) {
      expect(phaseCopy[phase].badge).toBeTruthy();
      expect(phaseCopy[phase].detail).toBeTruthy();
    }
  });
});

describe("determineRetryStage", () => {
  it("still routes a classify failure back to the classify stage", () => {
    expect(determineRetryStage({ status: "fetched", failureStage: "classify" })).toBe("classify");
  });

  it("returns null for an item that is not stuck", () => {
    expect(determineRetryStage({ status: "done", failureStage: null })).toBeNull();
  });
});
