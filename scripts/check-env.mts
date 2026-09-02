/**
 * Reports which environment variable NAMES each deployment surface still needs.
 *
 * Values are never read into the output, so this is safe to run in a terminal
 * or a CI log. Run with: npm run env:check
 */
import { auditEnvironment } from "../src/lib/env/contracts.ts";
import { loadLocalEnvFiles } from "./lib/load-env.mts";

const loaded = loadLocalEnvFiles();
const report = auditEnvironment(process.env);

console.log(
  loaded.length > 0
    ? `Loaded local environment files: ${loaded.join(", ")}`
    : "No local environment file found; reading the current process environment.",
);

for (const surface of report) {
  console.log(`\n${surface.surface} — ${surface.description}`);
  console.log(`  present (${surface.present.length}): ${surface.present.join(", ") || "none"}`);
  console.log(`  missing (${surface.missing.length}): ${surface.missing.join(", ") || "none"}`);
}

console.log(
  "\nDatabase Vault secrets are stored in Postgres, not in this file:" +
    "\n  project_url, internal_cron_secret" +
    "\n  Verify with: select name from vault.secrets order by name;",
);

const incomplete = report.filter((surface) => !surface.satisfied);

if (incomplete.length > 0) {
  console.error(
    `\nIncomplete: ${incomplete.map((surface) => surface.surface).join(", ")}. See .env.example.`,
  );
  process.exitCode = 1;
} else {
  console.log("\nEvery configured surface has all required variable names.");
}
