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
  v_limit integer;
  v_timezone text;
  v_local_date date;
  v_day_start timestamptz;
  v_day_end timestamptz;
  v_item_count integer;
begin
  if p_user_id is null then
    raise exception 'A user is required' using errcode = '22023';
  end if;

  if nullif(btrim(p_url), '') is null or nullif(btrim(p_canonical_url), '') is null then
    raise exception 'URL and canonical URL are required' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_provider_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'Provider metadata must be an object' using errcode = '22023';
  end if;

  select settings.daily_item_limit, private.safe_timezone(settings.timezone)
  into v_limit, v_timezone
  from public.user_settings as settings
  where settings.user_id = p_user_id
  for update;

  if v_limit is null then
    raise exception 'User settings were not found' using errcode = 'P0002';
  end if;

  select learning_item.id
  into v_item_id
  from public.learning_items as learning_item
  where learning_item.user_id = p_user_id
    and learning_item.canonical_url = p_canonical_url;

  if v_item_id is not null then
    return query select v_item_id, false;
    return;
  end if;

  v_local_date := (now() at time zone v_timezone)::date;
  v_day_start := v_local_date::timestamp at time zone v_timezone;
  v_day_end := (v_local_date + 1)::timestamp at time zone v_timezone;

  select count(*)::integer
  into v_item_count
  from public.learning_items as learning_item
  where learning_item.user_id = p_user_id
    and learning_item.added_at >= v_day_start
    and learning_item.added_at < v_day_end;

  if v_item_count >= v_limit then
    raise exception 'Daily learning item limit reached' using errcode = 'P0001';
  end if;

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

  insert into public.learning_jobs (user_id, item_id, stage)
  values (p_user_id, v_item_id, 'fetch')
  on conflict do nothing;

  return query select v_item_id, true;
end;
$$;

comment on function private.create_learning_item(
  uuid,
  public.learning_source,
  public.content_type,
  text,
  text,
  text,
  jsonb
)
is 'Serializes captures per user, resolves duplicates, enforces the user-local daily limit, and enqueues fetch work.';
