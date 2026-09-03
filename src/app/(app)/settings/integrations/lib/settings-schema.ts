import { z } from "zod";

import { extractYouTubePlaylistId } from "@/lib/learning/urls";

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const checkbox = z
  .literal("on")
  .optional()
  .transform((value) => value === "on");

export const preferencesSchema = z
  .object({
    digestEnabled: checkbox,
    readyRepliesEnabled: checkbox,
    digestHour: z.coerce.number().int().min(0).max(23),
    timezone: z.string().trim().min(1).max(100).refine(isIanaTimezone, "Use a valid IANA timezone"),
    youtubeCaptureEnabled: checkbox,
    youtubePlaylistId: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((value) => value || undefined)
      .refine(
        (value) => value === undefined || extractYouTubePlaylistId(value) !== null,
        "Use a valid YouTube playlist ID or URL",
      )
      .transform((value) =>
        value === undefined ? undefined : (extractYouTubePlaylistId(value) ?? undefined),
      ),
    dailyItemLimit: z.coerce.number().int().min(1).max(100),
  })
  .superRefine((settings, context) => {
    if (settings.youtubeCaptureEnabled && !settings.youtubePlaylistId) {
      context.addIssue({
        code: "custom",
        path: ["youtubePlaylistId"],
        message: "Add a playlist ID before enabling capture",
      });
    }
  });

export interface PreferencesActionState {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}
