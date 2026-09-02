import { z } from "zod";

type EnvironmentSource = Record<string, string | undefined>;

const httpUrl = z
  .url()
  .refine((value) => value.startsWith("https://") || value.startsWith("http://"));

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
});

export function parsePublicEnv(source: EnvironmentSource) {
  const result = publicSchema.safeParse(source);

  if (!result.success) {
    throw new Error(
      `Invalid public environment: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    );
  }

  return {
    supabaseUrl: result.data.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: result.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export interface EnvironmentSurfaceReport {
  surface: string;
  description: string;
  present: string[];
  missing: string[];
  satisfied: boolean;
}

/**
 * Names only. Nothing here ever reads a value into a report, so an audit is
 * safe to print in a terminal or a CI log.
 */
const environmentSurfaces = [
  {
    surface: "web",
    description: "Next.js application (Vercel project environment)",
    keys: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_APP_URL",
      "TELEGRAM_BOT_USERNAME",
    ],
  },
  {
    surface: "edge-functions",
    description: "Supabase Edge Function secrets",
    keys: [
      "GEMINI_API_KEY",
      "GEMINI_MODEL",
      "SUPADATA_API_KEY",
      "FIRECRAWL_API_KEY",
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_BOT_USERNAME",
      "TELEGRAM_WEBHOOK_SECRET",
      "INTERNAL_CRON_SECRET",
      "APP_BASE_URL",
    ],
  },
] as const;

export function auditEnvironment(source: EnvironmentSource): EnvironmentSurfaceReport[] {
  return environmentSurfaces.map(({ surface, description, keys }) => {
    const present = keys.filter((key) => Boolean(source[key]?.trim()));
    const missing = keys.filter((key) => !source[key]?.trim());

    return { surface, description, present, missing, satisfied: missing.length === 0 };
  });
}

export function parseTelegramBotUsername(source: EnvironmentSource) {
  const username = source.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");

  if (!username) {
    throw new Error("Missing environment variable: TELEGRAM_BOT_USERNAME");
  }

  return username;
}
