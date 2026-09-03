import { ArrowLeft, ArrowUpRight, BookOpen, ClipboardList, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { EmptyState } from "@/components/ui/empty-state";
import { HeroBand } from "@/components/ui/hero-band";
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
  { id: "study-guide", label: "Guide", icon: BookOpen },
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
    <div>
      <div className="border-b border-line px-6 py-4 sm:px-10 lg:px-14">
        <Link className="bracket-link" href="/topics">
          <ArrowLeft size={13} /> Topics
        </Link>
      </div>

      <HeroBand
        eyebrow="Topic"
        title={data.topic.name}
        meta={
          <div className="mono-label flex gap-5 sm:block">
            <span className="block text-ink-soft">
              {String(data.sources.length).padStart(2, "0")}{" "}
              {data.sources.length === 1 ? "source" : "sources"}
            </span>
            {artifact ? (
              <span className="block sm:mt-2">
                v{artifact.version} · {formatDate(artifact.created_at)}
              </span>
            ) : null}
          </div>
        }
      />

      <nav
        className="grid grid-cols-3 border-b border-line"
        aria-label="Topic materials"
      >
        {tabs.map(({ id: tabId, label, icon: Icon }, position) => (
          <Link
            key={tabId}
            href={`/topics/${id}?tab=${tabId}`}
            aria-current={activeTab === tabId ? "page" : undefined}
            className={cn(
              "group relative flex min-h-16 flex-col justify-center gap-1.5 border-r border-line px-6 transition-colors duration-300 last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal sm:px-10",
              activeTab === tabId
                ? "bg-signal-soft text-signal"
                : "text-ink-faint hover:bg-surface-muted/40 hover:text-ink-soft",
            )}
          >
            <span
              className={cn(
                "absolute inset-x-0 top-0 h-px transition-colors",
                activeTab === tabId ? "bg-signal" : "bg-transparent",
              )}
              aria-hidden="true"
            />
            <span className="mono-label">{String(position + 1).padStart(2, "0")}</span>
            <span className="flex items-center gap-2.5 font-display text-[0.85rem] font-semibold uppercase tracking-[0.07em]">
              <Icon size={15} /> {label}
            </span>
          </Link>
        ))}
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          {!artifact ? (
            <EmptyState
              icon={<BookOpen size={18} />}
              title="Still being prepared"
              description="Return once the worker finishes this route."
            />
          ) : activeTab === "quiz" ? (
            parsedQuiz?.success ? (
              <Quiz quiz={parsedQuiz.data} />
            ) : (
              <EmptyState
                icon={<ClipboardList size={18} />}
                title="Quiz unavailable"
                description="This quiz needs to be rebuilt."
              />
            )
          ) : artifact.content_markdown ? (
            <MarkdownDocument markdown={artifact.content_markdown} />
          ) : (
            <EmptyState
              icon={<FileText size={18} />}
              title="Document unavailable"
              description="No readable content yet."
            />
          )}
        </div>

        <aside className="border-t border-line lg:border-l lg:border-t-0">
          <p className="mono-label border-b border-line px-6 py-4 sm:px-10 lg:px-8">Sources</p>
          {data.sources.length === 0 ? (
            <p className="px-6 py-8 text-sm text-ink-faint sm:px-10 lg:px-8">None yet.</p>
          ) : (
            <ul className="lg:sticky lg:top-28">
              {data.sources.map((source) => (
                <li className="border-b border-line" key={source.id}>
                  <Link
                    className="group block px-6 py-5 transition-colors duration-300 hover:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal sm:px-10 lg:px-8"
                    href={`/library/${source.id}`}
                  >
                    <span className="flex items-start gap-2 text-[0.8125rem] font-medium leading-6 text-ink-soft transition-colors group-hover:text-signal">
                      <span className="min-w-0 flex-1 break-words">
                        {source.title ?? hostnameLabel(source.canonical_url)}
                      </span>
                      <ArrowUpRight className="mt-1 shrink-0" size={13} />
                    </span>
                    <span className="mt-3 block">
                      <StatusBadge status={source.status} />
                    </span>
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
