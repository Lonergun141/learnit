import { ArrowUpRight, Inbox } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { LearningStatus } from "@/lib/learning/statuses";

interface RecentItem {
  id: string;
  title: string | null;
  canonical_url: string;
  status: LearningStatus;
  date: string | null;
  topicName?: string | null;
}

interface RecentItemsProps {
  title: string;
  description: string;
  items: RecentItem[];
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

export function RecentItems({ title, description, items }: RecentItemsProps) {
  return (
    <section className="min-w-0 rounded-2xl bg-surface px-5 py-5 shadow-[0_10px_30px_rgba(20,34,31,0.06)] sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-ink-muted">{description}</p>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ink-muted hover:text-signal"
          href="/library"
        >
          All items <ArrowUpRight size={14} />
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox size={19} />}
          title="No stops on this route yet"
          description="Save your first link and it will appear here while LearnIT prepares it."
        />
      ) : (
        <ul className="mt-5 divide-y divide-line">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                className="group flex items-center gap-3 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                href={`/library/${item.id}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink group-hover:text-signal">
                    {itemLabel(item)}
                  </span>
                  <span className="mt-1 block truncate text-xs text-ink-faint">
                    {item.topicName ?? "Awaiting topic"}
                    {item.date ? ` · ${dateFormatter.format(new Date(item.date))}` : ""}
                  </span>
                </span>
                <StatusBadge status={item.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
