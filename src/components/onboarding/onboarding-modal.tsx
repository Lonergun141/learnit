"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Blueprint } from "@/components/ui/blueprint";
import { CropMarks } from "@/components/ui/crop-marks";
import { Button } from "@/components/ui/button";
import {
  isLastStep,
  nextStepIndex,
  onboardingSteps,
  previousStepIndex,
} from "@/lib/onboarding/steps";
import { cn } from "@/lib/utils/cn";

interface OnboardingModalProps {
  open: boolean;
  onDismiss: () => void;
}

const REVEAL = "power3.out";

/** Every stroke in the figure, in draw order. */
function figureStrokes(root: HTMLElement | null): SVGGeometryElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<SVGGeometryElement>("path, circle, ellipse, polygon, line"));
}

export function OnboardingModal({ open, onDismiss }: OnboardingModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const step = onboardingSteps[index];
  const last = isLastStep(index);

  // Native <dialog> gives the focus trap, the inert background, and Escape for
  // free; all this has to do is keep the element in step with React state.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setIndex(0);
      setClosing(false);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Plays the exit, then closes the element. Reporting the dismissal is left to
  // the `close` listener below so that every route out reports exactly once.
  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (!dialog || closing) return;

    setClosing(true);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !panel) {
      dialog.close();
      return;
    }

    gsap.to(panel, {
      opacity: 0,
      y: 12,
      scale: 0.99,
      duration: 0.24,
      ease: "power2.in",
      onComplete: () => dialog.close(),
    });
  }, [closing]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Escape fires `cancel`, not a click. Cancelling it and running the same
    // exit keeps the animation, and the `close` below still does the reporting.
    const onCancel = (event: Event) => {
      event.preventDefault();
      requestClose();
    };

    // The single source of truth for "no longer open". Anything that closes the
    // element — a button, Escape, or a caller reaching for it directly — lands
    // here, so React state can never drift out of step with the DOM and leave
    // the help control unable to reopen it.
    const onClose = () => {
      setClosing(false);
      if (panelRef.current) gsap.set(panelRef.current, { clearProps: "opacity,y,scale" });
      onDismiss();
    };

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onClose);
    };
  }, [requestClose, onDismiss]);

  // Entrance: runs once per opening.
  useGSAP(
    () => {
      if (!open) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(panelRef.current, {
          opacity: 0,
          y: 24,
          scale: 0.985,
          duration: 0.5,
          ease: REVEAL,
        });
      });
      return () => mm.revert();
    },
    { dependencies: [open] },
  );

  // Page choreography: numeral, drawn figure, headline words, then the body.
  useGSAP(
    () => {
      if (!open) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({ defaults: { ease: REVEAL } });

        timeline.from(".ob-numeral", { yPercent: 110, duration: 0.6 }, 0);

        const strokes = figureStrokes(figureRef.current);
        for (const stroke of strokes) {
          const length = stroke.getTotalLength?.() ?? 0;
          if (!length) continue;
          gsap.set(stroke, { strokeDasharray: length, strokeDashoffset: length });
        }
        timeline.to(
          strokes,
          { strokeDashoffset: 0, duration: 1.1, stagger: 0.07, ease: "power2.inOut" },
          0.05,
        );

        timeline.from(
          ".ob-word > span",
          { yPercent: 115, duration: 0.6, stagger: 0.045 },
          0.12,
        );
        timeline.from(".ob-body", { y: 14, opacity: 0, duration: 0.5 }, 0.3);
        timeline.from(
          ".ob-point",
          { y: 12, opacity: 0, duration: 0.45, stagger: 0.07 },
          0.36,
        );
        timeline.from(".ob-eyebrow-rule", { scaleX: 0, duration: 0.5 }, 0.1);

        return () => timeline.kill();
      });

      return () => mm.revert();
    },
    { scope: stageRef, dependencies: [index, open], revertOnUpdate: true },
  );

  // The progress rail is driven separately so it slides between pages rather
  // than restarting from zero on every one.
  useGSAP(
    () => {
      if (!open) return;
      gsap.to(".ob-progress-fill", {
        scaleX: (index + 1) / onboardingSteps.length,
        duration: 0.55,
        ease: "power3.out",
        overwrite: "auto",
      });
    },
    { scope: panelRef, dependencies: [index, open] },
  );

  return (
    <dialog
      aria-label="How LearnIT works"
      className="m-auto max-h-none w-[min(96vw,76rem)] max-w-none bg-transparent p-0 text-ink"
      ref={dialogRef}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose();
      }}
    >
      <div
        autoFocus
        className="relative flex h-[min(88vh,44rem)] flex-col overflow-hidden border border-line-strong bg-background outline-none"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3.5 sm:px-8">
          <p className="mono-label flex items-center gap-3">
            <span className="text-signal">{String(index + 1).padStart(2, "0")}</span>
            <span className="h-px w-5 bg-line-strong" aria-hidden="true" />
            <span className="text-ink-soft">How LearnIT works</span>
          </p>
          <button className="bracket-link min-h-8" onClick={requestClose} type="button">
            Skip
          </button>
        </div>

        <div
          className="grid min-h-0 flex-1 lg:grid-cols-[24rem_minmax(0,1fr)]"
          ref={stageRef}
        >
          <div className="relative hidden overflow-hidden border-r border-line lg:block">
            <div className="grid-field absolute inset-0 opacity-20" aria-hidden="true" />
            <CropMarks className="inset-6" />
            <div
              className="absolute inset-0 grid place-items-center p-10"
              ref={figureRef}
            >
              <Blueprint variant={step.figure} className="h-64 w-64 text-signal/50" />
            </div>
            <div className="absolute bottom-8 left-8 overflow-hidden">
              <p className="ob-numeral display text-[5rem] leading-[0.8] tabular-nums text-ink/15">
                {String(index + 1).padStart(2, "0")}
              </p>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
            {/*
              The rule sits alone inside its wrapper: GSAP restores an animated
              element to a recorded sibling position when the page changes, and a
              bare text node next to it is not a stable reference to restore
              against — the rule would end up after the label.
            */}
            <p className="mono-label flex items-center gap-3">
              <span className="block h-px w-8" aria-hidden="true">
                <span className="ob-eyebrow-rule block h-px w-full origin-left bg-signal" />
              </span>
              <span>{step.eyebrow}</span>
            </p>

            <h2 className="display mt-7 flex flex-wrap gap-x-[0.28em] text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.02]">
              {step.title.split(" ").map((word, wordIndex) => (
                <span
                  className="ob-word inline-block overflow-hidden pb-[0.08em]"
                  key={`${word}-${wordIndex}`}
                >
                  <span className="inline-block">{word}</span>
                </span>
              ))}
            </h2>

            <p className="ob-body mt-7 max-w-xl text-[0.9375rem] leading-8 text-ink-muted">
              {step.body}
            </p>

            <ul className="mt-9 max-w-xl">
              {step.points.map((point) => (
                <li
                  className="ob-point flex items-baseline gap-4 border-b border-line py-3.5 text-sm leading-7 text-ink-soft last:border-b-0"
                  key={point}
                >
                  <span className="h-px w-4 shrink-0 translate-y-[-0.35em] bg-signal" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>


        <div className="flex items-center justify-between gap-6 border-t border-line px-6 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-px w-24 bg-line-strong sm:w-40" aria-hidden="true">
              <div className="ob-progress-fill h-px origin-left scale-x-0 bg-signal" />
            </div>
            <p className="mono-label whitespace-nowrap">
              {String(index + 1).padStart(2, "0")} / {String(onboardingSteps.length).padStart(2, "0")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className={cn(index === 0 && "invisible")}
              disabled={index === 0}
              onClick={() => setIndex((current) => previousStepIndex(current))}
              type="button"
              variant="secondary"
            >
              <ArrowLeft size={15} /> Back
            </Button>
            <Button
              onClick={() =>
                last ? requestClose() : setIndex((current) => nextStepIndex(current))
              }
              type="button"
            >
              {last ? "Start" : "Next"}
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
