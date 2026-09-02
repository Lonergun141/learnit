import { Search } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/field";
import type { LibraryFilters } from "@/lib/learning/queries";

interface LibraryFiltersProps {
  filters: LibraryFilters;
  topics: Array<{ id: string; name: string }>;
}

export function LibraryFilterForm({ filters, topics }: LibraryFiltersProps) {
  return (
    <form className="grid gap-3 rounded-2xl bg-surface p-4 shadow-[0_8px_24px_rgba(20,34,31,0.05)] md:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_repeat(3,minmax(9rem,0.65fr))_auto] xl:items-end">
      <InputField
        label="Search titles"
        name="q"
        type="search"
        defaultValue={filters.search}
        placeholder="Search your library"
      />
      <SelectField label="Status" name="status" defaultValue={filters.status ?? ""}>
        <option value="">All statuses</option>
        <option value="new">New</option>
        <option value="fetched">Fetched</option>
        <option value="sorted">Sorted</option>
        <option value="done">Done</option>
        <option value="failed">Needs attention</option>
      </SelectField>
      <SelectField label="Topic" name="topic" defaultValue={filters.topicId ?? ""}>
        <option value="">All topics</option>
        {topics.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.name}
          </option>
        ))}
      </SelectField>
      <SelectField label="Source" name="source" defaultValue={filters.source ?? ""}>
        <option value="">All sources</option>
        <option value="web">Web</option>
        <option value="telegram">Telegram</option>
        <option value="youtube_playlist">Playlist</option>
        <option value="manual">Manual</option>
      </SelectField>
      <div className="flex gap-2">
        <button className={buttonClassName("primary", "flex-1")} type="submit">
          <Search size={16} /> Filter
        </button>
        <Link className={buttonClassName("quiet")} href="/library">
          Clear
        </Link>
      </div>
    </form>
  );
}
