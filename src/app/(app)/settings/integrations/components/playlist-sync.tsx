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
    <div className="mt-5 border-t border-line pt-5">
      <form action={action}>
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          {pending ? "Queueing sync…" : "Sync playlist now"}
        </Button>
      </form>
      {state.message ? (
        <p
          className={`mt-3 text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
