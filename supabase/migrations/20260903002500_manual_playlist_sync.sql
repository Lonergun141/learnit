create or replace function public.enqueue_playlist_sync_for_current_user()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_playlist_id text;
  v_enabled boolean;
  v_job_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select settings.youtube_capture_enabled, settings.youtube_playlist_id
  into v_enabled, v_playlist_id
  from public.user_settings as settings
  where settings.user_id = v_user_id;

  if not coalesce(v_enabled, false) or nullif(btrim(v_playlist_id), '') is null then
    raise exception 'Playlist capture must be configured and enabled' using errcode = '22023';
  end if;

  insert into public.learning_jobs (user_id, stage, payload)
  values (
    v_user_id,
    'capture_playlist',
    jsonb_build_object('playlist_id', v_playlist_id, 'requested_by', 'user')
  )
  on conflict do nothing
  returning id into v_job_id;

  if v_job_id is null then
    select learning_job.id
    into v_job_id
    from public.learning_jobs as learning_job
    where learning_job.user_id = v_user_id
      and learning_job.stage = 'capture_playlist'
      and learning_job.status in ('queued', 'running')
    order by learning_job.created_at desc
    limit 1;
  end if;

  return v_job_id;
end;
$$;

revoke all on function public.enqueue_playlist_sync_for_current_user()
from public, anon, authenticated;
grant execute on function public.enqueue_playlist_sync_for_current_user()
to authenticated;

comment on function public.enqueue_playlist_sync_for_current_user()
is 'Enqueues or returns the active playlist capture job for the authenticated user.';
