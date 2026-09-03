import { Tile } from "@/components/ui/tile";

/**
 * The masthead, folded into the grid as a cell rather than a full-width plate.
 *
 * Deliberately carries no figures: the source and topic counts it used to
 * repeat now sit in the stat tiles directly beside it, and printing them twice
 * on one screen makes neither one authoritative. No eyebrow either — in a bento
 * the tile's position says "this is the page", so a label would only repeat it.
 */
export function IdentityTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <div className="flex h-full flex-col justify-end">
        <h1 className="display text-[clamp(1.6rem,2.7vw,2.35rem)] leading-[1.02]">
          Learning <span className="accent-italic text-signal">network</span>
        </h1>
      </div>
    </Tile>
  );
}
