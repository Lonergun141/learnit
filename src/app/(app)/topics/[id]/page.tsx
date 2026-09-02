import { ArrowLeft, ArrowUpRight, BookOpen, ClipboardList, FileText, Library } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTopicData } from "@/lib/learning/queries";
import { quizSchema } from "@/lib/learning/schemas";
import { cn } from "@/lib/utils/cn";
import { formatDate, hostnameLabel } from "@/lib/utils/format";

import { MarkdownDocument } from "./components/markdown-document";
import { Quiz } from "./components/quiz";

export const metadata: Metadata = { title: "Topic materials" };

type MaterialTab = "study-guide" | "briefing" | "quiz";

const tabs = [
  { id: "study-guide", label: "Study guide", icon: BookOpen },
  { id: "briefing", label: "Briefing", icon: FileText },
  { id: "quiz", label: "Quiz", icon: ClipboardList },
] as const;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TopicDetailPage({
  params,
  searchParams,
}: PageProps<"/topics/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const data = await getTopicData(id);
  if (!data.topic) notFound();

  const requestedTab = first(query.tab);
  const activeTab: MaterialTab = tabs.some((tab) => tab.id === requestedTab)
    ? (requestedTab as MaterialTab)
    : "study-guide";
  const artifactKind = activeTab === "study-guide" ? "study_guide" : activeTab;
  const artifact = data.artifacts.find((candidate) => candidate.kind === artifactKind);
  const parsedQuiz = activeTab === "quiz" && artifact
    ? quizSchema.safeParse(artifact.content_json)
    : null;

  return (
    <div className="grid gap-6">
      <Link className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink" href="/topics">
        <ArrowLeft size={16} /> Back to topics
      </Link>
      <header className="border-b border-line pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-[1.75rem]">{data.topic.name}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              {data.sources.length} {data.sources.length === 1 ? "source" : "sources"} on this route
            </p>
          </div>
          {artifact ? (
            <p className="text-xs text-ink-faint">
              Version {artifact.version} · Generated {formatDate(artifact.created_at)}
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="min-w-0 overflow-hidden rounded-2xl bg-surface shadow-[0_8px_24px_rgba(20,34,31,0.05)]">
          <nav className="flex overflow-x-auto border-b border-line px-2 pt-2" aria-label="Topic materials">
            {tabs.map(({ id: tabId, label, icon: Icon }) => (
              <Link
                key={tabId}
                href={`/topics/${id}?tab=${tabId}`}
                aria-current={activeTab === tabId ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal",
                  activeTab === tabId
                    ? "border-signal text-ink"
                    : "border-transparent text-ink-faint hover:text-ink",
                )}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
          </nav>
          <div className="min-h-[32rem] px-5 py-7 sm:px-8 sm:py-9">
            {!artifact ? (
              <EmptyState
                icon={<BookOpen size={20} />}
                title="This material is still being prepared"
                description="The latest sources are queued for a topic rebuild. Return after the worker finishes the route."
              />
            ) : activeTab === "quiz" ? (
              parsedQuiz?.success ? (
                <Quiz quiz={parsedQuiz.data} />
              ) : (
                <EmptyState
                  icon={<ClipboardList size={20} />}
                  title="Quiz unavailable"
                  description="This quiz did not pass the content safety contract and needs to be rebuilt."
                />
              )
            ) : artifact.content_markdown ? (
              <MarkdownDocument markdown={artifact.content_markdown} />
            ) : (
              <EmptyState
                icon={<FileText size={20} />}
                title="Document unavailable"
                description="This material has no readable Markdown content yet."
              />
            )}
          </div>
        </section>

        <aside className="rounded-2xl bg-surface px-5 py-5 shadow-[0_8px_24px_rgba(20,34,31,0.05)]">
          <div className="flex items-center gap-2">
            <Library className="text-ink-faint" size={17} />
            <h2 className="text-sm font-semibold text-ink">Sources</h2>
          </div>
          {data.sources.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-ink-muted">No sources have reached this topic yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {data.sources.map((source) => (
                <li key={source.id}>
                  <Link className="group block py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal" href={`/library/${source.id}`}>
                    <span className="flex items-start gap-2 text-sm font-medium text-ink group-hover:text-signal">
                      <span className="min-w-0 flex-1 break-words">{source.title ?? hostnameLabel(source.canonical_url)}</span>
                      <ArrowUpRight className="mt-0.5 shrink-0" size={14} />
                    </span>
                    <span className="mt-2 block"><StatusBadge status={source.status} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
