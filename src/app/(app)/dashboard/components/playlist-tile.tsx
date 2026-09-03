import Link from "next/link";

import { Tile } from "@/components/ui/tile";
import { formatDateTime } from "@/lib/utils/format";

import { PlaylistSync } from "../../settings/integrations/components/playlist-sync";

interface PlaylistTileProps {
  enabled: boolean;
  playlistId: string | null;
  dailyLimit: number;
  lastPolledAt: string | null;
  className?: string;
}

export function PlaylistTile({
  enabled,
  playlistId,
  dailyLimit,
  lastPolledAt,
  className,
}: PlaylistTileProps) {
  const ready = Boolean(enabled && playlistId);

  return (
    <Tile
      label="Playlist capture"
      action={
        <span className={`mono-label ${ready ? "text-signal" : "text-ink-faint"}`}>
          {ready ? "Armed" : "Off"}
        </span>
      }
      className={className}
    >
      {ready ? (
        <div className="flex h-full flex-col gap-5">
          <p className="break-all font-mono text-[0.8125rem] text-ink-soft">{playlistId}</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="mono-label">Daily limit</dt>
              <dd className="mt-2 font-mono text-[0.75rem] tabular-nums text-ink-muted">
                {dailyLimit}
              </dd>
            </div>
            <div>
              <dt className="mono-label">Last poll</dt>
              <dd className="mt-2 font-mono text-[0.75rem] text-ink-muted">
                {formatDateTime(lastPolledAt)}
              </dd>
            </div>
          </dl>
          <PlaylistSync />
        </div>
      ) : (
        <div className="flex h-full flex-col items-start justify-between gap-6">
          <p className="max-w-xs text-sm leading-7 text-ink-muted">
            Point LearnIT at a YouTube playlist and it polls hourly.
          </p>
          <Link className="bracket-link" href="/settings/integrations">
            Configure
          </Link>
        </div>
      )}
    </Tile>
  );
}
