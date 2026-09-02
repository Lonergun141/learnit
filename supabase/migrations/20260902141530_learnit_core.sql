create extension if not exists pgcrypto with schema extensions;

create type public.learning_status as enum (
  'new',
  'fetched',
  'sorted',
  'done',
  'failed'
);

create type public.learning_source as enum (
  'telegram',
  'web',
  'youtube_playlist',
  'manual'
);

create type public.content_type as enum ('youtube', 'article');

create type public.job_stage as enum (
  'fetch',
  'classify',
  'build_topic',
  'capture_playlist',
  'digest'
);

create type public.job_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'dead'
);

create type public.artifact_kind as enum ('study_guide', 'briefing', 'quiz');
create type public.digest_status as enum ('sent', 'skipped', 'failed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 80
  )
);

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  digest_enabled boolean not null default true,
  digest_hour smallint not null default 6,
  timezone text not null default 'UTC',
  youtube_playlist_id text,
  youtube_capture_enabled boolean not null default false,
  youtube_last_polled_at timestamptz,
  daily_item_limit integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_digest_hour_range check (digest_hour between 0 and 23),
  constraint user_settings_daily_item_limit_range check (daily_item_limit between 1 and 100),
  constraint user_settings_playlist_required_when_enabled check (
    not youtube_capture_enabled
    or nullif(btrim(youtube_playlist_id), '') is not null
  )
);

create table public.telegram_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_id bigint not null,
  telegram_username text,
  telegram_first_name text,
  telegram_last_name text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_connections_user_unique unique (user_id),
  constraint telegram_connections_chat_unique unique (chat_id)
);

create table public.telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint telegram_link_tokens_expiry_after_creation check (expires_at > created_at),
  constraint telegram_link_tokens_used_after_creation check (
    used_at is null or used_at >= created_at
  )
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_name_length check (char_length(btrim(name)) between 1 and 30),
  constraint topics_normalized_name_not_blank check (char_length(btrim(normalized_name)) > 0),
  constraint topics_user_normalized_name_unique unique (user_id, normalized_name),
  constraint topics_id_user_unique unique (id, user_id)
);

create table public.learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source public.learning_source not null,
  content_type public.content_type not null,
  url text not null,
  canonical_url text not null,
  title text,
  author text,
  transcript text,
  topic_id uuid,
  status public.learning_status not null default 'new',
  note text,
  error text,
  failure_stage public.job_stage,
  provider_metadata jsonb not null default '{}'::jsonb,
  added_at timestamptz not null default now(),
  fetched_at timestamptz,
  sorted_at timestamptz,
  built_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_items_user_canonical_url_unique unique (user_id, canonical_url),
  constraint learning_items_id_user_unique unique (id, user_id),
  constraint learning_items_url_not_blank check (char_length(btrim(url)) > 0),
  constraint learning_items_canonical_url_not_blank check (char_length(btrim(canonical_url)) > 0),
  constraint learning_items_provider_metadata_object check (
    jsonb_typeof(provider_metadata) = 'object'
  ),
  constraint learning_items_topic_owner_fk
    foreign key (topic_id, user_id)
    references public.topics (id, user_id)
    on delete set null (topic_id)
);

create table public.topic_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null,
  kind public.artifact_kind not null,
  version integer not null,
  is_current boolean not null default true,
  content_markdown text,
  content_json jsonb,
  source_item_ids uuid[] not null default '{}'::uuid[],
  model text,
  created_at timestamptz not null default now(),
  constraint topic_artifacts_version_positive check (version > 0),
  constraint topic_artifacts_content_present check (
    nullif(btrim(content_markdown), '') is not null or content_json is not null
  ),
  constraint topic_artifacts_topic_owner_fk
    foreign key (topic_id, user_id)
    references public.topics (id, user_id)
    on delete cascade
);

