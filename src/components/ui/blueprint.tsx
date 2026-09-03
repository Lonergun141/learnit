import { cn } from "@/lib/utils/cn";

/**
 * Decorative hairline schematics. Purely ornamental — always aria-hidden, never
 * carrying meaning. Strokes inherit `currentColor` so a parent text colour (and
 * its opacity) tunes the whole figure.
 */
export type BlueprintVariant = "node" | "orbit" | "axis" | "star" | "burst";

interface BlueprintProps {
  variant: BlueprintVariant;
  className?: string;
}

const viewBoxes: Record<BlueprintVariant, string> = {
  node: "0 0 200 268",
  orbit: "0 0 380 200",
  axis: "0 0 320 128",
  star: "0 0 120 120",
  burst: "0 0 240 240",
};

const starPoints = [
  "60,5", "65.4,47.1", "98.9,21.1", "72.9,54.6",
  "115,60", "72.9,65.4", "98.9,98.9", "65.4,72.9",
  "60,115", "54.6,72.9", "21.1,98.9", "47.1,65.4",
  "5,60", "47.1,54.6", "21.1,21.1", "54.6,47.1",
].join(" ");

function Figure({ variant }: { variant: BlueprintVariant }) {
  switch (variant) {
    case "node":
      return (
        <>
          <circle cx="100" cy="20" r="12" />
          <path d="M100 32V90" />
          <path d="M100 90 160 150 100 210 40 150Z" />
          <path d="M14 150H40M160 150h26" strokeDasharray="5 6" />
          <path d="M100 90h62m-8-5 8 5-8 5" />
          <path d="M100 210h62m-8-5 8 5-8 5" />
          <path d="M100 210v26" />
          <circle cx="100" cy="248" r="12" />
        </>
      );
    case "orbit":
      return (
        <>
          <ellipse cx="140" cy="100" rx="102" ry="76" strokeDasharray="6 7" />
          <ellipse cx="244" cy="100" rx="92" ry="72" />
          <path d="M58 100h278M66 94l-8 6 8 6" />
          <circle cx="336" cy="100" r="2.5" fill="currentColor" />
        </>
      );
    case "axis":
      return (
        <>
          <path d="M0 92h320" />
          <path d="M62 92 102 26l40 66" />
          <path d="M102 26v66" strokeDasharray="5 6" />
          <path d="M182 92 222 26l40 66" />
          <path d="M222 4v124" />
          <circle cx="222" cy="4" r="2.5" fill="currentColor" />
        </>
      );
    case "star":
      return <polygon points={starPoints} />;
    case "burst":
      return (
        <>
          <circle cx="120" cy="120" r="52" strokeDasharray="4 8" />
          <circle cx="120" cy="120" r="92" />
          <path d="M120 0v46M120 194v46M0 120h46M194 120h46" />
          <path d="M120 68 132 108 172 120 132 132 120 172 108 132 68 120 108 108Z" />
        </>
      );
  }
}

export function Blueprint({ variant, className }: BlueprintProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
      viewBox={viewBoxes[variant]}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
    >
      <Figure variant={variant} />
    </svg>
  );
}
