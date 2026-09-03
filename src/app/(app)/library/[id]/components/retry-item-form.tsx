"use client";

import { LoaderCircle, RotateCcw } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { retryLearningItem, type RetryItemState } from "../../actions";

interface RetryItemFormProps {
  itemId: string;
  stageLabel: string;
}

export function RetryItemForm({ itemId, stageLabel }: RetryItemFormProps) {
  const [state, action, pending] = useActionState<RetryItemState, FormData>(
    retryLearningItem.bind(null, itemId),
    {},
  );

  return (
    <div className="flex flex-col items-start gap-3">
      <form action={action}>
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? <LoaderCircle className="animate-spin" size={15} /> : <RotateCcw size={15} />}
          {pending ? "Queuing…" : `Retry ${stageLabel}`}
        </Button>
      </form>
      {state.message ? (
        <p
          className={`font-mono text-[0.6875rem] ${state.status === "error" ? "text-danger" : "text-signal"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