create table public.learning_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid,
  topic_id uuid,
  stage public.job_stage not null,
  status public.job_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_jobs_attempts_nonnegative check (attempts >= 0),
  constraint learning_jobs_max_attempts_positive check (max_attempts between 1 and 20),
  constraint learning_jobs_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint learning_jobs_target_required check (
    (stage in ('fetch', 'classify') and item_id is not null and topic_id is null)
    or (stage = 'build_topic' and topic_id is not null and item_id is null)
    or (stage in ('capture_playlist', 'digest') and item_id is null and topic_id is null)
  ),
  constraint learning_jobs_lock_consistency check (
    (status = 'running' and locked_at is not null and nullif(btrim(locked_by), '') is not null)
    or (status <> 'running')
  ),
  constraint learning_jobs_item_owner_fk
    foreign key (item_id, user_id)
    references public.learning_items (id, user_id)
    on delete cascade,
  constraint learning_jobs_topic_owner_fk
    foreign key (topic_id, user_id)
    references public.topics (id, user_id)
    on delete cascade
);

create table public.digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  digest_date date not null,
  status public.digest_status not null,
  telegram_message_id bigint,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint digests_user_date_unique unique (user_id, digest_date),
  constraint digests_sent_timestamp check (status <> 'sent' or sent_at is not null)
);

create index topics_user_id_idx on public.topics (user_id);
create index learning_items_user_id_idx on public.learning_items (user_id);
create index learning_items_user_status_idx on public.learning_items (user_id, status);
create index learning_items_user_topic_idx on public.learning_items (user_id, topic_id);
create index learning_items_user_created_at_idx on public.learning_items (user_id, created_at desc);
create index learning_items_user_built_at_idx on public.learning_items (user_id, built_at desc);
create index topic_artifacts_user_id_idx on public.topic_artifacts (user_id);
create index topic_artifacts_topic_created_idx on public.topic_artifacts (topic_id, created_at desc);
create unique index topic_artifacts_one_current_idx
  on public.topic_artifacts (topic_id, kind)
  where is_current;
create index learning_jobs_status_run_after_idx
  on public.learning_jobs (status, run_after, created_at)
  where status = 'queued';
create index learning_jobs_user_id_idx on public.learning_jobs (user_id);
create index learning_jobs_item_id_idx on public.learning_jobs (item_id) where item_id is not null;
create index learning_jobs_topic_id_idx on public.learning_jobs (topic_id) where topic_id is not null;
create unique index learning_jobs_one_active_item_stage_idx
  on public.learning_jobs (item_id, stage)
  where status in ('queued', 'running') and stage in ('fetch', 'classify');
create unique index learning_jobs_one_active_topic_build_idx
  on public.learning_jobs (topic_id)
  where status in ('queued', 'running') and stage = 'build_topic';
create unique index learning_jobs_one_active_user_maintenance_idx
  on public.learning_jobs (user_id, stage)
  where status in ('queued', 'running') and stage in ('capture_playlist', 'digest');
create index telegram_link_tokens_user_active_idx
  on public.telegram_link_tokens (user_id, expires_at desc)
  where used_at is null;
create index digests_user_id_idx on public.digests (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create trigger telegram_connections_set_updated_at
before update on public.telegram_connections
for each row execute function public.set_updated_at();

create trigger topics_set_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

create trigger learning_items_set_updated_at
before update on public.learning_items
for each row execute function public.set_updated_at();

create trigger learning_jobs_set_updated_at
before update on public.learning_jobs
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_display_name text;
begin
  new_display_name := nullif(
    btrim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', '')),
    ''
  );

  insert into public.profiles (id, display_name)
  values (new.id, left(new_display_name, 80))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.safe_timezone(requested_timezone text)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select timezone_name.name
      from pg_catalog.pg_timezone_names as timezone_name
      where timezone_name.name = nullif(btrim(requested_timezone), '')
      limit 1
    ),
    'UTC'
  );
$$;

