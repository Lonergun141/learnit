import type { Metadata } from "next";

import { HeroBand } from "@/components/ui/hero-band";
import { SheetSection } from "@/components/ui/sheet-section";
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
    <div>
      <HeroBand
        eyebrow="Index"
        figure="axis"
        title={
          <>
            The <span className="accent-italic text-signal">library</span>
          </>
        }
        meta={
          <div className="flex items-baseline gap-3 sm:block">
            <p className="display text-[1.75rem] leading-none tabular-nums">
              {String(data.items.length).padStart(2, "0")}
            </p>
            <p className="mono-label sm:mt-2">
              {data.items.length === 1 ? "Source" : "Sources"}
            </p>
          </div>
        }
      />

      <SheetSection index="01" label="Filter" flush>
        <LibraryFilterForm filters={filters} topics={data.topics} />
      </SheetSection>

      <SheetSection index="02" label="Manifest" flush>
        <LibraryList items={data.items} />
      </SheetSection>
    </div>
  );
}
