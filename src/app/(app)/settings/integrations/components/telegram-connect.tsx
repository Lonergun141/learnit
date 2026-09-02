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
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-info-soft text-info"><Send size={20} /></span>
        <div>
          <h2 className="text-base font-semibold text-ink">Connect Telegram</h2>
          <p className="mt-1 text-sm leading-6 text-ink-muted">Send links to the shared LearnIT bot and receive your own private digest.</p>
        </div>
      </div>
      <form action={action} className="mt-5">
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={16} />}
          {pending ? "Creating link…" : "Create connection link"}
        </Button>
      </form>
      {state.message ? (
        <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${state.status === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`} role="status">
          <p>{state.message}</p>
          {state.url ? (
            <a className={buttonClassName("primary", "mt-3")} href={state.url} target="_blank" rel="noreferrer noopener">
              Open Telegram <ArrowUpRight size={16} />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
