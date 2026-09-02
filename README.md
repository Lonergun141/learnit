# LearnIT

Send a link to a Telegram bot; get back a study guide, a briefing, and a quiz,
grouped by topic, plus a daily digest. Everything a user captures is private to
that user and enforced by row-level security in Postgres.

## How it fits together

```
Telegram ──▶ telegram-webhook (Edge Function) ──▶ Postgres (learning_items, learning_jobs)
                                                        ▲            │
Next.js on Vercel ──── Supabase Auth / RLS ─────────────┘            │
                                                                     ▼
pg_cron (every minute) ──▶ process-learning-jobs (Edge Function) ──▶ Supadata / Firecrawl / Gemini
pg_cron (hourly)       ──▶ enqueue_due_maintenance_jobs()
```

The web app never runs long jobs and never holds a service-role key: it reads
and writes through RLS as the signed-in user. All generation happens in the
`process-learning-jobs` Edge Function, driven by a job queue in Postgres, so
capture and generation keep working with the browser closed.

### Routes

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/dashboard` or `/login` |
| `/login`, `/signup` | Supabase email auth |
| `/dashboard` | Capture a link, recent activity, counters |
| `/library`, `/library/[id]` | Every captured item, with retry for failures |
| `/topics`, `/topics/[id]` | Study guide, briefing, and interactive quiz |
| `/settings/integrations` | Digest hour, timezone, playlist, daily limit, Telegram |
| `/api/health` | `{"status":"ok","service":"learnit-web"}` |

### Job stages

`fetch` → `classify` → `build_topic`, plus the recurring `capture_playlist` and
`digest` stages. Each stage is claimed atomically, retried with exponential
backoff, and terminated with a stage-specific failure state so the UI can
explain what went wrong.

## Local development

Requires Node 22+, Docker Desktop, and the Supabase CLI (used via `npx`).

```bash
npm install
cp .env.example .env.local     # then fill in .env.local
npx supabase start
npx supabase db reset --yes    # applies every migration
npm run dev
```

Local Supabase uses non-default ports (API `55421`, database `55422`, Studio
`55423`) so it does not collide with other projects. `npx supabase status`
prints the local URLs and keys.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run env:check` | Reports missing environment variable **names** (never values) |
| `npm run telegram:status` | Read-only Telegram webhook status |
| `npm run telegram:set -- --yes` | Points Telegram at the deployed webhook |
| `npm run telegram:delete -- --yes` | Removes the Telegram webhook |
| `npx supabase test db --local` | pgTAP suite covering schema, RLS, and RPCs |
| `npx supabase functions serve --no-verify-jwt` | Runs both Edge Functions locally |

Run `typecheck` and `build` one after the other, not concurrently — they race on
`.next/types`.

## Configuration

`.env.example` lists every variable name with a comment explaining what it is
for. Copy it to `.env.local` and fill that in; `.env.local` is git-ignored.
`npm run env:check` tells you which names are still missing for each surface.

Two secrets live in Supabase Vault rather than in any env file, because the
database itself invokes the worker: `project_url` and `internal_cron_secret`.
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Deployment

[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) has the exact commands for Supabase
migrations, Edge Function secrets, Vault and cron setup, the Telegram webhook,
and Vercel.
