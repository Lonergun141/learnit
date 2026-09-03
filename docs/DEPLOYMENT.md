# Deployment

Every step below is run by a human against a project they own. Nothing in this
repository deploys, links, or mutates a remote service on its own.

Order matters: database first, then Edge Function secrets, then the functions,
then Vault and cron, then Telegram, then Vercel. The cron schedule starts
calling the worker as soon as the Vault secrets exist, so create them only once
the functions are deployed.

---

## 1. Link the Supabase project

```bash
npx supabase login
npx supabase projects list
npx supabase link --project-ref <project-ref>
```

Confirm you linked the intended project before continuing:

```bash
npx supabase projects list          # the linked project is marked ●
```

## 2. Push the migrations

Review what will run, then apply it:

```bash
npx supabase db diff --linked --schema public   # expect no unexpected drift
npx supabase db push
```

`db push` is additive here — no migration drops user data. It creates the nine
user-owned tables, their RLS policies, the job state machine RPCs, and enables
`pg_cron`, `pg_net`, and `supabase_vault`.

Verify:

```bash
npx supabase db lint --linked
```

## 3. Set the Edge Function secrets

The functions read these at runtime. Set them from your filled-in `.env.local`:

```bash
npx supabase secrets set --env-file ./.env.local
npx supabase secrets list            # prints names and digests, never values
```

Required names:

| Name | Used by |
| --- | --- |
| `GEMINI_API_KEY` | worker |
| `GEMINI_MODEL` | worker |
| `SUPADATA_API_KEY` | worker (YouTube transcripts, playlists) |
| `FIRECRAWL_API_KEY` | worker (article scraping) |
| `TELEGRAM_BOT_TOKEN` | worker + webhook |
| `TELEGRAM_BOT_USERNAME` | webhook (`/start` guidance) |
| `TELEGRAM_WEBHOOK_SECRET` | webhook (header check) |
| `INTERNAL_CRON_SECRET` | worker (header check) |
| `APP_BASE_URL` | worker (topic links in the digest) |

Hosted Supabase injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into
every function. Do **not** set those two yourself.

Generate the two shared secrets once, and keep them out of your shell history:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

## 4. Deploy the Edge Functions

```bash
npx supabase functions deploy telegram-webhook
npx supabase functions deploy process-learning-jobs
npx supabase functions list
```

Both are declared `verify_jwt = false` in `supabase/config.toml`, which the CLI
applies on deploy. They are not unauthenticated: each one checks a shared secret
header before touching the database.

- `telegram-webhook` requires `X-Telegram-Bot-Api-Secret-Token`, compared
  against `TELEGRAM_WEBHOOK_SECRET` before the request body is parsed.
- `process-learning-jobs` requires `X-Internal-Cron-Secret`, compared against
  `INTERNAL_CRON_SECRET`.

## 5. Create the Vault secrets and confirm cron

The database invokes the worker itself, so it needs the project URL and the
shared cron secret. They live in Supabase Vault, never in a migration.

Run this in the SQL editor of the linked project (values are yours, and are
encrypted at rest):

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<INTERNAL_CRON_SECRET>', 'internal_cron_secret');
```

To rotate a secret later, update it in place rather than adding a second row:

```sql
select vault.update_secret(id, '<new value>')
from vault.secrets
where name = 'internal_cron_secret';
```

Confirm the names exist and the two schedules are installed:

```sql
select name from vault.secrets order by name;

