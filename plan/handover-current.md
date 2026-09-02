# LearnIt implementation handover

Updated: 2026-09-03 (Asia/Shanghai), second session

## Objective and operating constraints

Continue implementing `plan/implementation-one-shot.txt` in this repository.

- Work directly on `feature/learnit-v2`, which was branched from `main`.
- Do not use subagents, agents, or git worktrees.
- Do not commit, push, deploy, or mutate remote services unless the user explicitly asks.
- Preserve all existing user changes and the untracked source plan.
- Read relevant installed Next.js 16.3.4 guides in `node_modules/next/dist/docs/` before changing Next.js APIs or conventions. The root `AGENTS.md` warning is authoritative.
- Use test-driven development for feature and bug-fix work.
- Do not print secrets or copy development keys into source, migrations, logs, or documentation.
- Docker Desktop is open. Local Supabase is running on the custom `5542x` ports in `supabase/config.toml`.

## Exact repository state

- Repository: `C:\Users\clyde\OneDrive\Desktop\Development\YAHSHUA\learnit`
- Branch: `feature/learnit-v2`
- HEAD: `d6c95c2 Initial commit from Create Next App`
- No commits have been created. All implementation remains in the intentionally dirty working tree.
- The user's `next dev` server is running on port 3000 against the remote Supabase project in `.env`.

Do not clean, reset, stash, or overwrite this tree.

## Verification status — everything currently green

```text
npm.cmd test                      21 files, 101 tests passed
npm.cmd run lint                  passed, no warnings
npm.cmd run typecheck             passed
npm.cmd run build                 passed
npx.cmd supabase db reset --local --yes   passed with all 9 migrations
npx.cmd supabase test db --local  69 pgTAP assertions passed
npx.cmd supabase db lint --local  no schema errors
npx.cmd supabase db advisors --local --type all --level info
                                  0 warn/error; INFO only (unindexed composite
                                  ownership FKs, unused indexes on an empty DB)
git diff --check                  clean
```

Run `typecheck` and `build` sequentially, never concurrently — they race on `.next/types`.

## Completed in this session

### Cron and Vault (was the red-test checkpoint)

`supabase/migrations/20260903010000_cron_schedules.sql`:

- enables `pg_cron` (in `pg_catalog`), `pg_net` (in `extensions`), and `supabase_vault`;
- `public.invoke_process_learning_jobs()` reads the `project_url` and
  `internal_cron_secret` Vault secrets at execution time and posts to
  `/functions/v1/process-learning-jobs` with `X-Internal-Cron-Secret` and
  `{"batchSize": 5}`, 30 s timeout;
- returns `null` without any HTTP request when either secret is absent, so local
  resets and CI are a silent no-op;
- revoked from `public`, `anon`, and `authenticated`;
- schedules `process-learning-jobs` at `* * * * *` and
  `enqueue-due-maintenance-jobs` at `0 * * * *`, unscheduling first so the
  migration is re-runnable.

No secret value appears in any migration. Verified locally: `cron.job_run_details`
shows the minute job succeeding repeatedly, and `net.http_request_queue` stayed
empty.

### Terminal digest failures

`supabase/migrations/20260903011500_terminal_digest_failure.sql` — a digest job
that ends `failed`/`dead` now records a `failed` row in `public.digests` for its
digest date (never overwriting a `sent` one). Previously nothing recorded the
outcome, so `enqueue_due_maintenance_jobs()` re-created the same digest job every
hour for the rest of the user's local day. Covered by pgTAP.

### Authoritative timezone

`supabase/migrations/20260903013000_mirror_settings_timezone.sql` — a trigger
mirrors `user_settings.timezone` (authoritative; the digest scheduler reads it)
onto `profiles.timezone`, plus a backfill. The settings Server Action's second,
unchecked `profiles` write was removed. Covered by pgTAP.

### Environment and operational scripts

- `scripts/check-env.mts` (`npm run env:check`) reports missing variable **names**
  per surface; never reads a value into its output.
- `scripts/telegram-webhook.mts` (`npm run telegram:status` / `telegram:set` /
  `telegram:delete`) — `set` and `delete` refuse to run without `--yes`; the bot
  token is never printed and secrets are redacted out of Telegram error text.
- `scripts/generate-types.mts` (`npm run types:generate`) regenerates
  `src/types/database.ts` and reapplies the five argument-nullability widenings
  the Supabase generator cannot infer. Verified idempotent.