create or replace function private.create_learning_item(
  p_user_id uuid,
  p_source public.learning_source,
  p_content_type public.content_type,
  p_url text,
  p_canonical_url text,
  p_note text default null,
  p_provider_metadata jsonb default '{}'::jsonb
)
returns table (item_id uuid, was_created boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item_id uuid;
  v_was_created boolean := false;
begin
  if p_user_id is null then
    raise exception 'A user is required' using errcode = '22023';
  end if;

  if nullif(btrim(p_url), '') is null or nullif(btrim(p_canonical_url), '') is null then
    raise exception 'URL and canonical URL are required' using errcode = '22023';
  end if;

  begin
    insert into public.learning_items (
      user_id,
      source,
      content_type,
      url,
      canonical_url,
      note,
      provider_metadata
    )
    values (
      p_user_id,
      p_source,
      p_content_type,
      p_url,
      p_canonical_url,
      nullif(btrim(p_note), ''),
      coalesce(p_provider_metadata, '{}'::jsonb)
    )
    returning id into v_item_id;

    v_was_created := true;
  exception
    when unique_violation then
      select learning_item.id
      into v_item_id
      from public.learning_items as learning_item
      where learning_item.user_id = p_user_id
        and learning_item.canonical_url = p_canonical_url;
  end;

  if v_item_id is null then
    raise exception 'Unable to create or locate learning item';
  end if;

  if v_was_created then
    insert into public.learning_jobs (user_id, item_id, stage)
    values (p_user_id, v_item_id, 'fetch')
    on conflict do nothing;
  end if;

  return query select v_item_id, v_was_created;
end;
$$;

create or replace function public.create_learning_item_for_current_user(
  p_source public.learning_source,
  p_content_type public.content_type,
  p_url text,
  p_canonical_url text,
  p_note text default null,
  p_provider_metadata jsonb default '{}'::jsonb
)
returns table (item_id uuid, was_created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  select created.item_id, created.was_created
  from private.create_learning_item(
    v_user_id,
    p_source,
    p_content_type,
    p_url,
    p_canonical_url,
    p_note,
    p_provider_metadata
  ) as created;
end;
$$;

create or replace function public.create_learning_item_for_user(
  p_user_id uuid,
  p_source public.learning_source,
  p_content_type public.content_type,
  p_url text,
  p_canonical_url text,
  p_note text default null,
  p_provider_metadata jsonb default '{}'::jsonb
)
returns table (item_id uuid, was_created boolean)
language sql
security definer
set search_path = ''
as $$
  select created.item_id, created.was_created
  from private.create_learning_item(
    p_user_id,
    p_source,
    p_content_type,
    p_url,
    p_canonical_url,
    p_note,
    p_provider_metadata
  ) as created;
$$;

create or replace function public.create_telegram_link_token(
  p_ttl interval default interval '15 minutes'
)
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_token text;
  v_expires_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_ttl <= interval '0 seconds' or p_ttl > interval '1 hour' then
    raise exception 'Token lifetime must be between 1 second and 1 hour' using errcode = '22023';
  end if;

  update public.telegram_link_tokens
  set used_at = now()
  where user_id = v_user_id
    and used_at is null;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_expires_at := now() + p_ttl;

  insert into public.telegram_link_tokens (user_id, token_hash, expires_at)
  values (
    v_user_id,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_expires_at
  );

  return query select v_token, v_expires_at;
end;
$$;

create or replace function public.connect_telegram_with_token(
  p_token text,
  p_chat_id bigint,
  p_telegram_username text default null,
  p_telegram_first_name text default null,
  p_telegram_last_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_id uuid;
  v_user_id uuid;
  v_connected_user_id uuid;
begin
  select link_token.id, link_token.user_id
  into v_token_id, v_user_id
  from public.telegram_link_tokens as link_token
  where link_token.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and link_token.used_at is null
    and link_token.expires_at > now()
  for update;

  if v_token_id is null then
    raise exception 'Link token is invalid or expired' using errcode = '22023';
  end if;

  select connection.user_id
  into v_connected_user_id
  from public.telegram_connections as connection
  where connection.chat_id = p_chat_id
  for update;

  if v_connected_user_id is not null and v_connected_user_id <> v_user_id then
    raise exception 'This Telegram chat is already connected to another account'
      using errcode = '23505';
  end if;

  insert into public.telegram_connections (
    user_id,
    chat_id,
    telegram_username,
    telegram_first_name,
    telegram_last_name
  )
  values (
    v_user_id,
    p_chat_id,
    nullif(btrim(p_telegram_username), ''),
    nullif(btrim(p_telegram_first_name), ''),
    nullif(btrim(p_telegram_last_name), '')
  )
  on conflict (user_id) do update
  set chat_id = excluded.chat_id,
      telegram_username = excluded.telegram_username,
      telegram_first_name = excluded.telegram_first_name,
      telegram_last_name = excluded.telegram_last_name,
      connected_at = now();

  update public.telegram_link_tokens
  set used_at = now()
  where id = v_token_id;

  return v_user_id;
end;
$$;

create or replace function public.claim_learning_jobs(
  p_limit integer,
  p_worker_id text
)
returns setof public.learning_jobs
language sql
security definer
set search_path = ''
as $$
  with candidates as (
    select learning_job.id
    from public.learning_jobs as learning_job
    where learning_job.status = 'queued'
      and learning_job.run_after <= now()
      and learning_job.attempts < learning_job.max_attempts
    order by learning_job.run_after, learning_job.created_at
    for update skip locked
    limit least(greatest(p_limit, 1), 100)
  ), claimed as (
    update public.learning_jobs as learning_job
    set status = 'running',
        locked_at = now(),
        locked_by = left(nullif(btrim(p_worker_id), ''), 200),
        attempts = learning_job.attempts + 1
    from candidates
    where learning_job.id = candidates.id
      and nullif(btrim(p_worker_id), '') is not null
    returning learning_job.*
  )
  select claimed.* from claimed;
$$;

create or replace function public.requeue_stale_jobs(
  p_lock_timeout interval default interval '10 minutes'
)
returns table (requeued_count integer, dead_count integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_lock_timeout < interval '1 minute' then
    raise exception 'Lock timeout must be at least one minute' using errcode = '22023';
  end if;

  update public.learning_jobs as learning_job
  set status = 'queued',
      run_after = now() + make_interval(
        secs => least(900, (30 * power(2, greatest(learning_job.attempts - 1, 0)))::integer)
      ),
      locked_at = null,
      locked_by = null,
      last_error = coalesce(learning_job.last_error, 'Worker lock expired')
  where learning_job.status = 'running'
    and learning_job.locked_at < now() - p_lock_timeout
    and learning_job.attempts < learning_job.max_attempts;
  get diagnostics requeued_count = row_count;

  update public.learning_jobs as learning_job
  set status = 'dead',
      locked_at = null,
      locked_by = null,
      last_error = coalesce(learning_job.last_error, 'Maximum attempts reached after worker lock expired')
  where learning_job.status = 'running'
    and learning_job.locked_at < now() - p_lock_timeout
    and learning_job.attempts >= learning_job.max_attempts;
  get diagnostics dead_count = row_count;

  return next;
end;
$$;

create or replace function public.enqueue_due_maintenance_jobs()
returns table (playlist_jobs_created integer, digest_jobs_created integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  with due_settings as (
    select
      settings.user_id,
      settings.youtube_playlist_id
    from public.user_settings as settings
    where settings.youtube_capture_enabled
      and settings.youtube_playlist_id is not null
      and (
        settings.youtube_last_polled_at is null
        or settings.youtube_last_polled_at <= now() - interval '1 hour'
      )
  ), inserted as (
    insert into public.learning_jobs (user_id, stage, payload)
    select
      due_settings.user_id,
      'capture_playlist',
      jsonb_build_object('playlist_id', due_settings.youtube_playlist_id)
    from due_settings
    on conflict do nothing
    returning 1
  )
  select count(*)::integer into playlist_jobs_created from inserted;

  with due_settings as (
    select
      settings.user_id,
      private.safe_timezone(settings.timezone) as timezone,
      (
        now() at time zone private.safe_timezone(settings.timezone)
      )::date as digest_date
    from public.user_settings as settings
    where settings.digest_enabled
      and extract(
        hour from now() at time zone private.safe_timezone(settings.timezone)
      )::integer >= settings.digest_hour
  ), inserted as (
    insert into public.learning_jobs (user_id, stage, payload)
    select
      due_settings.user_id,
      'digest',
      jsonb_build_object(
        'digest_date', due_settings.digest_date,
        'timezone', due_settings.timezone
      )
    from due_settings
    where not exists (
      select 1
      from public.digests as digest
      where digest.user_id = due_settings.user_id
        and digest.digest_date = due_settings.digest_date
    )
    on conflict do nothing
    returning 1
  )
  select count(*)::integer into digest_jobs_created from inserted;

  return next;
end;
$$;

create or replace function public.retry_learning_item(p_item_id uuid)
returns table (job_id uuid, retry_stage public.job_stage)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_item public.learning_items%rowtype;
  v_job_id uuid;
  v_stage public.job_stage;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select learning_item.*
  into v_item
  from public.learning_items as learning_item
  where learning_item.id = p_item_id
    and learning_item.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Learning item not found' using errcode = 'P0002';
  end if;

  if v_item.failure_stage = 'fetch' and v_item.status = 'failed' then
    v_stage := 'fetch';
    update public.learning_items
    set status = 'new', error = null, failure_stage = null
    where id = v_item.id;
  elsif v_item.failure_stage = 'classify' and v_item.status = 'fetched' then
    v_stage := 'classify';
    update public.learning_items
    set error = null, failure_stage = null
    where id = v_item.id;
  elsif v_item.failure_stage = 'build_topic'
    and v_item.status = 'sorted'
    and v_item.topic_id is not null then
    v_stage := 'build_topic';
    update public.learning_items
    set error = null, failure_stage = null
    where user_id = v_user_id
      and topic_id = v_item.topic_id
      and status = 'sorted';
  else
    raise exception 'Learning item is not in a retryable state' using errcode = '22023';
  end if;

  if v_stage = 'build_topic' then
    insert into public.learning_jobs (user_id, topic_id, stage)
    values (v_user_id, v_item.topic_id, v_stage)
    on conflict do nothing
    returning id into v_job_id;

    if v_job_id is null then
      select learning_job.id
      into v_job_id
      from public.learning_jobs as learning_job
      where learning_job.topic_id = v_item.topic_id
        and learning_job.stage = v_stage
        and learning_job.status in ('queued', 'running')
      order by learning_job.created_at desc
      limit 1;
    end if;
  else
    insert into public.learning_jobs (user_id, item_id, stage)
    values (v_user_id, v_item.id, v_stage)
    on conflict do nothing
    returning id into v_job_id;

    if v_job_id is null then
      select learning_job.id
      into v_job_id
      from public.learning_jobs as learning_job
      where learning_job.item_id = v_item.id
        and learning_job.stage = v_stage
        and learning_job.status in ('queued', 'running')
      order by learning_job.created_at desc
      limit 1;
    end if;
  end if;

  return query select v_job_id, v_stage;
end;
$$;

create or replace function public.complete_topic_build(
  p_user_id uuid,
  p_topic_id uuid,
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
  v_study_guide_id uuid;
  v_briefing_id uuid;
  v_quiz_id uuid;
  v_study_version integer;
  v_briefing_version integer;
  v_quiz_version integer;
  v_source_item_ids uuid[];
begin
  perform 1
  from public.topics as topic
  where topic.id = p_topic_id
    and topic.user_id = p_user_id
  for update;

  if not found then
    raise exception 'Topic not found for user' using errcode = 'P0002';
  end if;

  if nullif(btrim(p_study_guide ->> 'markdown'), '') is null
    or nullif(btrim(p_briefing ->> 'markdown'), '') is null
    or jsonb_typeof(p_quiz -> 'questions') <> 'array' then
    raise exception 'All generated topic artifacts are required' using errcode = '22023';
  end if;

  select coalesce(array_agg(learning_item.id order by learning_item.created_at), '{}'::uuid[])
  into v_source_item_ids
  from public.learning_items as learning_item
  where learning_item.user_id = p_user_id
    and learning_item.topic_id = p_topic_id
    and learning_item.status = 'sorted'
    and (
      coalesce(cardinality(p_source_item_ids), 0) = 0
      or learning_item.id = any(p_source_item_ids)
    );

  if cardinality(v_source_item_ids) = 0 then
    raise exception 'No sorted source items were found for this topic' using errcode = '22023';
  end if;

  select coalesce(max(artifact.version), 0) + 1
  into v_study_version
  from public.topic_artifacts as artifact
  where artifact.topic_id = p_topic_id and artifact.kind = 'study_guide';

  select coalesce(max(artifact.version), 0) + 1
  into v_briefing_version
  from public.topic_artifacts as artifact
  where artifact.topic_id = p_topic_id and artifact.kind = 'briefing';

  select coalesce(max(artifact.version), 0) + 1
  into v_quiz_version
  from public.topic_artifacts as artifact
  where artifact.topic_id = p_topic_id and artifact.kind = 'quiz';

  update public.topic_artifacts
  set is_current = false
  where topic_id = p_topic_id
    and is_current;

  insert into public.topic_artifacts (
    user_id, topic_id, kind, version, content_markdown, content_json,
    source_item_ids, model
  )
  values (
    p_user_id,
    p_topic_id,
    'study_guide',
    v_study_version,
    p_study_guide ->> 'markdown',
    p_study_guide - 'markdown',
    v_source_item_ids,
    nullif(btrim(p_model), '')
  )
  returning id into v_study_guide_id;

  insert into public.topic_artifacts (
    user_id, topic_id, kind, version, content_markdown, content_json,
    source_item_ids, model
  )
  values (
    p_user_id,
    p_topic_id,
    'briefing',
    v_briefing_version,
    p_briefing ->> 'markdown',
    p_briefing - 'markdown',
    v_source_item_ids,
    nullif(btrim(p_model), '')
  )
  returning id into v_briefing_id;

  insert into public.topic_artifacts (
    user_id, topic_id, kind, version, content_json, source_item_ids, model
  )
  values (
    p_user_id,
    p_topic_id,
    'quiz',
    v_quiz_version,
    p_quiz,
    v_source_item_ids,
    nullif(btrim(p_model), '')
  )
  returning id into v_quiz_id;

  update public.learning_items
  set status = 'done',
      built_at = now(),
      error = null,
      failure_stage = null
  where user_id = p_user_id
    and topic_id = p_topic_id
    and id = any(v_source_item_ids);

  return jsonb_build_object(
    'studyGuideId', v_study_guide_id,
    'briefingId', v_briefing_id,
    'quizId', v_quiz_id,
    'sourceItemIds', to_jsonb(v_source_item_ids)
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.telegram_connections enable row level security;
alter table public.telegram_link_tokens enable row level security;
alter table public.topics enable row level security;
alter table public.learning_items enable row level security;
alter table public.topic_artifacts enable row level security;
alter table public.learning_jobs enable row level security;
alter table public.digests enable row level security;

create policy profiles_select_own
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy user_settings_select_own
on public.user_settings for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_settings_update_own
on public.user_settings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy telegram_connections_select_own
on public.telegram_connections for select
to authenticated
using ((select auth.uid()) = user_id);

create policy telegram_connections_delete_own
on public.telegram_connections for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy telegram_link_tokens_select_own
on public.telegram_link_tokens for select
to authenticated
using ((select auth.uid()) = user_id);

create policy topics_select_own
on public.topics for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_items_select_own
on public.learning_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy topic_artifacts_select_own
on public.topic_artifacts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_jobs_select_own
on public.learning_jobs for select
to authenticated
using ((select auth.uid()) = user_id);

create policy digests_select_own
on public.digests for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_settings from anon, authenticated;
revoke all on table public.telegram_connections from anon, authenticated;
revoke all on table public.telegram_link_tokens from anon, authenticated;
revoke all on table public.topics from anon, authenticated;
revoke all on table public.learning_items from anon, authenticated;
revoke all on table public.topic_artifacts from anon, authenticated;
revoke all on table public.learning_jobs from anon, authenticated;
revoke all on table public.digests from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, timezone) on table public.profiles to authenticated;
grant select on table public.user_settings to authenticated;
grant update (
  digest_enabled,
  digest_hour,
  timezone,
  youtube_playlist_id,
  youtube_capture_enabled,
  daily_item_limit
) on table public.user_settings to authenticated;
grant select on table public.telegram_connections to authenticated;
grant delete on table public.telegram_connections to authenticated;
grant select (
  id,
  user_id,
  expires_at,
  used_at,
  created_at
) on table public.telegram_link_tokens to authenticated;
grant select on table public.topics to authenticated;
grant select on table public.learning_items to authenticated;
grant select on table public.topic_artifacts to authenticated;
grant select on table public.learning_jobs to authenticated;
grant select on table public.digests to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.user_settings to service_role;
grant all on table public.telegram_connections to service_role;
grant all on table public.telegram_link_tokens to service_role;
grant all on table public.topics to service_role;
grant all on table public.learning_items to service_role;
grant all on table public.topic_artifacts to service_role;
grant all on table public.learning_jobs to service_role;
grant all on table public.digests to service_role;

grant usage on type public.learning_status to authenticated, service_role;
grant usage on type public.learning_source to authenticated, service_role;
grant usage on type public.content_type to authenticated, service_role;
grant usage on type public.job_stage to authenticated, service_role;
grant usage on type public.job_status to authenticated, service_role;
grant usage on type public.artifact_kind to authenticated, service_role;
grant usage on type public.digest_status to authenticated, service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function private.safe_timezone(text) from public, anon, authenticated;
revoke all on function private.create_learning_item(
  uuid,
  public.learning_source,
  public.content_type,
  text,
  text,
  text,
  jsonb
) from public, anon, authenticated;

revoke all on function public.create_learning_item_for_current_user(
  public.learning_source,
  public.content_type,
  text,
  text,
  text,
  jsonb
) from public, anon, authenticated;
grant execute on function public.create_learning_item_for_current_user(
  public.learning_source,
  public.content_type,
  text,
  text,
  text,
  jsonb
) to authenticated;

revoke all on function public.create_learning_item_for_user(
  uuid,
  public.learning_source,
  public.content_type,
  text,
  text,
  text,
  jsonb
) from public, anon, authenticated;
grant execute on function public.create_learning_item_for_user(
  uuid,
  public.learning_source,
  public.content_type,
  text,
  text,
  text,
  jsonb
) to service_role;

revoke all on function public.create_telegram_link_token(interval)
from public, anon, authenticated;
grant execute on function public.create_telegram_link_token(interval)
to authenticated;

revoke all on function public.connect_telegram_with_token(
  text,
  bigint,
  text,
  text,
  text
) from public, anon, authenticated;
grant execute on function public.connect_telegram_with_token(
  text,
  bigint,
  text,
  text,
  text
) to service_role;

revoke all on function public.claim_learning_jobs(integer, text)
from public, anon, authenticated;
grant execute on function public.claim_learning_jobs(integer, text)
to service_role;

revoke all on function public.requeue_stale_jobs(interval)
from public, anon, authenticated;
grant execute on function public.requeue_stale_jobs(interval)
to service_role;

revoke all on function public.enqueue_due_maintenance_jobs()
from public, anon, authenticated;
grant execute on function public.enqueue_due_maintenance_jobs()
to service_role;

revoke all on function public.retry_learning_item(uuid)
from public, anon, authenticated;
grant execute on function public.retry_learning_item(uuid)
to authenticated;

revoke all on function public.complete_topic_build(
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  uuid[],
  text
) from public, anon, authenticated;
grant execute on function public.complete_topic_build(
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  uuid[],
  text
) to service_role;

comment on function public.create_learning_item_for_current_user(
  public.learning_source,
  public.content_type,
  text,
  text,
  text,
  jsonb
) is 'Creates a user-owned item and its fetch job atomically, returning an existing item on duplicate canonical URL.';

comment on function public.claim_learning_jobs(integer, text)
is 'Claims due jobs with FOR UPDATE SKIP LOCKED for concurrent workers.';

comment on table public.telegram_link_tokens
is 'Stores SHA-256 hashes only. Plaintext Telegram linking tokens are returned once by an authenticated RPC.';
