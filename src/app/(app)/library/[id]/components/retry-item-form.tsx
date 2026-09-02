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
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : <RotateCcw size={16} />}
          {pending ? "Queuing…" : `Retry ${stageLabel}`}
        </Button>
      </form>
      {state.message ? (
        <p
          className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
