"use server";

import { revalidatePath } from "next/cache";

import { getTelegramBotUsername } from "@/lib/env/server";
import { describeDatabaseFailure } from "@/lib/learning/errors";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

import {
  preferencesSchema,
  type PreferencesActionState,
} from "./lib/settings-schema";

export interface TelegramLinkState {
  status?: "success" | "error";
  message?: string;
  url?: string;
  expiresAt?: string;
}

export interface PlaylistSyncState {
  status?: "success" | "error";
  message?: string;
}

export interface TelegramDisconnectState {
  status?: "success" | "error";
  message?: string;
}

export async function updatePreferencesAction(
  _previousState: PreferencesActionState,
  formData: FormData,
): Promise<PreferencesActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = preferencesSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted settings.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_settings")
    .update({
      digest_enabled: parsed.data.digestEnabled,
      digest_hour: parsed.data.digestHour,
      timezone: parsed.data.timezone,
      youtube_capture_enabled: parsed.data.youtubeCaptureEnabled,
      youtube_playlist_id: parsed.data.youtubePlaylistId ?? null,
      daily_item_limit: parsed.data.dailyItemLimit,
    })
    .eq("user_id", user.id);

  if (error) return { status: "error", message: "Settings could not be saved. Try again." };

  // profiles.timezone is mirrored by a trigger, so this is the only write needed.
  revalidatePath("/settings/integrations");
  return { status: "success", message: "Integration settings saved." };
}

export async function generateTelegramLinkAction(
  _previousState: TelegramLinkState,
): Promise<TelegramLinkState> {
  void _previousState;
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_telegram_link_token");
  const token = data?.[0];

  if (error || !token) {
    return { status: "error", message: "A connection link could not be created. Try again." };
  }

  return {
    status: "success",
    message: "This one-time link expires in 15 minutes.",
    url: `https://t.me/${getTelegramBotUsername()}?start=${encodeURIComponent(token.token)}`,
    expiresAt: token.expires_at,
  };
}

export async function disconnectTelegramAction(
  _previousState: TelegramDisconnectState,
): Promise<TelegramDisconnectState> {
  void _previousState;
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("telegram_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return { status: "error", message: "Telegram could not be disconnected. Try again." };
  }

  revalidatePath("/settings/integrations");
  return { status: "success", message: "Telegram disconnected." };
}

export async function syncPlaylistAction(
  _previousState: PlaylistSyncState,
): Promise<PlaylistSyncState> {
  void _previousState;
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "enqueue_playlist_sync_for_current_user",
  );

  if (error || !data) {
    return {
      status: "error",
      message: describeDatabaseFailure(
        error,
        "Playlist sync could not be queued. Try again.",
      ),
    };
  }

  revalidatePath("/settings/integrations");
  return { status: "success", message: "Playlist sync queued." };
}
