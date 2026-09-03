import Link from "next/link";

import { Tile } from "@/components/ui/tile";

import { RecentItems, type RecentItem } from "./recent-items";

interface FeedTileProps {
  label: string;
  items: RecentItem[];
  emptyTitle: string;
  emptyDescription: string;
  className?: string;
}

/** A list cell: ruled rows running edge to edge inside the tile's radius. */
export function FeedTile({ label, items, emptyTitle, emptyDescription, className }: FeedTileProps) {
  return (
    <Tile
      label={label}
      action={
        <Link className="bracket-link" href="/library">
          All
        </Link>
      }
      className={className}
      flush
    >
      <RecentItems items={items} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
    </Tile>
  );
}
