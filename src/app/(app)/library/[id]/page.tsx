import { ArrowLeft, ArrowUpRight, FileText, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { buttonClassName } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { SheetSection } from "@/components/ui/sheet-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { HeroBand } from "@/components/ui/hero-band";
import { getLearningItem } from "@/lib/learning/queries";
import { determineRetryStage } from "@/lib/learning/statuses";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";

import { RetryItemForm } from "./components/retry-item-form";

export const metadata: Metadata = { title: "Library item" };

export default async function LibraryItemPage({ params }: PageProps<"/library/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const item = await getLearningItem(id);
  if (!item) notFound();

  const retryStage = determineRetryStage({
    status: item.status,
    failureStage: item.failure_stage,
  });

  const stations = [
    { label: "Added", at: item.added_at },
    { label: "Fetched", at: item.fetched_at },
    { label: "Sorted", at: item.sorted_at },
    { label: "Built", at: item.built_at },
  ];

  return (
    <div>
      <div className="border-b border-line px-6 py-4 sm:px-10 lg:px-14">
        <Link className="bracket-link" href="/library">
          <ArrowLeft size={13} /> Library
        </Link>
      </div>

      <HeroBand
        eyebrow="Source"
        title={item.title ?? "Untitled source"}
        meta={<StatusBadge status={item.status} />}
        actions={
          <div className="flex flex-wrap items-center gap-6">
            <a
              className="bracket-link"
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              Open original <ArrowUpRight size={12} />
            </a>
            {retryStage ? (
              <RetryItemForm itemId={item.id} stageLabel={retryStage.replace("_", " ")} />
            ) : null}
            {item.status === "done" && item.topics ? (
              <Link className={buttonClassName()} href={`/topics/${item.topics.id}`}>
                <FileText size={15} /> Materials
              </Link>
            ) : null}
          </div>
        }
      />

      <Readout
        className="border-t-0"
        items={[
          { label: "Topic", value: item.topics?.name ?? "Unsorted" },
          { label: "Author", value: item.author ?? "Unknown" },
          { label: "Content", value: item.content_type === "youtube" ? "YouTube" : "Article" },
          { label: "Origin", value: item.source.replace("_", " ") },
        ]}
      />

      {item.error ? (
        <section
          className="border-b border-line bg-danger-soft/50 px-6 py-8 sm:px-10 lg:px-14"
          aria-labelledby="item-error-title"
        >
          <div className="flex gap-4 text-danger">
            <TriangleAlert className="mt-0.5 shrink-0" size={17} />
            <div>
              <h2 className="mono-label text-danger" id="item-error-title">
                Processing stopped
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6">{item.error}</p>
            </div>
          </div>
        </section>
      ) : null}

      <SheetSection index="01" label="Route">
        <ol className="relative grid gap-10 sm:grid-cols-4 sm:gap-6">
          <span
            className="absolute left-1 right-1 top-[0.3125rem] hidden h-px bg-line sm:block"
            aria-hidden="true"
          />
          {stations.map((station) => (
            <li className="relative" key={station.label}>
              <span
                className={cn(
                  "block size-2.5 rounded-full border",
                  station.at ? "border-signal bg-signal" : "border-line-strong bg-background",
                )}
                aria-hidden="true"
              />
              <p className="mono-label mt-6">{station.label}</p>
              <p
                className={cn(
                  "mt-3 font-mono text-[0.75rem] leading-5",
                  station.at ? "text-ink-soft" : "text-ink-faint",
                )}
              >
                {formatDateTime(station.at)}
              </p>
            </li>
          ))}
        </ol>
      </SheetSection>

      <SheetSection index="02" label="Note">
        <p className="max-w-[70ch] whitespace-pre-wrap text-sm leading-7 text-ink-muted">
          {item.note ?? "No note was added."}
        </p>
        <p className="mt-8 break-all font-mono text-[0.6875rem] text-ink-faint">
          {item.canonical_url}
        </p>
      </SheetSection>
    </div>
  );
}
