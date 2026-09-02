import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ENV_FILES = [".env.local", ".env"] as const;

/**
 * Loads local env files into `process.env` for operational scripts and returns
 * the names of the files that were found. Existing variables win, matching how
 * Next.js resolves precedence, so an exported shell value is never overwritten.
 */
export function loadLocalEnvFiles(cwd = process.cwd()): string[] {
  const loaded: string[] = [];

  for (const file of ENV_FILES) {
    const path = resolve(cwd, file);
    if (!existsSync(path)) continue;

    try {
      process.loadEnvFile(path);
      loaded.push(file);
    } catch {
      console.warn(`Could not parse ${file}; skipping it.`);
    }
  }

  return loaded;
}
