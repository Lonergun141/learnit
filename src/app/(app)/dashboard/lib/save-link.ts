import { z } from "zod";

import { canonicalizeUrl, detectContentType } from "@/lib/learning/urls";

const saveLinkSchema = z.object({
  url: z.string().trim().min(1, "Enter a URL").max(2048, "URL is too long"),
  note: z
    .string()
    .trim()
    .max(2000, "Note must be 2000 characters or fewer")
    .optional()
    .transform((value) => value || undefined),
});

export function prepareLearningItem(input: { url: string; note?: string }) {
  const parsed = saveLinkSchema.parse(input);

  return {
    url: parsed.url,
    canonicalUrl: canonicalizeUrl(parsed.url),
    contentType: detectContentType(parsed.url),
    note: parsed.note,
  };
}
