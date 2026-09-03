-- New accounts default to Asia/Manila rather than UTC.
--
-- The default decides when someone's first digest arrives, and every account so
-- far has been in Manila. UTC meant a new signup's 06:00 digest landed at 14:00
-- local until they found the setting and changed it.
--
-- This changes the column default only. Existing rows are deliberately left
-- alone: a stored timezone is a choice someone made, or a default they have
-- already been living with, and silently moving their digest by eight hours is
-- not this migration's business. Anyone on UTC who wants Manila can change it
-- in settings.
--
-- private.safe_timezone() still falls back to UTC. That fallback is a guard
-- against a blank or unrecognised value, not a default for new accounts — the
-- column default below fills the value long before it is consulted — so it is
-- left as the neutral choice.

alter table public.user_settings
  alter column timezone set default 'Asia/Manila';

-- profiles.timezone mirrors user_settings.timezone through a trigger, so this
-- default only governs the instant between the two inserts in handle_new_user().
-- Matching it keeps the two columns from disagreeing even briefly.
alter table public.profiles
  alter column timezone set default 'Asia/Manila';

comment on column public.user_settings.timezone
is 'IANA timezone driving the digest schedule. New accounts default to Asia/Manila.';