- Scripts are `.mts` run with `node --experimental-strip-types`.

### Documentation

- `.env.example` rewritten with names, comments, and the two Vault secret names;
  `.gitignore` gained `!.env.example` so it is committable.
- `README.md` replaced the create-next-app starter.
- `docs/DEPLOYMENT.md` — ordered link/push/secrets/deploy/Vault/Telegram/Vercel
  commands, verification queries, the two-user acceptance test, and rollback.

### CI

`.github/workflows/ci.yml` — Node 22. Job 1: lint, test, typecheck, build (build
env is placeholders only; verified by building with `.env` moved aside, then
restored byte-identically). Job 2: `supabase start`, `db reset`, `test db`,
`db lint`.

### Web application fixes

- **RSC boundary bug**: `AppShell` passed lucide icon *components* to the
  `NavLink` Client Component. Navigation now carries an icon *name* and
  `nav-link.tsx` resolves it. This was a live console error before the fix.
- Error boundaries added: `(app)/error.tsx`, `(auth)/error.tsx`,
  `app/global-error.tsx`, `app/not-found.tsx`, plus `components/ui/error-state.tsx`.
  Next 16 passes `retry`, not `reset`.
- `src/lib/learning/errors.ts` maps the RPCs' actionable exceptions (daily
  capture limit, non-retryable item, missing item, unconfigured playlist) to user
  wording; anything else falls back to a generic message so SQL never surfaces.
- `retryLearningItem` and `disconnectTelegramAction` return action state instead
  of throwing, with new `retry-item-form.tsx` and `telegram-disconnect.tsx`.
- Auth forms retain display name and email after a rejected submission
  (`retainedAuthValues`); the password is never echoed back.
- Telegram bot username is environment-driven (`TELEGRAM_BOT_USERNAME`) in both
  the deep link and the settings copy.
- Removed dead code: `src/lib/supabase/admin.ts`, `getAdminEnv`/`parseAdminEnv`,
  `getWorkerEnv`/`parseWorkerEnv` (its key list disagreed with the Edge
  function's actual requirements), and `components/ui/form-submit-button.tsx`.
  The web app now provably needs no service-role key.

### Browser verification (local Supabase, throwaway users, port 3100)

Confirmed working: unauthenticated redirects to `/login`; signup; password policy
messages; dashboard metrics and empty states; save-link capture with URL
canonicalization (`&list=`/`&index=` stripped); library list and item detail;
settings save; the timezone mirror trigger writing through to `profiles`; the
env-driven `t.me/<bot>` deep link; the 404 page inside the app shell; and the
auth-form retention fix.

Two-user isolation via the REST API with real user tokens:

```text
A sees learning_items: 1        B sees learning_items: 1
A sees B's URL: 0               B sees A's URL: 0
A sees user_settings: 1         A sees profiles: 1
A patching B's item -> 42501    A calling claim_learning_jobs -> 42501
A calling invoke_process_learning_jobs -> 42501
```

The local database was reset afterwards, so the test users are gone.

## Remaining work

1. **Mobile visual verification.** Desktop was verified in a real browser. The
   window-resize tool did not change the rendered viewport in this Chrome setup,
   so the mobile layout was only checked structurally (`lg:hidden` bottom nav +
   mobile header, `pb-24` clearance, safe-area inset). Re-check on a real narrow
   viewport or via device emulation.
2. **Error boundaries were not runtime-triggered.** They type-check, build, and
   match the Next 16 `retry` contract, but no forced failure exercised them.
3. **Final security / accessibility pass.** `DESIGN.md` is *not* required — the
   plan never asks for it, and the design contract lives in `src/app/layout.tsx`.
4. **Provider smoke tests are still mocked.** Real Firecrawl/Supadata/Gemini
   calls consume credits and need explicit authorization.
5. **Nothing has been deployed.** Migrations are local-only; no remote link, no
   `db push`, no function deploy, no Telegram webhook registered (`telegram:status`
   confirmed the production bot has no webhook set, with 3 pending updates).

Advisory, not blocking: the composite ownership foreign keys
(`(topic_id, user_id)`, `(item_id, user_id)`) have no covering index. Cascades
only run on account deletion, so indexes would be write cost for no read benefit.

## Safe continuation commands

```powershell
git branch --show-current
git status --short
npx.cmd supabase test db --local
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run env:check
```
