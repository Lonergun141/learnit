import { cn } from "@/lib/utils/cn";

interface ReadoutProps {
  items: { label: string; value: string }[];
  className?: string;
}

/**
 * Instrument strip: a full-bleed row of label/value cells split by hairlines.
 * Carries the page's hard facts in monospace under the display headline.
 */
export function Readout({ items, className }: ReadoutProps) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 border-t border-line sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          className="border-b border-r border-line px-6 py-4 last:border-r-0 sm:border-b-0 sm:px-8"
          key={item.label}
        >
          <dt className="mono-label">{item.label}</dt>
          <dd className="mt-2 truncate font-mono text-[0.8125rem] text-ink-soft">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
