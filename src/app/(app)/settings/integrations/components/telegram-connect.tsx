"use client";

import { ArrowUpRight, LoaderCircle, Send } from "lucide-react";
import { useActionState } from "react";

import { Button, buttonClassName } from "@/components/ui/button";

import { generateTelegramLinkAction, type TelegramLinkState } from "../actions";

export function TelegramConnect() {
  const [state, action, pending] = useActionState<TelegramLinkState, FormData>(
    generateTelegramLinkAction,
    {},
  );

  return (
    <div>
      <p className="display text-[1.35rem] leading-tight">Connect Telegram</p>
      <p className="mt-5 max-w-md text-sm leading-7 text-ink-muted">
        Send links to the bot and receive your own digest.
      </p>
      <form action={action} className="mt-8">
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? <LoaderCircle className="animate-spin" size={15} /> : <Send size={15} />}
          {pending ? "Creating…" : "Create link"}
        </Button>
      </form>
      {state.message ? (
        <div
          className={`mt-8 border-l-2 py-3 pl-4 text-sm leading-6 ${
            state.status === "error"
              ? "border-danger bg-danger-soft/60 text-danger"
              : "border-signal bg-signal-soft/60 text-signal"
          }`}
          role="status"
        >
          <p>{state.message}</p>
          {state.url ? (
            <a
              className={buttonClassName("primary", "mt-5")}
              href={state.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              Open Telegram <ArrowUpRight size={15} />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
