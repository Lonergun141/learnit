-- The bootstrap trigger only fires on insert into auth.users, so deploying this
-- schema to a project that already has accounts leaves those users without a
-- profile or settings row. Every capture then fails with 'User settings were
-- not found'. Repair them, and keep the routine idempotent so it is safe to run
-- again after any future auth import.

create or replace function private.backfill_missing_user_records()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_repaired integer;
begin
  insert into public.profiles (id, display_name)
  select
    account.id,
    left(
      nullif(
        btrim(
          coalesce(
            account.raw_user_meta_data ->> 'display_name',
            account.raw_user_meta_data ->> 'full_name',
            ''
          )
        ),
        ''
      ),
      80
    )
  from auth.users as account
  on conflict (id) do nothing;

  get diagnostics v_repaired = row_count;

  insert into public.user_settings (user_id)
  select account.id
  from auth.users as account
  on conflict (user_id) do nothing;

  return v_repaired;
end;
$$;

revoke all on function private.backfill_missing_user_records()
from public, anon, authenticated;

comment on function private.backfill_missing_user_records()
is 'Creates missing profile and settings rows for auth users that predate the bootstrap trigger. Idempotent.';

select private.backfill_missing_user_records();
