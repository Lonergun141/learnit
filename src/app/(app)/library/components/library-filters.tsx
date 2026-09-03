import { Search } from "lucide-react";
import Link from "next/link";

import type { LibraryFilters } from "@/lib/learning/queries";

interface LibraryFiltersProps {
  filters: LibraryFilters;
  topics: Array<{ id: string; name: string }>;
}

const cell =
  "flex flex-col justify-center gap-2 border-b border-line px-6 py-4 sm:px-8 xl:border-b-0 xl:border-r";
const control =
  "w-full bg-transparent text-[0.875rem] text-ink outline-none placeholder:text-ink-faint focus-visible:text-signal";

/**
 * The filter bar reads as an instrument strip: cells divided by hairlines,
 * bare controls, no floating panel. It spans the sheet edge to edge.
 */
export function LibraryFilterForm({ filters, topics }: LibraryFiltersProps) {
  return (
    <form className="grid md:grid-cols-2 xl:grid-cols-[1.7fr_1fr_1fr_1fr_auto]">
      <div className={`${cell} sm:pl-10 lg:pl-14`}>
        <label className="mono-label" htmlFor="q">
          Search
        </label>
        <input
          className={control}
          id="q"
          name="q"
          type="search"
          defaultValue={filters.search}
          placeholder="Title…"
        />
      </div>

      <div className={cell}>
        <label className="mono-label" htmlFor="status">
          Status
        </label>
        <select className={control} id="status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">All</option>
          <option value="new">New</option>
          <option value="fetched">Fetched</option>
          <option value="sorted">Sorted</option>
          <option value="done">Done</option>
          <option value="failed">Needs attention</option>
        </select>
      </div>

      <div className={cell}>
        <label className="mono-label" htmlFor="topic">
          Topic
        </label>
        <select className={control} id="topic" name="topic" defaultValue={filters.topicId ?? ""}>
          <option value="">All</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      </div>

      <div className={cell}>
        <label className="mono-label" htmlFor="source">
          Origin
        </label>
        <select className={control} id="source" name="source" defaultValue={filters.source ?? ""}>
          <option value="">All</option>
          <option value="web">Web</option>
          <option value="telegram">Telegram</option>
          <option value="youtube_playlist">Playlist</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div className="flex items-stretch md:col-span-2 xl:col-span-1">
        <button
          className="flex flex-1 items-center justify-center gap-2 bg-signal px-8 py-4 font-display text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#14170f] transition-[filter] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-background"
          type="submit"
        >
          <Search size={14} /> Filter
        </button>
        <Link
          className="flex items-center justify-center border-l border-line px-6 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal sm:pr-10 lg:pr-14"
          href="/library"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
