create or replace function public.complete_fetch_job(
  p_job_id uuid,
  p_worker_id text,
  p_title text,
  p_author text,
  p_transcript text,
  p_provider_metadata jsonb default '{}'::jsonb
)
returns public.learning_status
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
    or v_job.stage <> 'fetch'
    or v_job.status <> 'running'
    or v_job.locked_by <> nullif(btrim(p_worker_id), '') then
    raise exception 'Fetch job is not owned by this worker' using errcode = '55000';
  end if;

  if length(btrim(coalesce(p_transcript, ''))) < 500 then
    raise exception 'Fetched content must contain at least 500 characters' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_provider_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'Provider metadata must be an object' using errcode = '22023';
  end if;

  update public.learning_items
  set title = coalesce(nullif(btrim(p_title), ''), title),
      author = coalesce(nullif(btrim(p_author), ''), author),
      transcript = btrim(p_transcript),
      provider_metadata = provider_metadata || coalesce(p_provider_metadata, '{}'::jsonb),
      status = 'fetched',
      fetched_at = now(),
      error = null,
      failure_stage = null
  where id = v_job.item_id
    and user_id = v_job.user_id;

  if not found then
    raise exception 'Fetch job item was not found' using errcode = 'P0002';
  end if;

  insert into public.learning_jobs (user_id, item_id, stage)
  values (v_job.user_id, v_job.item_id, 'classify')
  on conflict do nothing;

  update public.learning_jobs
  set status = 'succeeded',
      locked_at = null,
      locked_by = null,
      last_error = null
  where id = v_job.id;

  return 'fetched'::public.learning_status;
end;
$$;

create or replace function public.complete_classify_job(
  p_job_id uuid,
  p_worker_id text,
  p_topic_name text,
  p_normalized_name text,
  p_existing_topic_id uuid default null
)
returns public.learning_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.learning_jobs%rowtype;
  v_topic_id uuid;
begin
  select learning_job.*
  into v_job
  from public.learning_jobs as learning_job
  where learning_job.id = p_job_id
  for update;

  if v_job.id is null
    or v_job.stage <> 'classify'
    or v_job.status <> 'running'
    or v_job.locked_by <> nullif(btrim(p_worker_id), '') then
    raise exception 'Classification job is not owned by this worker' using errcode = '55000';
  end if;

  if p_existing_topic_id is not null then
    select topic.id
    into v_topic_id
    from public.topics as topic
    where topic.id = p_existing_topic_id
      and topic.user_id = v_job.user_id
    for update;

    if v_topic_id is null then
      raise exception 'Existing topic was not found for this user' using errcode = 'P0002';
    end if;
  else
    if nullif(btrim(p_topic_name), '') is null
      or nullif(btrim(p_normalized_name), '') is null
      or length(btrim(p_topic_name)) > 30 then
      raise exception 'A valid topic name is required' using errcode = '22023';
    end if;

    insert into public.topics (user_id, name, normalized_name)
    values (v_job.user_id, btrim(p_topic_name), btrim(p_normalized_name))
    on conflict (user_id, normalized_name) do update
    set name = public.topics.name
    returning id into v_topic_id;
  end if;

  update public.learning_items
  set topic_id = v_topic_id,
      status = 'sorted',
      sorted_at = now(),
      error = null,
      failure_stage = null
  where id = v_job.item_id
    and user_id = v_job.user_id
    and status = 'fetched';

  if not found then
    raise exception 'Classification item is not in fetched state' using errcode = '55000';
  end if;

  insert into public.learning_jobs (user_id, topic_id, stage)
  values (v_job.user_id, v_topic_id, 'build_topic')
  on conflict do nothing;

  update public.learning_jobs
  set status = 'succeeded',
      locked_at = null,
      locked_by = null,
      last_error = null
  where id = v_job.id;

  return 'sorted'::public.learning_status;
end;
$$;

create or replace function public.complete_topic_build_job(
  p_job_id uuid,
  p_worker_id text,
  p_study_guide jsonb,
  p_briefing jsonb,
  p_quiz jsonb,
  p_source_item_ids uuid[],
  p_model text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.learning_jobs%rowtype;
  v_result jsonb;
begin
  select learning_job.*
  into v_job
  from public.learning_jobs as learning_job
  where learning_job.id = p_job_id
  for update;

  if v_job.id is null
    or v_job.stage <> 'build_topic'
    or v_job.status <> 'running'
    or v_job.locked_by <> nullif(btrim(p_worker_id), '') then
    raise exception 'Topic build job is not owned by this worker' using errcode = '55000';
  end if;

  v_result := public.complete_topic_build(
    v_job.user_id,
    v_job.topic_id,
    p_study_guide,
    p_briefing,
    p_quiz,
    p_source_item_ids,
    p_model
  );

  update public.learning_jobs
  set status = 'succeeded',
      locked_at = null,
      locked_by = null,
      last_error = null
  where id = v_job.id;

  return v_result;
end;
$$;

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
  end if;

  return v_status;
end;
$$;

revoke all on function public.complete_fetch_job(uuid, text, text, text, text, jsonb)
from public, anon, authenticated;
grant execute on function public.complete_fetch_job(uuid, text, text, text, text, jsonb)
to service_role;

revoke all on function public.complete_classify_job(uuid, text, text, text, uuid)
from public, anon, authenticated;
grant execute on function public.complete_classify_job(uuid, text, text, text, uuid)
to service_role;

revoke all on function public.complete_topic_build_job(uuid, text, jsonb, jsonb, jsonb, uuid[], text)
from public, anon, authenticated;
grant execute on function public.complete_topic_build_job(uuid, text, jsonb, jsonb, jsonb, uuid[], text)
to service_role;

revoke all on function public.fail_learning_job(uuid, text, text, boolean, jsonb)
from public, anon, authenticated;
grant execute on function public.fail_learning_job(uuid, text, text, boolean, jsonb)
to service_role;

comment on function public.complete_fetch_job(uuid, text, text, text, text, jsonb)
is 'Atomically stores fetched content, succeeds the owned fetch job, and enqueues classification.';

comment on function public.complete_classify_job(uuid, text, text, text, uuid)
is 'Atomically resolves a user-scoped topic, sorts the fetched item, succeeds the owned job, and enqueues a topic build.';

comment on function public.complete_topic_build_job(uuid, text, jsonb, jsonb, jsonb, uuid[], text)
is 'Atomically replaces current topic artifacts and succeeds the owned topic-build job.';

comment on function public.fail_learning_job(uuid, text, text, boolean, jsonb)
is 'Requeues or terminates an owned running job and preserves the item status semantics for its failed stage.';
