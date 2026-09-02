create or replace function public.complete_maintenance_job(
  p_job_id uuid,
  p_worker_id text,
  p_update_playlist_poll_time boolean default false
)
returns public.job_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.learning_jobs%rowtype;
begin
  select learning_job.*
  into v_job
  from public.learning_jobs as learning_job
  where learning_job.id = p_job_id
  for update;

  if v_job.id is null
    or v_job.stage <> 'capture_playlist'
    or v_job.status <> 'running'
    or v_job.locked_by <> nullif(btrim(p_worker_id), '') then
    raise exception 'Maintenance job is not owned by this worker' using errcode = '55000';
  end if;

  if p_update_playlist_poll_time then
    update public.user_settings
    set youtube_last_polled_at = now()
    where user_id = v_job.user_id;

    if not found then
      raise exception 'Maintenance settings were not found' using errcode = 'P0002';
    end if;
  end if;

  update public.learning_jobs
  set status = 'succeeded',
      locked_at = null,
      locked_by = null,
      last_error = null
  where id = v_job.id;

  return 'succeeded'::public.job_status;
end;
$$;

revoke all on function public.complete_maintenance_job(uuid, text, boolean)
from public, anon, authenticated;
grant execute on function public.complete_maintenance_job(uuid, text, boolean)
to service_role;

comment on function public.complete_maintenance_job(uuid, text, boolean)
is 'Atomically records playlist polling when requested and succeeds an owned capture job.';
