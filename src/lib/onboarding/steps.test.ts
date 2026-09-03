import { describe, expect, it } from "vitest";

import {
  clampStepIndex,
  isLastStep,
  nextStepIndex,
  onboardingSteps,
  previousStepIndex,
  stepProgress,
} from "./steps";

describe("onboarding steps", () => {
  it("describes every page with content the modal can render", () => {
    expect(onboardingSteps.length).toBeGreaterThan(1);
    for (const step of onboardingSteps) {
      expect(step.eyebrow).not.toHaveLength(0);
      expect(step.title).not.toHaveLength(0);
      expect(step.body).not.toHaveLength(0);
      expect(step.points.length).toBeGreaterThan(0);
    }
  });

  it("stops at the first page when moving back from the start", () => {
    expect(previousStepIndex(0, 5)).toBe(0);
  });

  it("stops at the last page when moving past the end", () => {
    expect(nextStepIndex(4, 5)).toBe(4);
  });

  it("clamps an out-of-range index from either side", () => {
    expect(clampStepIndex(-3, 5)).toBe(0);
    expect(clampStepIndex(99, 5)).toBe(4);
  });

  it("recognises the final page", () => {
    expect(isLastStep(3, 5)).toBe(false);
    expect(isLastStep(4, 5)).toBe(true);
  });

  it("reports progress as a fraction that reaches one on the last page", () => {
    expect(stepProgress(0, 5)).toBeCloseTo(0.2);
    expect(stepProgress(4, 5)).toBe(1);
  });

  it("treats an empty deck as complete rather than dividing by zero", () => {
    expect(stepProgress(0, 0)).toBe(0);
    expect(clampStepIndex(2, 0)).toBe(0);
  });
});
