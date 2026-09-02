"use server";

import { revalidatePath } from "next/cache";

import { describeDatabaseFailure } from "@/lib/learning/errors";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export interface RetryItemState {
  status?: "queued" | "error";
  message?: string;
}

export async function retryLearningItem(
  itemId: string,
  _previousState: RetryItemState,
): Promise<RetryItemState> {
  void _previousState;
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("retry_learning_item", { p_item_id: itemId });

  if (error) {
    return {
      status: "error",
      message: describeDatabaseFailure(error, "This item could not be retried. Try again."),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/library");
  revalidatePath(`/library/${itemId}`);

  return { status: "queued", message: "Retry queued. Processing resumes within a minute." };
}
