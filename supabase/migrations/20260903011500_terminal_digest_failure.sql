-- Terminal digest failures must be recorded so the hourly maintenance sweep
-- stops re-enqueueing the same day's digest forever. Recording a failed digest
-- row for the job's digest date makes `enqueue_due_maintenance_jobs` skip that
-- user for the rest of their local day, and surfaces the failure to the user.

create or replace function public.fail_learning_job(
  p_job_id uuid,
  p_worker_id text,
  p_error text,
  p_retryable boolean,
  p_payload_patch jsonb default '{}'::jsonb
)
returns public.job_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.learning_jobs%rowtype;
  v_status public.job_status;
  v_error text := left(coalesce(nullif(btrim(p_error), ''), 'Job processing failed'), 500);
  v_digest_date date;
begin
  select learning_job.*
  into v_job
  from public.learning_jobs as learning_job
  where learning_job.id = p_job_id
  for update;

  if v_job.id is null
    or v_job.status <> 'running'
    or v_job.locked_by <> nullif(btrim(p_worker_id), '') then
    raise exception 'Job is not owned by this worker' using errcode = '55000';
  end if;

  if jsonb_typeof(coalesce(p_payload_patch, '{}'::jsonb)) <> 'object' then
    raise exception 'Job payload patch must be an object' using errcode = '22023';
  end if;

  v_status := case
    when not p_retryable then 'failed'::public.job_status
    when v_job.attempts >= v_job.max_attempts then 'dead'::public.job_status
    else 'queued'::public.job_status
  end;

  update public.learning_jobs
  set status = v_status,
      run_after = case
        when v_status = 'queued' then now() + make_interval(
          secs => least(900, (30 * power(2, greatest(v_job.attempts - 1, 0)))::integer)
        )
        else run_after
      end,
      payload = payload || coalesce(p_payload_patch, '{}'::jsonb),
      locked_at = null,
      locked_by = null,
      last_error = v_error
  where id = v_job.id;

  if v_status in ('failed', 'dead') and v_job.stage = 'fetch' then
    update public.learning_items
    set status = 'failed', error = v_error, failure_stage = 'fetch'
    where id = v_job.item_id and user_id = v_job.user_id;
  elsif v_status in ('failed', 'dead') and v_job.stage = 'classify' then
    update public.learning_items
    set error = v_error, failure_stage = 'classify'
    where id = v_job.item_id and user_id = v_job.user_id and status = 'fetched';
  elsif v_status in ('failed', 'dead') and v_job.stage = 'build_topic' then
    update public.learning_items
    set error = v_error, failure_stage = 'build_topic'
    where topic_id = v_job.topic_id and user_id = v_job.user_id and status = 'sorted';
  elsif v_status in ('failed', 'dead') and v_job.stage = 'digest' then
    begin
      v_digest_date := (v_job.payload ->> 'digest_date')::date;
    exception when others then
      v_digest_date := null;
    end;

    if v_digest_date is not null then
      insert into public.digests (user_id, digest_date, status, error)
      values (v_job.user_id, v_digest_date, 'failed', v_error)
      on conflict (user_id, digest_date) do update
      set status = 'failed',
          error = excluded.error
      where digests.status <> 'sent';
    end if;
  end if;

  return v_status;
end;
$$;

revoke all on function public.fail_learning_job(uuid, text, text, boolean, jsonb)
from public, anon, authenticated;
grant execute on function public.fail_learning_job(uuid, text, text, boolean, jsonb)
to service_role;

comment on function public.fail_learning_job(uuid, text, text, boolean, jsonb)
is 'Requeues or terminates an owned running job, preserves the item status semantics for its failed stage, and records a terminal digest failure so the day is not retried forever.';