select jobname, schedule, active
from cron.job
where jobname in ('process-learning-jobs', 'enqueue-due-maintenance-jobs');
```

Expected:

| jobname | schedule |
| --- | --- |
| `process-learning-jobs` | `* * * * *` |
| `enqueue-due-maintenance-jobs` | `0 * * * *` |

`public.invoke_process_learning_jobs()` reads both secrets on every run and
returns `null` without making a request when either is missing — so an
environment without Vault secrets simply does nothing instead of queueing failing
HTTP calls.

Check recent runs:

```sql
select jobid, status, return_message, start_time
from cron.job_run_details
order by start_time desc
limit 20;
```

## 6. Point Telegram at the webhook

Set `NEXT_PUBLIC_SUPABASE_URL`, `TELEGRAM_BOT_TOKEN`, and
`TELEGRAM_WEBHOOK_SECRET` in `.env.local` first — the scripts read them locally
and never print the bot token.

```bash
npm run telegram:status              # read-only, safe to run any time
npm run telegram:set -- --yes        # points the bot at the deployed function
npm run telegram:delete -- --yes     # stops delivery
```

`set` and `delete` refuse to run without `--yes`, because they change live
routing for the bot. After `set`, re-run `telegram:status` and confirm `url`
ends in `/functions/v1/telegram-webhook`, `lastErrorMessage` is `null`, and
`pendingUpdateCount` drains toward zero.

## 7. Deploy the web app to Vercel

The web app is the UI and auth layer only. It runs no generation and needs no
service-role key — every query goes through RLS as the signed-in user.

Set these in the Vercel project (all environments):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
TELEGRAM_BOT_USERNAME
```

`NEXT_PUBLIC_APP_URL` must be the public origin with no trailing slash, and must
match the `APP_BASE_URL` function secret so digest links resolve.

Then add the deployed origin to Supabase Auth → URL Configuration, as the Site
URL and as a redirect URL including `/auth/callback`.

### If a confirmation email lands on localhost

Both halves above have to be right, and the failure looks identical either way:
the account is created, the email arrives, and the confirm link drops the user on
`http://localhost:3000`.

Copy the link out of the email and read its `redirect_to=` parameter.

- **`redirect_to` is localhost** — the app sent it. `NEXT_PUBLIC_APP_URL` in the
  Vercel project is blank or still points at localhost. It is a `NEXT_PUBLIC_`
  name, so it is inlined at build time: change it and **redeploy**, because an
  existing deployment keeps the value it was built with.
- **`redirect_to` is the real origin** — Supabase discarded it. That origin is
  not in Auth → URL Configuration → Redirect URLs, so it fell back to the Site
  URL, which is still localhost. Add the origin (with `/auth/callback`) and set
  the Site URL.

The app refuses a loopback origin outside development, so a stale
`NEXT_PUBLIC_APP_URL` now falls through to the Vercel production domain instead
of being mailed out — but the Supabase allow-list still has to be correct.

## Verifying a live deployment

```bash
curl -s https://<app-domain>/api/health        # {"status":"ok","service":"learnit-web"}
npm run telegram:status
```

In SQL:

```sql
select stage, status, count(*) from public.learning_jobs group by 1, 2 order by 1, 2;
select digest_date, status from public.digests order by digest_date desc limit 7;
```

A job stuck in `running` is recovered automatically: the worker requeues stale
locks on every pass. A job in `dead` exhausted its attempts; `failed` was a
permanent provider error. Both surface on the item in `/library`, where the user
can retry.

## Two-user acceptance test

1. Sign up as user A, open `/settings/integrations`, generate the Telegram link,
   and open it. The bot confirms the connection.
2. Send a YouTube URL to the bot. Within a minute or two `/library` shows the
   item moving `new → fetched → sorted → done`, and `/topics` gains a topic with
   a guide, a briefing, and a quiz.
3. Sign up as user B in a separate browser profile, connect the same bot from a
   different Telegram account, and send a different URL.
4. Confirm user A sees only their own items and topics, and user B only theirs —
   including by calling the Supabase REST API directly with user A's token.
5. Set user B's digest hour to the current local hour and wait for the top of the
   hour; the digest arrives only in user B's chat.

## Rollback

- **Stop all background work:** `select cron.unschedule('process-learning-jobs');`
  and the same for `enqueue-due-maintenance-jobs`. Re-run the migration to restore
  them.
- **Stop Telegram capture:** `npm run telegram:delete -- --yes`.
- **Revert the web app:** promote the previous Vercel deployment.

Database migrations are forward-only; write a new migration rather than editing
one that has been pushed.
