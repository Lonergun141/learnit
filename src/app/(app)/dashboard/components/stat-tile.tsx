import type { LucideIcon } from "lucide-react";

import { Tile } from "@/components/ui/tile";
import { cn } from "@/lib/utils/cn";

interface StatTileProps {
  label: string;
  value: number;
  icon: LucideIcon;
  className?: string;
}

/**
 * A single counter. Deliberately not a link: the library filter takes one
 * status, and "in transit" spans three, so a tile that navigated would send
 * you somewhere that does not match the number you clicked.
 */
export function StatTile({ label, value, icon: Icon, className }: StatTileProps) {
  return (
    <Tile className={cn("justify-between", className)}>
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-3">
          <p className="mono-label">{label}</p>
          <Icon className="shrink-0 text-line-strong" size={13} />
        </div>
        <p className="display text-[1.75rem] leading-none tabular-nums sm:text-[2rem]">
          {String(value).padStart(2, "0")}
        </p>
      </div>
    </Tile>
  );
}
