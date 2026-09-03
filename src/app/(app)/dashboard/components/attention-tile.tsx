import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Tile } from "@/components/ui/tile";
import { cn } from "@/lib/utils/cn";

interface AttentionTileProps {
  count: number;
  className?: string;
}

/**
 * Only rendered when something has actually failed. A permanent "00" beside a
 * warning icon trains you to ignore the one time it matters.
 */
export function AttentionTile({ count, className }: AttentionTileProps) {
  return (
    <Tile className={cn("border-danger/40 bg-danger-soft/40", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="flex items-start gap-3 text-sm leading-6 text-danger">
          <TriangleAlert className="mt-0.5 shrink-0" size={16} />
          <span>
            {count === 1
              ? "One source stopped before its materials were built."
              : `${count} sources stopped before their materials were built.`}
          </span>
        </p>
        <Link className="bracket-link" href="/library?status=failed">
          Review
        </Link>
      </div>
    </Tile>
  );
}
