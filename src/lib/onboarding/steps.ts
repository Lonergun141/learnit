import type { BlueprintVariant } from "@/components/ui/blueprint";

export interface OnboardingStep {
  /** Monospace micro-label above the title. */
  eyebrow: string;
  title: string;
  body: string;
  /** Two or three short lines of substance. */
  points: string[];
  figure: BlueprintVariant;
}

/**
 * The walkthrough content. Five pages, each naming one thing the app does and
 * where it happens — a briefing, not a guided tour.
 */
export const onboardingSteps: OnboardingStep[] = [
  {
    eyebrow: "Capture",
    title: "Save a link",
    body: "Paste a YouTube video or an article on the dashboard. LearnIT queues it immediately and does the slow work in the background.",
    points: [
      "Dashboard → Capture",
      "Or send the link to the LearnIT Telegram bot",
      "Add a note if you want to remember why",
    ],
    figure: "node",
  },
  {
    eyebrow: "Process",
    title: "Watch it move",
    body: "Every source travels the same route: the transcript or article text is fetched, then the source is filed under a topic, then materials are built.",
    points: [
      "Library shows the stage of every source",
      "New → Fetched → Sorted → Done",
      "Counters on the dashboard track the whole set",
    ],
    figure: "axis",
  },
  {
    eyebrow: "Topics",
    title: "Study by topic",
    body: "The topic is the unit of study, not the link. Sources on the same subject are consolidated into one current set of materials.",
    points: [
      "A study guide, a briefing, and a quiz per topic",
      "Rebuilt whenever new sources arrive",
      "Earlier versions are kept",
    ],
    figure: "orbit",
  },
  {
    eyebrow: "Recover",
    title: "Nothing stalls quietly",
    body: "When a source cannot be processed it is marked Needs attention and names the stage that broke, so you can retry exactly that stage.",
    points: [
      "Open the source from the Library",
      "Retry from the failed stage",
      "The rest of your library is untouched",
    ],
    figure: "burst",
  },
  {
    eyebrow: "Automate",
    title: "Let it run",
    body: "Connect Telegram for a daily digest of finished work, or point LearnIT at a YouTube playlist and it captures new videos for you.",
    points: [
      "Settings → Capture and Telegram",
      "One digest a day, at your local hour",
      "Playlist polling respects your daily limit",
    ],
    figure: "star",
  },
];

/** Clamps an arbitrary index onto the available pages. */
export function clampStepIndex(index: number, total: number = onboardingSteps.length): number {
  if (total <= 0) return 0;
  if (index < 0) return 0;
  if (index > total - 1) return total - 1;
  return index;
}

export function nextStepIndex(index: number, total: number = onboardingSteps.length): number {
  return clampStepIndex(index + 1, total);
}

export function previousStepIndex(index: number, total: number = onboardingSteps.length): number {
  return clampStepIndex(index - 1, total);
}

export function isLastStep(index: number, total: number = onboardingSteps.length): boolean {
  return index >= total - 1;
}

/** Fraction complete, used to size the progress rail. */
export function stepProgress(index: number, total: number = onboardingSteps.length): number {
  if (total <= 0) return 0;
  return (clampStepIndex(index, total) + 1) / total;
}
