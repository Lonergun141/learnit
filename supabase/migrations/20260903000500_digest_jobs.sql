create or replace function public.get_digest_context(
  p_job_id uuid,
  p_worker_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.learning_jobs%rowtype;
  v_digest_date date;
  v_timezone text;
  v_day_start timestamptz;
  v_day_end timestamptz;
  v_chat_id bigint;
  v_items jsonb;
  v_failed_count integer;
begin
  select learning_job.*
  into v_job
  from public.learning_jobs as learning_job
  where learning_job.id = p_job_id
  for update;

  if v_job.id is null
    or v_job.stage <> 'digest'
    or v_job.status <> 'running'
    or v_job.locked_by <> nullif(btrim(p_worker_id), '') then
    raise exception 'Digest job is not owned by this worker' using errcode = '55000';
  end if;

  begin
    v_digest_date := (v_job.payload ->> 'digest_date')::date;
  exception when others then
    raise exception 'Digest job date is invalid' using errcode = '22023';
  end;

  select private.safe_timezone(
    coalesce(nullif(v_job.payload ->> 'timezone', ''), settings.timezone)
  )
  into v_timezone
  from public.user_settings as settings
  where settings.user_id = v_job.user_id;

  if v_timezone is null then
    raise exception 'Digest settings were not found' using errcode = 'P0002';
  end if;

  v_day_start := v_digest_date::timestamp at time zone v_timezone;
  v_day_end := (v_digest_date + 1)::timestamp at time zone v_timezone;

  select connection.chat_id
  into v_chat_id
  from public.telegram_connections as connection
  where connection.user_id = v_job.user_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'topicId', learning_item.topic_id,
        'topicName', topic.name,
        'title', learning_item.title
      )
      order by topic.name, learning_item.built_at, learning_item.id
    ),
    '[]'::jsonb
  )
  into v_items
  from public.learning_items as learning_item
  join public.topics as topic
    on topic.id = learning_item.topic_id
   and topic.user_id = learning_item.user_id
  where learning_item.user_id = v_job.user_id
    and learning_item.status = 'done'
    and learning_item.built_at >= v_day_start
    and learning_item.built_at < v_day_end;

  select count(*)::integer
  into v_failed_count
  from public.learning_items as learning_item
  where learning_item.user_id = v_job.user_id
    and learning_item.failure_stage is not null;

  return jsonb_build_object(
    'digestDate', v_digest_date,
    'timezone', v_timezone,
    'chatId', v_chat_id,
    'items', v_items,
    'failedCount', v_failed_count
  );
end;
$$;

create or replace function public.complete_digest_job(
  p_job_id uuid,
  p_worker_id text,
  p_digest_date date,
  p_status public.digest_status,
  p_telegram_message_id bigint default null
)
returns public.job_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.learning_jobs%rowtype;
  v_expected_date date;
begin
  select learning_job.*
  into v_job
  from public.learning_jobs as learning_job
  where learning_job.id = p_job_id
  for update;

  if v_job.id is null
    or v_job.stage <> 'digest'
    or v_job.status <> 'running'
    or v_job.locked_by <> nullif(btrim(p_worker_id), '') then
    raise exception 'Digest job is not owned by this worker' using errcode = '55000';
  end if;

  begin
    v_expected_date := (v_job.payload ->> 'digest_date')::date;
  exception when others then
    raise exception 'Digest job date is invalid' using errcode = '22023';
  end;

  if p_digest_date is distinct from v_expected_date then
    raise exception 'Digest date does not match the job' using errcode = '22023';
  end if;

  if p_status = 'failed' then
    raise exception 'Successful completion accepts only sent or skipped' using errcode = '22023';
  end if;

  insert into public.digests (
    user_id,
    digest_date,
    status,
    telegram_message_id,
    sent_at
  )
  values (
    v_job.user_id,
    p_digest_date,
    p_status,
    p_telegram_message_id,
    case when p_status = 'sent' then now() else null end
  )
  on conflict (user_id, digest_date) do update
  set status = excluded.status,
      telegram_message_id = excluded.telegram_message_id,
      error = null,
      sent_at = excluded.sent_at;

  update public.learning_jobs
  set status = 'succeeded',
      locked_at = null,
      locked_by = null,
      last_error = null
  where id = v_job.id;

  return 'succeeded'::public.job_status;
end;
$$;

revoke all on function public.get_digest_context(uuid, text)
from public, anon, authenticated;
grant execute on function public.get_digest_context(uuid, text)
to service_role;

revoke all on function public.complete_digest_job(uuid, text, date, public.digest_status, bigint)
from public, anon, authenticated;
grant execute on function public.complete_digest_job(uuid, text, date, public.digest_status, bigint)
to service_role;

comment on function public.get_digest_context(uuid, text)
is 'Returns an owned digest job context bounded to the user local calendar day.';

comment on function public.complete_digest_job(uuid, text, date, public.digest_status, bigint)
is 'Atomically records a sent or skipped digest and succeeds its owned worker job.';
