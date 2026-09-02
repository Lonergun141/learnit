"use client";

import { CheckCircle2, CopyCheck, Link2, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";

import { saveLinkAction, type SaveLinkState } from "../actions";

const initialState: SaveLinkState = {};

export function SaveLinkForm() {
  const [state, action, pending] = useActionState(saveLinkAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <InputField
        label="Link"
        name="url"
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="https://youtube.com/watch?v=…"
        required
      />
      <InputField
        label="Note"
        hint="Optional"
        name="note"
        placeholder="Why is this worth learning?"
        maxLength={2000}
      />
      {state.message ? (
        <div
          className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ${
            state.status === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "duplicate" ? (
            <CopyCheck className="mt-0.5 shrink-0" size={16} />
          ) : (
            <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
          )}
          <span>
            {state.message}{" "}
            {state.itemId ? (
              <Link className="font-semibold underline" href={`/library/${state.itemId}`}>
                View item
              </Link>
            ) : null}
          </span>
        </div>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? <LoaderCircle className="animate-spin" size={17} /> : <Link2 size={17} />}
        {pending ? "Saving…" : "Save link"}
      </Button>
      <p className="text-xs leading-5 text-ink-faint">
        LearnIT queues the source now. Transcripts, classification, and materials are built in the background.
      </p>
    </form>
  );
}
