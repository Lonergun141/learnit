"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { disconnectTelegramAction, type TelegramDisconnectState } from "../actions";

export function TelegramDisconnect() {
  const [state, action, pending] = useActionState<TelegramDisconnectState, FormData>(
    disconnectTelegramAction,
    {},
  );

  return (
    <div className="mt-10 border-t border-line pt-8">
      <form action={action}>
        <Button disabled={pending} type="submit" variant="danger">
          {pending ? <LoaderCircle className="animate-spin" size={15} /> : null}
          {pending ? "Disconnecting…" : "Disconnect"}
        </Button>
      </form>
      {state.status === "error" && state.message ? (
        <p className="mt-4 text-sm text-danger" role="status">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
