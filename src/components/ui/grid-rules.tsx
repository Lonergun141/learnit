import { cn } from "@/lib/utils/cn";

interface GridRulesProps {
  /** Number of equal columns the hairlines divide the band into. */
  columns?: number;
  className?: string;
}

/**
 * The measured column rules that run behind every band. Decorative structure —
 * they give the sheet its drafting-table grid without boxing content into cards.
 */
export function GridRules({ columns = 6, className }: GridRulesProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 flex", className)}
    >
      {Array.from({ length: columns }, (_, index) => (
        <div className="h-full flex-1 border-r border-line/60 last:border-r-0" key={index} />
      ))}
    </div>
  );
}
