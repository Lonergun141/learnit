import { ArrowUpRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/format";
import type { Database } from "@/types/database";

type ArtifactKind = Database["public"]["Enums"]["artifact_kind"];

interface TopicSummary {
  id: string;
  name: string;
  itemCount: number;
  artifactKinds: ArtifactKind[];
  lastGeneratedAt: string | null;
}

interface TopicListProps {
  topics: TopicSummary[];
}

const artifactLabels: Record<ArtifactKind, string> = {
  study_guide: "Guide",
  briefing: "Briefing",
  quiz: "Quiz",
};

export function TopicList({ topics }: TopicListProps) {
  if (topics.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen size={20} />}
        title="Your topic map is waiting"
        description="Save a link first. LearnIT will classify it and create the first topic route for you."
      />
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {topics.map((topic) => (
        <li key={topic.id}>
          <Link
            className="group flex h-full min-h-48 flex-col rounded-2xl bg-surface px-5 py-5 shadow-[0_8px_24px_rgba(20,34,31,0.05)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(20,34,31,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            href={`/topics/${topic.id}`}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-9 place-items-center rounded-full bg-signal-soft text-signal">
                <span className="size-2.5 rounded-full bg-current" />
              </span>
              <ArrowUpRight className="text-ink-faint transition-colors group-hover:text-signal" size={17} />
            </div>
            <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-ink">{topic.name}</h2>
            <p className="mt-1 text-xs text-ink-muted">
              {topic.itemCount} {topic.itemCount === 1 ? "source" : "sources"}
              {topic.lastGeneratedAt ? ` · Updated ${formatDate(topic.lastGeneratedAt)}` : " · Building materials"}
            </p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
              {topic.artifactKinds.length ? (
                topic.artifactKinds.map((kind) => (
                  <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[0.6875rem] font-semibold text-ink-muted" key={kind}>
                    {artifactLabels[kind]}
                  </span>
                ))
              ) : (
                <span className="text-xs text-ink-faint">No current artifacts yet</span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
