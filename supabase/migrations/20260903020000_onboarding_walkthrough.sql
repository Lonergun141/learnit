-- The web app shows a paginated walkthrough the first time someone signs in.
-- Completion is recorded on the account rather than in browser storage so the
-- walkthrough does not reappear on a second device, and so a deliberate replay
-- from the rail cannot be confused with a first visit.
--
-- Null means the walkthrough has never been finished or skipped. Existing
-- accounts are intentionally left null: they have not seen it either.

alter table public.user_settings
  add column onboarded_at timestamptz;

comment on column public.user_settings.onboarded_at
is 'When the account first finished or skipped the onboarding walkthrough. Null means it has not been seen.';

-- Column-scoped like every other authenticated grant on this table: a user may
-- record that they have seen the walkthrough, and nothing else new.
grant update (onboarded_at) on table public.user_settings to authenticated;
