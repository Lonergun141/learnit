"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { completeOnboardingAction } from "@/app/(app)/actions";

import { OnboardingModal } from "./onboarding-modal";

interface OnboardingContextValue {
  openWalkthrough: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/**
 * Holds the walkthrough for the whole shell, so the rail's help control and the
 * automatic first-visit opening drive one dialog instead of two.
 */
export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return context;
}

interface OnboardingProviderProps {
  /** True when the account has never finished or skipped the walkthrough. */
  pending: boolean;
  children: ReactNode;
}

export function OnboardingProvider({ pending, children }: OnboardingProviderProps) {
  // A first visit opens the walkthrough on the very first render rather than in
  // an effect, so there is no flash of the shell before it appears.
  const [open, setOpen] = useState(pending);
  // Only the first visit needs recording; replays from the rail must not spend
  // a round trip re-writing a timestamp the action would reject anyway.
  const unrecorded = useRef(pending);

  const openWalkthrough = useCallback(() => setOpen(true), []);

  const dismiss = useCallback(() => {
    setOpen(false);
    if (!unrecorded.current) return;
    unrecorded.current = false;
    void completeOnboardingAction();
  }, []);

  const value = useMemo(() => ({ openWalkthrough }), [openWalkthrough]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingModal open={open} onDismiss={dismiss} />
    </OnboardingContext.Provider>
  );
}
