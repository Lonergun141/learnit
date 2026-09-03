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

/**
 * A plate of ruled cells. Each topic gets a numbered field with the name set
 * large at the foot of the cell — an index plate, not a deck of cards.
 */
export function TopicList({ topics }: TopicListProps) {
  if (topics.length === 0) {
    return (
      <div className="px-6 py-10 sm:px-10 lg:px-14">
        <EmptyState
          icon={<BookOpen size={18} />}
          title="No topics yet"
          description="Save a link and the first route builds itself."
        />
      </div>
    );
  }

  return (
    <ul className="grid sm:grid-cols-2 xl:grid-cols-3">
      {topics.map((topic, position) => (
        <li className="border-b border-r border-line" key={topic.id}>
          <Link
            className="group relative flex h-full min-h-[12.5rem] flex-col justify-between p-6 transition-colors duration-300 hover:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal sm:p-8"
            href={`/topics/${topic.id}`}
          >
            <span
              className="absolute inset-x-0 top-0 h-px w-0 bg-signal transition-[width] duration-500 ease-out group-hover:w-full"
              aria-hidden="true"
            />
            <div className="flex items-start justify-between">
              <span className="mono-label transition-colors group-hover:text-signal">
                {String(position + 1).padStart(2, "0")}
              </span>
              <ArrowUpRight
                className="text-line-strong transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"
                size={16}
              />
            </div>

            <div className="mt-10">
              <h2 className="display text-[1.15rem] leading-[1.1] transition-colors group-hover:text-signal">
                {topic.name}
              </h2>
              <p className="mono-label mt-4">
                {String(topic.itemCount).padStart(2, "0")}{" "}
                {topic.itemCount === 1 ? "source" : "sources"}
                {topic.lastGeneratedAt ? ` · ${formatDate(topic.lastGeneratedAt)}` : " · building"}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {topic.artifactKinds.map((kind) => (
                  <span
                    className="border border-line px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint"
                    key={kind}
                  >
                    {artifactLabels[kind]}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
