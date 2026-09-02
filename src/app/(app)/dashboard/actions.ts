"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { describeDatabaseFailure } from "@/lib/learning/errors";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

import { prepareLearningItem } from "./lib/save-link";

export interface SaveLinkState {
  status?: "created" | "duplicate" | "error";
  message?: string;
  itemId?: string;
}

export async function saveLinkAction(
  _previousState: SaveLinkState,
  formData: FormData,
): Promise<SaveLinkState> {
  await requireAuthenticatedUser();

  let item: ReturnType<typeof prepareLearningItem>;
  try {
    item = prepareLearningItem({
      url: String(formData.get("url") ?? ""),
      note: String(formData.get("note") ?? ""),
    });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message
        : error instanceof Error
          ? error.message
          : "Enter a valid link.";
    return { status: "error", message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_learning_item_for_current_user", {
    p_source: "web",
    p_content_type: item.contentType,
    p_url: item.url,
    p_canonical_url: item.canonicalUrl,
    p_note: item.note,
  });

  if (error || !data?.[0]) {
    return {
      status: "error",
      message: describeDatabaseFailure(error, "We could not save that link. Please try again."),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/library");

  return data[0].was_created
    ? {
        status: "created",
        message: "Link saved. Processing will continue in the background.",
        itemId: data[0].item_id,
      }
    : {
        status: "duplicate",
        message: "That link is already in your library.",
        itemId: data[0].item_id,
      };
}
