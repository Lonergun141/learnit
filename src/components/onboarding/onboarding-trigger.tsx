"use client";

import { CircleQuestionMark } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import { useOnboarding } from "./onboarding-provider";

interface OnboardingTriggerProps {
  /** "rail" matches the fixed navigation cells; "bar" suits the top strip. */
  variant?: "rail" | "bar";
  className?: string;
}

/** Reopens the walkthrough on demand. */
export function OnboardingTrigger({ variant = "rail", className }: OnboardingTriggerProps) {
  const { openWalkthrough } = useOnboarding();

  if (variant === "bar") {
    return (
      <button
        className={cn("bracket-link min-h-8", className)}
        onClick={openWalkthrough}
        type="button"
      >
        <CircleQuestionMark size={13} />
        Help
      </button>
    );
  }

  return (
    <button
      className={cn(
        "group relative flex h-[4.75rem] w-full flex-col items-center justify-center gap-1.5 border-t border-line font-mono text-[0.5625rem] uppercase leading-none tracking-[0.05em] text-ink-faint transition-colors duration-200 hover:bg-surface-muted/60 hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal",
        className,
      )}
      onClick={openWalkthrough}
      type="button"
    >
      <CircleQuestionMark size={17} strokeWidth={1.6} />
      Help
    </button>
  );
}
