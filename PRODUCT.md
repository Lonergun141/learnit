# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

LearnIT serves individual learners and knowledge workers who collect educational YouTube videos and articles across the web. Each person uses one shared Telegram bot, the web app, or an optional YouTube playlist while retaining a private, user-scoped library.

## Product Purpose

LearnIT turns saved links into reusable topic-level learning material. It captures content, retrieves the source text, classifies it into a durable topic, generates a study guide, briefing, and quiz, and makes those materials available in the web app and in a user-specific Telegram digest.

Success means a learner can save a link quickly, trust the processing state, study consolidated material by topic, and remain isolated from every other user's data.

## Positioning

LearnIT continually rebuilds one current learning set per topic from multiple sources while retaining artifact history. The topic—not an individual link—is the durable unit of study.

## Operating Context

Users authenticate in the Next.js web app, save links manually or through a shared Telegram bot, review processing and retry failures, study topic artifacts, take local interactive quizzes, configure playlist capture, and receive daily Telegram digests. Background processing runs in Supabase Edge Functions and scheduled database jobs without requiring a local computer.

## Capabilities and Constraints

- Multi-user Supabase Auth and row-level isolation are mandatory.
- Sources are manual web submissions, Telegram messages, and optional YouTube playlist capture.
- Supadata retrieves YouTube transcripts and metadata; Firecrawl scrapes articles; Gemini classifies topics and generates validated artifacts.
- Generated materials consist of a Study Guide, Briefing, and Quiz and update atomically at topic level.
- The MVP is free: no billing, checkout, subscriptions, premium tiers, or payment providers.
- Defensive limits constrain daily captures, worker batches, retries, source counts, transcripts, and AI input size.
- Production must run in cloud infrastructure without Baserow, NotebookLM, Claude Code, local schedulers, or the user's laptop.
- Secrets remain server-side. Remote database, webhook, Edge Function, and Vercel deployment are user-controlled release steps.

## Brand Commitments

The product name is LearnIT. Product language should be concise, reassuring, and operational: users should always understand what was saved, what is processing, what failed, and how to recover.

## Evidence on Hand

The supplied implementation brief records a previously successful prototype workflow and its proven topic-level regeneration semantics. The repository contains no production testimonials, customer logos, benchmarks, or marketing claims; future work must not fabricate them.

## Product Principles

1. Organize knowledge around reusable topics, not isolated links.
2. Make background work and recovery states legible.
3. Enforce user ownership in the database, not only in the interface.
4. Keep capture fast and defer expensive processing to durable cloud jobs.
5. Prefer simple free-tier guardrails over premature billing complexity.

## Accessibility & Inclusion

The responsive web interface must use semantic controls, keyboard-visible focus, labeled forms, accessible contrast, and layouts that remain usable on mobile and desktop.
