# LearnIT — Product & Deck Brief

> Source of truth for the LearnIT marketing/pitch deck. Extracted from the codebase
> (`PRODUCT.md`, `README.md`, `plan/handover-current.md`, `.env.example`,
> `package.json`, `src/app/layout.tsx`, `src/app/globals.css`,
> `src/lib/onboarding/steps.ts`). Keep claims to capabilities and design — the repo
> has **no testimonials, logos, benchmarks, or traction metrics, and none may be fabricated**.

## What LearnIT is (one-liner)

Send a link to a Telegram bot (or paste it in the web app); get back a study guide, a
briefing, and a quiz — grouped by **topic, not by link** — plus a daily digest.
Everything a user captures is private, enforced by Postgres row-level security.

**Positioning:** The topic — not an individual link — is the durable unit of study.
LearnIT continually rebuilds one current learning set per topic from multiple sources
while retaining artifact history.

---

## 1. Problem Statement

People save educational YouTube videos and articles constantly — in Telegram, browser
tabs, playlists — but those links pile up as dead bookmarks. Nothing turns them into
studyable material, and the same subject stays scattered across a dozen separate links
that never get revisited.

The link is the wrong unit of knowledge — the topic is. Saved content is disorganized,
per-link, and never consolidated, so learners can't study it as a coherent body of
material. It's timely because capture takes seconds (paste a link, or forward it to a
bot) but the valuable work — reading, summarizing, quizzing, organizing by subject — is
slow, so it never gets done manually. LearnIT defers that expensive work to durable
cloud jobs so it happens automatically with the browser closed.

## 2. Core Features (non-negotiable, all built & tested)

Build status: 101 unit tests + 69 pgTAP assertions passing.

- **Fast multi-channel capture** — save a link three ways: the web dashboard, a shared
  Telegram bot, or an optional YouTube playlist that auto-captures new videos. URLs are
  canonicalized (playlist/index params stripped) on the way in.
- **Automatic topic-level generation** — every source runs a pipeline
  (`fetch → classify → build_topic`) that retrieves the source text, files it under a
  durable topic, and produces three artifacts per topic: a **Study Guide, a Briefing,
  and an interactive Quiz**. Materials rebuild atomically when new sources arrive on a
  topic; earlier versions are retained.
- **Legible processing & recovery** — the Library shows the exact stage of every source
  (New → Fetched → Sorted → Done). Failures are marked "Needs attention," name the stage
  that broke, and offer a retry *from that stage* — nothing stalls silently.
- **Daily Telegram digest** — a once-a-day summary of finished work, delivered at the
  user's local hour, with links back into the app.
- **Strict per-user isolation** — every read/write enforced by Postgres row-level
  security; verified by a two-user test (User A sees 0 of User B's items; cross-user
  writes return permission errors).

## 3. User Flow

(Mirrors the app's own five-step onboarding walkthrough.)

1. **Land & authenticate** — sign up / log in via Supabase email auth (`/login`, `/signup`).
2. **Capture** — on the dashboard, paste a YouTube or article link (or forward it to the
   Telegram bot, optionally with a note). It's queued instantly.
3. **Watch it process** — the Library shows the source moving through stages
   (New → Fetched → Sorted → Done); dashboard counters track the whole set. Background
   workers run every minute.
4. **Study by topic** — open `/topics/[id]` to read the consolidated study guide and
   briefing, and take the interactive quiz for that subject.
5. **Recover & automate** — retry any failed source from its broken stage; connect
   Telegram for a daily digest, or point it at a YouTube playlist for hands-free capture.

Primary goal completed = a saved link has become studyable topic material the learner can
review and quiz on.

## 4. Visual Requirements

Design contract is named in `layout.tsx` / `globals.css` — theme **"Signal Lab":**

- **Aesthetic:** blueprint / technical-instrument look. Structure drawn with hairlines and
  blueprint linework, *never shadows or blur* ("depth is drawn, not blurred").
- **Color scheme (dark, warm):** warm-charcoal canvas (`#171514`), cream type (`#fffcec`),
  single **pistachio-green "signal" accent** (`#c3eda1`). Status colors: coral/danger,
  gold/warning, blue/info, violet. Two faint radial washes + a subtle 3% film-grain overlay.
- **Typography system:** heavy uppercase geometric display (Poppins) for hierarchy;
  monospace micro-labels (Fragment Mono) for metadata; editorial serif italic
  (Instrument Serif) for *one accent word per headline*; Inter for body. Links use a
  bracketed `[ LABEL ]` signature.
- **Signature motifs:** faint measured blueprint grid behind hero areas; a slow
  "indeterminate transit hairline" sweeping under any row still processing (~once-a-minute
  cadence); full reduced-motion support.
- **Layout:** responsive, mobile-first, accessible — semantic controls, visible keyboard
  focus, labeled forms, accessible contrast, `lg:hidden` bottom nav on mobile with desktop
  side nav.

## 5. Technical Constraints

**Stack:** Next.js 16.3.4 (App Router, React 19), Tailwind CSS v4, TypeScript, on Vercel.
Backend: Supabase (Postgres + Auth + Edge Functions, Deno). Tests: Vitest + pgTAP. GSAP
for animation, react-markdown for artifact rendering, Zod for validation.

**Required external APIs / integrations:**

- **Supadata** — YouTube transcript + metadata retrieval
- **Firecrawl** — article scraping
- **Gemini** (`gemini-2.5-flash`, `@google/genai`) — topic classification + validated artifact generation
- **Telegram Bot API** — capture bot + daily digest webhook

**Architecture constraints (hard rules from the code):**

- Web app **never holds a service-role key and never runs long jobs** — all reads/writes go
  through RLS as the signed-in user; all generation happens in the `process-learning-jobs`
  Edge Function driven by a Postgres job queue.
- Background processing on **pg_cron** (worker every minute, maintenance hourly) via
  `pg_net`; two secrets (`project_url`, `internal_cron_secret`) live in **Supabase Vault**,
  not env files. Cron calls fail *closed* without the secret.
- **Defensive limits** everywhere: daily capture caps, worker batch sizes, retry/backoff
  ceilings, source counts, transcript and AI input-size limits.
- **MVP is free** — explicitly no billing, subscriptions, tiers, or payment providers.
- Must run entirely in cloud infra — **no local scheduler, no user's laptop, no
  Baserow/NotebookLM/Claude Code** in production.
- Secrets stay server-side; `env:check` reports missing variable *names* only, never values.

---

## Job pipeline (reference)

`fetch → classify → build_topic`, plus recurring `capture_playlist` and `digest` stages.
Each stage is claimed atomically, retried with exponential backoff, and terminated with a
stage-specific failure state so the UI can explain what went wrong.

## App routes (reference)

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/dashboard` or `/login` |
| `/login`, `/signup` | Supabase email auth |
| `/dashboard` | Capture a link, recent activity, counters |
| `/library`, `/library/[id]` | Every captured item, with retry for failures |
| `/topics`, `/topics/[id]` | Study guide, briefing, and interactive quiz |
| `/settings/integrations` | Digest hour, timezone, playlist, daily limit, Telegram |
| `/api/health` | `{"status":"ok","service":"learnit-web"}` |
