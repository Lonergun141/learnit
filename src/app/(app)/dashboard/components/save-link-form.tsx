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
    <form action={action} className="grid gap-6">
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
          className={`flex items-start gap-3 border-l-2 py-3 pl-4 text-sm leading-6 ${
            state.status === "error"
              ? "border-danger bg-danger-soft/60 text-danger"
              : "border-signal bg-signal-soft/60 text-signal"
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "duplicate" ? (
            <CopyCheck className="mt-1 shrink-0" size={15} />
          ) : (
            <CheckCircle2 className="mt-1 shrink-0" size={15} />
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
      <Button className="w-full sm:w-auto sm:justify-self-start" disabled={pending} type="submit">
        {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Link2 size={16} />}
        {pending ? "Saving…" : "Save link"}
      </Button>
    </form>
  );
}
