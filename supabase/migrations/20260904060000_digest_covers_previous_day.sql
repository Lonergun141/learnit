-- The daily digest reported the day it was sent on, not the day that had just
-- ended, so almost nothing ever reached it.
--
-- A digest is enqueued once the local clock passes `digest_hour` — 06:00 by
-- default — and `get_digest_context` then gathered items built between 00:00 and
-- 24:00 of that same date. At 06:00 only the six hours since midnight had
-- happened, so a digest could only ever report what was captured overnight.
-- Everything saved during the previous day's waking hours belonged to a window
-- whose digest had already been sent that morning, and `digests` is unique per
-- (user, digest_date), so that day never ran again. Items captured in the
-- evening were therefore reported by no digest at all.
--
-- The window now covers the local day *before* the digest date. A digest issued
-- on the 4th reports the 4th, and successive windows tile with no gap and no
-- overlap: everything built on a given local day is reported by exactly one
-- digest, the following morning.
--
-- `digest_date` keeps its meaning as the date the digest was issued, which is
-- what makes it the right daily dedupe key. Only the reporting window moves.

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

  -- The local day that just ended, not the one the digest is issued on.
  v_day_start := (v_digest_date - 1)::timestamp at time zone v_timezone;
  v_day_end := v_digest_date::timestamp at time zone v_timezone;

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

comment on function public.get_digest_context(uuid, text)
is 'Returns an owned digest job context covering the local day before the digest date — the day that had ended when the digest was issued.';
