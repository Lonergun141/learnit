import { ArrowUpRight, Inbox } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  determineItemPhase,
  isPhaseInFlight,
  phaseCopy,
  type JobStage,
  type LearningStatus,
} from "@/lib/learning/statuses";

export interface RecentItem {
  id: string;
  title: string | null;
  canonical_url: string;
  status: LearningStatus;
  failureStage: JobStage | null;
  date: string | null;
  topicName?: string | null;
}

interface RecentItemsProps {
  items: RecentItem[];
  emptyTitle: string;
  emptyDescription: string;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

function itemLabel(item: RecentItem): string {
  if (item.title) return item.title;
  try {
    return new URL(item.canonical_url).hostname.replace(/^www\./, "");
  } catch {
    return "Untitled source";
  }
}

/** Ruled index rows. No card — the sheet's own rules bound the list. */
export function RecentItems({ items, emptyTitle, emptyDescription }: RecentItemsProps) {
  if (items.length === 0) {
    return (
      <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
        <EmptyState icon={<Inbox size={18} />} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <ul>
      {items.map((item, position) => {
        const phase = determineItemPhase({
          status: item.status,
          failureStage: item.failureStage,
        });

        return (
          <li className="border-b border-line last:border-b-0" key={item.id}>
            <Link
              className="group relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-4 px-6 py-4 sm:px-10 lg:px-14 transition-colors duration-300 hover:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:gap-6"
              href={`/library/${item.id}`}
            >
              <span className="mono-label transition-colors group-hover:text-signal">
                {String(position + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 truncate text-[0.875rem] font-medium text-ink-soft transition-colors group-hover:text-signal">
                  <span className="truncate">{itemLabel(item)}</span>
                  <ArrowUpRight
                    className="shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    size={14}
                  />
                </span>
                <span className="mt-1 block truncate font-mono text-[0.625rem] text-ink-faint">
                  {/* The badge already names the step, so the topic wins here once it exists. */}
                  {item.topicName ?? phaseCopy[phase].detail}
                  {item.date ? ` · ${dateFormatter.format(new Date(item.date))}` : ""}
                </span>
              </span>
              <span className="col-start-2 sm:col-start-3">
                <StatusBadge status={item.status} failureStage={item.failureStage} />
              </span>
              {isPhaseInFlight(phase) ? <span className="transit-rule" aria-hidden="true" /> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
