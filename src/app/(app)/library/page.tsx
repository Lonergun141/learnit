import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { getLibraryData, type LibraryFilters } from "@/lib/learning/queries";
import type { Database } from "@/types/database";

import { LibraryFilterForm } from "./components/library-filters";
import { LibraryList } from "./components/library-list";

export const metadata: Metadata = { title: "Library" };

const statuses = new Set<Database["public"]["Enums"]["learning_status"]>([
  "new", "fetched", "sorted", "done", "failed",
]);
const sources = new Set<Database["public"]["Enums"]["learning_source"]>([
  "telegram", "web", "youtube_playlist", "manual",
]);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const rawSource = first(params.source);
  const filters: LibraryFilters = {
    search: first(params.q),
    topicId: first(params.topic),
    status: statuses.has(rawStatus as Database["public"]["Enums"]["learning_status"])
      ? (rawStatus as Database["public"]["Enums"]["learning_status"])
      : undefined,
    source: sources.has(rawSource as Database["public"]["Enums"]["learning_source"])
      ? (rawSource as Database["public"]["Enums"]["learning_source"])
      : undefined,
  };
  const data = await getLibraryData(filters);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Library"
        description="Every source you capture, from first arrival to finished learning material."
      />
      <LibraryFilterForm filters={filters} topics={data.topics} />
      <p className="text-xs font-medium tabular-nums text-ink-faint">
        {data.items.length} {data.items.length === 1 ? "source" : "sources"}
      </p>
      <LibraryList items={data.items} />
    </div>
  );
}
