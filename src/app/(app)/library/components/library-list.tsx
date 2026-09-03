import { ArrowUpRight, Library } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { determineItemPhase, isPhaseInFlight } from "@/lib/learning/statuses";
import { formatDate, hostnameLabel } from "@/lib/utils/format";
import type { Database } from "@/types/database";

type Status = Database["public"]["Enums"]["learning_status"];
type Source = Database["public"]["Enums"]["learning_source"];
type Stage = Database["public"]["Enums"]["job_stage"];

interface LibraryItem {
  id: string;
  title: string | null;
  canonical_url: string;
  status: Status;
  failure_stage: Stage | null;
  source: Source;
  content_type: "youtube" | "article";
  added_at: string;
  topics: { id: string; name: string } | null;
}

interface LibraryListProps {
  items: LibraryItem[];
}

function sourceLabel(source: Source): string {
  return source.replace("_", " ");
}

const row =
  "grid-cols-[2.5rem_minmax(0,1fr)] lg:grid-cols-[2.5rem_minmax(0,1fr)_10rem_6rem_8.5rem_6rem]";
const inset = "px-6 sm:px-10 lg:px-14";

/**
 * The manifest. Every source is a ruled row stamped with its ordinal — a list
 * that reads like a shipping index, not a table inside a card.
 */
export function LibraryList({ items }: LibraryListProps) {
  if (items.length === 0) {
    return (
      <div className={`py-10 ${inset}`}>
        <EmptyState
          icon={<Library size={18} />}
          title="No matching sources"
          description="Adjust the filters, or save a new link."
        />
      </div>
    );
  }

  return (
    <div>
      <div className={`hidden gap-x-6 border-b border-line py-3 lg:grid ${row} ${inset}`}>
        <span className="mono-label">#</span>
        <span className="mono-label">Source</span>
        <span className="mono-label">Topic</span>
        <span className="mono-label">Origin</span>
        <span className="mono-label">Status</span>
        <span className="mono-label">Added</span>
      </div>
      <ul>
        {items.map((item, position) => (
          <li className="border-b border-line last:border-b-0" key={item.id}>
            <Link
              className={`group relative grid items-center gap-x-6 gap-y-2.5 py-4 transition-colors duration-200 hover:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal ${row} ${inset}`}
              href={`/library/${item.id}`}
            >
              <span className="mono-label self-start pt-0.5 transition-colors group-hover:text-signal">
                {String(position + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[0.875rem] font-medium leading-snug text-ink-soft transition-colors group-hover:text-signal">
                  <span className="truncate">{item.title ?? hostnameLabel(item.canonical_url)}</span>
                  <ArrowUpRight
                    className="shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                    size={13}
                  />
                </span>
                <span className="mt-1 block truncate font-mono text-[0.625rem] text-ink-faint">
                  {item.canonical_url}
                </span>
              </span>
              <span className="col-start-2 truncate font-mono text-[0.6875rem] text-ink-muted lg:col-start-auto">
                {item.topics?.name ?? "Unsorted"}
              </span>
              <span className="col-start-2 font-mono text-[0.6875rem] capitalize text-ink-faint lg:col-start-auto">
                {sourceLabel(item.source)}
              </span>
              <span className="col-start-2 lg:col-start-auto">
                <StatusBadge status={item.status} failureStage={item.failure_stage} />
              </span>
              <span className="col-start-2 font-mono text-[0.6875rem] tabular-nums text-ink-faint lg:col-start-auto">
                {formatDate(item.added_at)}
              </span>
              {isPhaseInFlight(
                determineItemPhase({ status: item.status, failureStage: item.failure_stage }),
              ) ? (
                <span className="transit-rule" aria-hidden="true" />
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
