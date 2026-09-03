"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { syncPlaylistAction, type PlaylistSyncState } from "../actions";

export function PlaylistSync() {
  const [state, action, pending] = useActionState<PlaylistSyncState, FormData>(
    syncPlaylistAction,
    {},
  );

  return (
    <div className="mt-10 border-t border-line pt-8">
      <form action={action}>
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? <LoaderCircle className="animate-spin" size={15} /> : <RefreshCw size={15} />}
          {pending ? "Queueing…" : "Sync now"}
        </Button>
      </form>
      {state.message ? (
        <p
          className={`mt-4 text-sm ${state.status === "error" ? "text-danger" : "text-signal"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
