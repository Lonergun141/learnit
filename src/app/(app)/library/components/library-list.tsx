import { ArrowUpRight, Library } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, hostnameLabel } from "@/lib/utils/format";
import type { Database } from "@/types/database";

type Status = Database["public"]["Enums"]["learning_status"];
type Source = Database["public"]["Enums"]["learning_source"];

interface LibraryItem {
  id: string;
  title: string | null;
  canonical_url: string;
  status: Status;
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

export function LibraryList({ items }: LibraryListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Library size={20} />}
        title="No matching sources"
        description="Adjust the filters or save a new link from the dashboard."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-[0_8px_24px_rgba(20,34,31,0.05)]">
      <div className="hidden grid-cols-[minmax(15rem,1.6fr)_minmax(9rem,0.7fr)_8rem_9rem_7rem] gap-4 border-b border-line px-5 py-3 text-xs font-semibold text-ink-faint md:grid">
        <span>Source</span>
        <span>Topic</span>
        <span>Origin</span>
        <span>Status</span>
        <span>Added</span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              className="group grid gap-3 px-4 py-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal md:grid-cols-[minmax(15rem,1.6fr)_minmax(9rem,0.7fr)_8rem_9rem_7rem] md:items-center md:gap-4 md:px-5"
              href={`/library/${item.id}`}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink group-hover:text-signal">
                  {item.title ?? hostnameLabel(item.canonical_url)}
                  <ArrowUpRight className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" size={14} />
                </span>
                <span className="mt-1 block truncate text-xs text-ink-faint">{item.canonical_url}</span>
              </span>
              <span className="text-sm text-ink-muted">{item.topics?.name ?? "Unsorted"}</span>
              <span className="text-xs capitalize text-ink-muted">{sourceLabel(item.source)}</span>
              <span><StatusBadge status={item.status} /></span>
              <span className="text-xs tabular-nums text-ink-faint">{formatDate(item.added_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
