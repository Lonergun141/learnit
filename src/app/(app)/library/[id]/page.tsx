import { ArrowLeft, ArrowUpRight, FileText, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { buttonClassName } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getLearningItem } from "@/lib/learning/queries";
import { determineRetryStage } from "@/lib/learning/statuses";
import { formatDateTime } from "@/lib/utils/format";

import { RetryItemForm } from "./components/retry-item-form";

export const metadata: Metadata = { title: "Library item" };

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b border-line py-3.5 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold text-ink-faint">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

export default async function LibraryItemPage({ params }: PageProps<"/library/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const item = await getLearningItem(id);
  if (!item) notFound();

  const retryStage = determineRetryStage({
    status: item.status,
    failureStage: item.failure_stage,
  });

  return (
    <div className="grid gap-6">
      <Link className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink" href="/library">
        <ArrowLeft size={16} /> Back to library
      </Link>

      <header className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="mb-3"><StatusBadge status={item.status} /></div>
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-[1.75rem]">
            {item.title ?? "Untitled source"}
          </h1>
          <a
            className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-sm text-ink-muted underline decoration-line-strong hover:text-signal"
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            <span className="truncate">{item.canonical_url}</span><ArrowUpRight className="shrink-0" size={14} />
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          {retryStage ? (
            <RetryItemForm itemId={item.id} stageLabel={retryStage.replace("_", " ")} />
          ) : null}
          {item.status === "done" && item.topics ? (
            <Link className={buttonClassName()} href={`/topics/${item.topics.id}`}>
              <FileText size={16} /> Open materials
            </Link>
          ) : null}
        </div>
      </header>

      {item.error ? (
        <section className="rounded-2xl bg-danger-soft px-5 py-4 text-danger" aria-labelledby="item-error-title">
          <div className="flex gap-3">
            <RotateCcw className="mt-0.5 shrink-0" size={18} />
            <div>
              <h2 className="text-sm font-semibold" id="item-error-title">Processing stopped</h2>
              <p className="mt-1 text-sm leading-6">{item.error}</p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
        <section className="rounded-2xl bg-surface px-5 py-5 shadow-[0_8px_24px_rgba(20,34,31,0.05)] sm:px-6">
          <h2 className="text-base font-semibold text-ink">Source details</h2>
          <dl className="mt-3">
            <DetailRow label="Topic" value={item.topics?.name ?? "Not classified yet"} />
            <DetailRow label="Author" value={item.author ?? "Unknown"} />
            <DetailRow label="Content" value={item.content_type === "youtube" ? "YouTube video" : "Article"} />
            <DetailRow label="Captured via" value={item.source.replace("_", " ")} />
          </dl>
          <div className="mt-6 border-t border-line pt-5">
            <h2 className="text-sm font-semibold text-ink">Your note</h2>
            <p className="mt-2 max-w-[72ch] whitespace-pre-wrap text-sm leading-6 text-ink-muted">
              {item.note ?? "No note was added with this source."}
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-surface px-5 py-5 shadow-[0_8px_24px_rgba(20,34,31,0.05)] sm:px-6">
          <h2 className="text-base font-semibold text-ink">Route history</h2>
          <dl className="mt-3">
            <DetailRow label="Added" value={formatDateTime(item.added_at)} />
            <DetailRow label="Fetched" value={formatDateTime(item.fetched_at)} />
            <DetailRow label="Sorted" value={formatDateTime(item.sorted_at)} />
            <DetailRow label="Materials built" value={formatDateTime(item.built_at)} />
          </dl>
        </section>
      </div>
    </div>
  );
}
