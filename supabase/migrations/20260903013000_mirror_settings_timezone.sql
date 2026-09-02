-- `user_settings.timezone` is authoritative: it is what the digest scheduler
-- reads. `profiles.timezone` exists as part of the profile record, and was
-- previously kept current by a second write from the settings form whose error
-- was never checked, so the two could silently drift. Mirroring it in the same
-- statement removes that second write entirely.

create or replace function private.mirror_settings_timezone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set timezone = new.timezone
  where id = new.user_id
    and timezone is distinct from new.timezone;

  return new;
end;
$$;

create trigger user_settings_mirror_timezone
after insert or update of timezone on public.user_settings
for each row
execute function private.mirror_settings_timezone();

comment on function private.mirror_settings_timezone()
is 'Keeps profiles.timezone equal to the authoritative user_settings.timezone.';

comment on column public.profiles.timezone
is 'Mirror of user_settings.timezone, maintained by a trigger. Update user_settings instead.';

-- Backfill any drift left by the previous two-write path.
update public.profiles as profile
set timezone = settings.timezone
from public.user_settings as settings
where settings.user_id = profile.id
  and profile.timezone is distinct from settings.timezone;
