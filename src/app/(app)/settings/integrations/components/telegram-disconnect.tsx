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
    <div className="mt-5 border-t border-line pt-5">
      <form action={action}>
        <Button disabled={pending} type="submit" variant="danger">
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
          {pending ? "Disconnecting…" : "Disconnect Telegram"}
        </Button>
      </form>
      {state.status === "error" && state.message ? (
        <p className="mt-3 text-sm text-danger" role="status">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
