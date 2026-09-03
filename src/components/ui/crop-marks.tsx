import { cn } from "@/lib/utils/cn";

interface CropMarksProps {
  className?: string;
}

/** Registration marks at the four corners of a block. Framing, not chrome. */
export function CropMarks({ className }: CropMarksProps) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      <span className="absolute left-0 top-0 size-3 border-l border-t border-signal/45" />
      <span className="absolute right-0 top-0 size-3 border-r border-t border-signal/45" />
      <span className="absolute bottom-0 left-0 size-3 border-b border-l border-signal/45" />
      <span className="absolute bottom-0 right-0 size-3 border-b border-r border-signal/45" />
    </span>
  );
}
