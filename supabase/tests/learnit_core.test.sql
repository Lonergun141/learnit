begin;

select plan(88);

select ok(
  exists (
    select 1
    from pg_catalog.pg_extension
    where extname = 'pg_cron'
  ),
  'pg_cron is enabled for recurring jobs'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_extension
    where extname = 'pg_net'
  ),
  'pg_net is enabled for Edge Function invocation'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_proc as routine
    join pg_catalog.pg_namespace as namespace on namespace.oid = routine.pronamespace
    where namespace.nspname = 'public'
      and routine.proname = 'invoke_process_learning_jobs'
  ),
  'the vault-backed worker invocation function exists'
);

select is(
  (
    select job.schedule
    from cron.job as job
    where job.jobname = 'process-learning-jobs'
      and job.active
  ),
  '* * * * *',
  'the worker is invoked every minute'
);

select is(
  (
    select job.schedule
    from cron.job as job
    where job.jobname = 'enqueue-due-maintenance-jobs'
      and job.active
  ),
  '0 * * * *',
  'due maintenance jobs are enqueued hourly'
);

select ok(
  (
    select job.command like '%invoke_process_learning_jobs%'
    from cron.job as job
    where job.jobname = 'process-learning-jobs'
  ),
  'the worker schedule delegates to the vault-backed function instead of inlining a secret'
);

select is(
  public.invoke_process_learning_jobs(),
  null::bigint,
  'worker invocation is a no-op when the vault secrets are absent'
);

select isnt(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.invoke_process_learning_jobs()',
    'EXECUTE'
  ),
  true,
  'authenticated users cannot trigger the worker invocation function'
);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'user_settings', 'user_settings table exists');
select has_table('public', 'telegram_connections', 'telegram_connections table exists');
select has_table('public', 'telegram_link_tokens', 'telegram_link_tokens table exists');
select has_table('public', 'topics', 'topics table exists');
select has_table('public', 'learning_items', 'learning_items table exists');
select has_table('public', 'topic_artifacts', 'topic_artifacts table exists');
select has_table('public', 'learning_jobs', 'learning_jobs table exists');
select has_table('public', 'digests', 'digests table exists');
select has_table('public', 'quiz_attempts', 'quiz_attempts table exists');

select is(
  (
    select count(*)
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = any(array[
        'profiles',
        'user_settings',
        'telegram_connections',
        'telegram_link_tokens',
        'topics',
        'learning_items',
        'topic_artifacts',
        'learning_jobs',
        'digests',
        'quiz_attempts'
      ])
      and relation.relrowsecurity
  ),
  10::bigint,
  'RLS is enabled on every user-owned table'
);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'alice@example.test',
    extensions.crypt('not-a-real-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Alice"}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'bob@example.test',
    extensions.crypt('not-a-real-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Bob"}'::jsonb,
    now(),
    now()
  );

select is(
  (select count(*) from public.profiles),
  2::bigint,
  'auth user creation bootstraps profiles'
);

select is(
  (select count(*) from public.user_settings),
  2::bigint,
  'auth user creation bootstraps settings'
);

select is(
  (
    select distinct settings.timezone
    from public.user_settings as settings
  ),
  'Asia/Manila',
  'a bootstrapped account defaults to the Asia/Manila timezone'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select ok(
  (
    select was_created
    from public.create_learning_item_for_current_user(
      'web',
      'article',
      'https://example.test/learn?utm_source=test',
      'https://example.test/learn',
      'first item'
    )
  ),
  'current-user RPC creates a new item'
);

select is(
  (select count(*) from public.learning_jobs where stage = 'fetch'),
  1::bigint,
  'new item atomically enqueues one fetch job'
);

select isnt(
  (
    select was_created
    from public.create_learning_item_for_current_user(
      'web',
      'article',
      'https://example.test/learn?ref=duplicate',
      'https://example.test/learn',
      'duplicate'
    )
  ),
  true,
  'duplicate canonical URL returns the existing item'
);

select is(
  (select count(*) from public.learning_items),
  1::bigint,
  'duplicate capture does not create another row'
);

reset role;

select isnt(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.claim_learning_jobs(integer,text)',
    'EXECUTE'
  ),
  true,
  'authenticated users cannot execute the worker claim RPC'
);

set local role service_role;

select ok(
  (
    select was_created
    from public.create_learning_item_for_user(
      '22222222-2222-4222-8222-222222222222',
      'telegram',
      'youtube',
      'https://www.youtube.com/watch?v=abcdefghijk',
      'https://www.youtube.com/watch?v=abcdefghijk',
      'Bob item'
    )
  ),
  'service RPC creates an item for the specified user'
);

reset role;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
set local role authenticated;

select is(
  (
    select count(*)
    from public.learning_items
    where canonical_url = 'https://example.test/learn'
  ),
  0::bigint,
  'Bob cannot read Alice learning items'
);

reset role;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;

select is(
  (
    select count(*)
    from public.learning_items
    where canonical_url = 'https://www.youtube.com/watch?v=abcdefghijk'
  ),
  0::bigint,
  'Alice cannot read Bob learning items'
);

select set_config(
  'learnit.test_link_token',
  (select token from public.create_telegram_link_token()),
  true
);

reset role;

select isnt(
  (select token_hash from public.telegram_link_tokens where user_id = '11111111-1111-4111-8111-111111111111'),
  current_setting('learnit.test_link_token'),
  'Telegram linking token is not stored as plaintext'
);

set local role service_role;

select is(
  public.connect_telegram_with_token(
    current_setting('learnit.test_link_token'),
    100001,
    'alice_test',
    'Alice',
    'Learner'
  ),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'service RPC atomically connects a valid Telegram token'
);

reset role;

select is(
  (
    select count(*)
    from public.telegram_connections
    where user_id = '11111111-1111-4111-8111-111111111111'
      and chat_id = 100001
  ),
  1::bigint,
  'Telegram connection is stored for the token owner'
);

insert into public.topics (id, user_id, name, normalized_name)
values (
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  'PostgreSQL',
  'postgresql'
);

update public.learning_items
set topic_id = '33333333-3333-4333-8333-333333333333',
    status = 'sorted',
    sorted_at = now()
where user_id = '11111111-1111-4111-8111-111111111111';

set local role service_role;

select is(
  jsonb_typeof(
    public.complete_topic_build(
      '11111111-1111-4111-8111-111111111111',
      '33333333-3333-4333-8333-333333333333',
      '{"title":"Guide","markdown":"This is a complete study guide body."}'::jsonb,
      '{"title":"Briefing","markdown":"This is a complete briefing document."}'::jsonb,
      '{"title":"Quiz","questions":[{"id":"q1"}]}'::jsonb,
      '{}'::uuid[],
      'test-model'
    )
  ),
  'object',
  'topic build completion returns artifact identifiers'
);

reset role;

select is(
  (select count(*) from public.topic_artifacts where is_current),
  3::bigint,
  'first topic build creates three current artifacts'
);

update public.learning_items
set status = 'sorted', built_at = null
where user_id = '11111111-1111-4111-8111-111111111111';

set local role service_role;

select is(
  jsonb_typeof(
    public.complete_topic_build(
      '11111111-1111-4111-8111-111111111111',
      '33333333-3333-4333-8333-333333333333',
      '{"title":"Guide v2","markdown":"This is the second complete study guide body."}'::jsonb,
      '{"title":"Briefing v2","markdown":"This is the second complete briefing document."}'::jsonb,
      '{"title":"Quiz v2","questions":[{"id":"q2"}]}'::jsonb,
      '{}'::uuid[],
      'test-model'
    )
  ),
  'object',
  'a later topic build completes atomically'
);

reset role;

select is(
  (select count(*) from public.topic_artifacts),
  6::bigint,
  'artifact history is preserved across builds'
);

select is(
  (select count(*) from public.topic_artifacts where is_current),
  3::bigint,
  'only three artifacts remain current after rebuilding'
);

select is(
  (select count(*) from public.topic_artifacts where version = 2),
  3::bigint,
  'each second-generation artifact has version two'
);

select ok(
  to_regprocedure('public.complete_fetch_job(uuid,text,text,text,text,jsonb)') is not null,
  'fetch completion RPC exists'
);

select ok(
  to_regprocedure('public.complete_classify_job(uuid,text,text,text,uuid)') is not null,
  'classification completion RPC exists'
);

select ok(
  to_regprocedure('public.complete_topic_build_job(uuid,text,jsonb,jsonb,jsonb,uuid[],text)') is not null,
  'topic-build job completion RPC exists'
);

select ok(
  to_regprocedure('public.fail_learning_job(uuid,text,text,boolean,jsonb)') is not null,
  'job failure RPC exists'
);

set local role service_role;

select set_config(
  'learnit.test_fetch_job_id',
  (
    select claimed.id::text
    from public.claim_learning_jobs(10, 'worker-test') as claimed
    where claimed.user_id = '22222222-2222-4222-8222-222222222222'
      and claimed.stage = 'fetch'
    limit 1
  ),
  true
);

select is(
  public.complete_fetch_job(
    current_setting('learnit.test_fetch_job_id')::uuid,
    'worker-test',
    'Bob video',
    'Bob Channel',
    repeat('transcript ', 80),
    '{"provider":"test"}'::jsonb
  ),
  'fetched'::public.learning_status,
  'fetch completion advances the item atomically'
);

select is(
  (
    select count(*)
    from public.learning_jobs
    where user_id = '22222222-2222-4222-8222-222222222222'
      and stage = 'classify'
      and status = 'queued'
  ),
  1::bigint,
  'fetch completion enqueues classification'
);

select set_config(
  'learnit.test_classify_job_id',
  (
    select claimed.id::text
    from public.claim_learning_jobs(10, 'worker-test') as claimed
    where claimed.user_id = '22222222-2222-4222-8222-222222222222'
      and claimed.stage = 'classify'
    limit 1
  ),
  true
);

select is(
  public.complete_classify_job(
    current_setting('learnit.test_classify_job_id')::uuid,
    'worker-test',
    'Databases',
    'database',
    null
  ),
  'sorted'::public.learning_status,
  'classification completion creates a topic and sorts the item'
);

select is(
  (
    select count(*)
    from public.learning_jobs
    where user_id = '22222222-2222-4222-8222-222222222222'
      and stage = 'build_topic'
      and status = 'queued'
  ),
  1::bigint,
  'classification completion enqueues one topic build'
);

select set_config(
  'learnit.test_build_job_id',
  (
    select claimed.id::text
    from public.claim_learning_jobs(10, 'worker-test') as claimed
    where claimed.user_id = '22222222-2222-4222-8222-222222222222'
      and claimed.stage = 'build_topic'
    limit 1
  ),
  true
);

select is(
  jsonb_typeof(
    public.complete_topic_build_job(
      current_setting('learnit.test_build_job_id')::uuid,
      'worker-test',
      '{"title":"Guide","markdown":"This is a complete study guide body."}'::jsonb,
      '{"title":"Briefing","markdown":"This is a complete briefing document."}'::jsonb,
      '{"title":"Quiz","questions":[{"id":"q1"}]}'::jsonb,
      '{}'::uuid[],
      'test-model'
    )
  ),
  'object',
  'topic build artifacts and job completion commit together'
);

select ok(
  (
    select was_created
    from public.create_learning_item_for_user(
      '22222222-2222-4222-8222-222222222222',
      'telegram',
      'article',
      'https://example.test/failure',
      'https://example.test/failure',
      null
    )
  ),
  'failure fixture item is created'
);

select set_config(
  'learnit.test_failure_job_id',
  (
    select claimed.id::text
    from public.claim_learning_jobs(10, 'worker-failure') as claimed
    where claimed.user_id = '22222222-2222-4222-8222-222222222222'
      and claimed.stage = 'fetch'
    limit 1
  ),
  true
);

select is(
  public.fail_learning_job(
    current_setting('learnit.test_failure_job_id')::uuid,
    'worker-failure',
    'Temporary provider failure',
    true,
    '{"provider_job_id":"pending-1"}'::jsonb
  ),
  'queued'::public.job_status,
  'retryable job failure is requeued with payload state'
);

update public.learning_jobs
set run_after = now()
where id = current_setting('learnit.test_failure_job_id')::uuid;

select set_config(
  'learnit.test_failure_job_id',
  (
    select claimed.id::text
    from public.claim_learning_jobs(10, 'worker-failure-2') as claimed
    where claimed.user_id = '22222222-2222-4222-8222-222222222222'
      and claimed.stage = 'fetch'
    limit 1
  ),
  true
);

select is(
  public.fail_learning_job(
    current_setting('learnit.test_failure_job_id')::uuid,
    'worker-failure-2',
    'Permanent provider failure',
    false,
    '{}'::jsonb
  ),
  'failed'::public.job_status,
  'permanent fetch failure terminates the job and marks the item failed'
);

select ok(
  to_regprocedure('public.complete_maintenance_job(uuid,text,boolean)') is not null,
  'maintenance completion RPC exists'
);

update public.user_settings
set youtube_capture_enabled = true,
    youtube_playlist_id = 'PL123',
    youtube_last_polled_at = null
where user_id = '22222222-2222-4222-8222-222222222222';

select enqueue_due_maintenance_jobs();

select set_config(
  'learnit.test_maintenance_job_id',
  (
    select claimed.id::text
    from public.claim_learning_jobs(10, 'worker-maintenance') as claimed
    where claimed.user_id = '22222222-2222-4222-8222-222222222222'
      and claimed.stage = 'capture_playlist'
    limit 1
  ),
  true
);

select is(
  public.complete_maintenance_job(
    current_setting('learnit.test_maintenance_job_id')::uuid,
    'worker-maintenance',
    true
  ),
  'succeeded'::public.job_status,
  'maintenance completion succeeds the owned job'
);

select isnt(
  (
    select youtube_last_polled_at
    from public.user_settings
    where user_id = '22222222-2222-4222-8222-222222222222'
  ),
  null::timestamptz,
  'playlist maintenance records its poll time'
);

select ok(
  to_regprocedure('public.get_digest_context(uuid,text)') is not null,
  'digest context RPC exists'
);

select ok(
  to_regprocedure('public.complete_digest_job(uuid,text,date,public.digest_status,bigint)') is not null,
  'digest completion RPC exists'
);

select set_config(
  'learnit.test_digest_job_id',
  (
    select id::text
    from public.learning_jobs
    where user_id = '22222222-2222-4222-8222-222222222222'
      and stage = 'digest'
      and status = 'running'
      and locked_by = 'worker-maintenance'
    limit 1
  ),
  true
);

-- A digest is issued in the morning and reports the local day that just ended,
-- so the fixture built "now" belongs to the digest's own date and must be left
-- out; the same item dated a day earlier must be picked up. Anything else means
-- an evening capture is reported by no digest at all.
select is(
  jsonb_array_length(
    public.get_digest_context(
      current_setting('learnit.test_digest_job_id')::uuid,
      'worker-maintenance'
    ) -> 'items'
  ),
  0,
  'digest context leaves out items built on the digest date itself'
);

update public.learning_items
set built_at = built_at - interval '1 day'
where user_id = '22222222-2222-4222-8222-222222222222'
  and status = 'done';

select is(
  jsonb_array_length(
    public.get_digest_context(
      current_setting('learnit.test_digest_job_id')::uuid,
      'worker-maintenance'
    ) -> 'items'
  ),
  1,
  'digest context reports the items built on the local day that just ended'
);

select is(
  (
    public.get_digest_context(
      current_setting('learnit.test_digest_job_id')::uuid,
      'worker-maintenance'
    ) ->> 'failedCount'
  )::integer,
  1,
  'digest context reports the user needs-attention count'
);

select is(
  public.complete_digest_job(
    current_setting('learnit.test_digest_job_id')::uuid,
    'worker-maintenance',
    (
      public.get_digest_context(
        current_setting('learnit.test_digest_job_id')::uuid,
        'worker-maintenance'
      ) ->> 'digestDate'
    )::date,
    'skipped',
    null
  ),
  'succeeded'::public.job_status,
  'digest completion records the outcome and succeeds the owned job'
);

select is(
  (
    select count(*)
    from public.digests
    where user_id = '22222222-2222-4222-8222-222222222222'
  ),
  1::bigint,
  'one digest record prevents same-day maintenance re-enqueueing'
);

delete from public.learning_jobs
where user_id = '11111111-1111-4111-8111-111111111111'
  and stage = 'digest';

delete from public.digests
where user_id = '11111111-1111-4111-8111-111111111111';

update public.user_settings
set digest_enabled = true,
    digest_hour = 0
where user_id = '11111111-1111-4111-8111-111111111111';

select public.enqueue_due_maintenance_jobs();

select set_config(
  'learnit.test_failed_digest_job_id',
  (
    select claimed.id::text
    from public.claim_learning_jobs(10, 'worker-digest-failure') as claimed
    where claimed.user_id = '11111111-1111-4111-8111-111111111111'
      and claimed.stage = 'digest'
    limit 1
  ),
  true
);

select is(
  public.fail_learning_job(
    current_setting('learnit.test_failed_digest_job_id')::uuid,
    'worker-digest-failure',
    'Telegram delivery failed',
    false,
    '{}'::jsonb
  ),
  'failed'::public.job_status,
  'a permanent digest failure terminates the owned job'
);

select is(
  (
    select digest.status
    from public.digests as digest
    where digest.user_id = '11111111-1111-4111-8111-111111111111'
  ),
  'failed'::public.digest_status,
  'a terminal digest failure records a failed digest for that local day'
);

select is(
  (
    select digest.error
    from public.digests as digest
    where digest.user_id = '11111111-1111-4111-8111-111111111111'
  ),
  'Telegram delivery failed',
  'the recorded digest failure preserves the worker error'
);

select is(
  (select digest_jobs_created from public.enqueue_due_maintenance_jobs()),
  0,
  'a failed digest is not re-enqueued during the same local day'
);

-- Away from the account default, so the mirror has something to carry.
update public.user_settings
set timezone = 'Europe/London'
where user_id = '11111111-1111-4111-8111-111111111111';

select is(
  (
    select profile.timezone
    from public.profiles as profile
    where profile.id = '11111111-1111-4111-8111-111111111111'
  ),
  'Europe/London',
  'changing the settings timezone mirrors onto the profile in the same write'
);

update public.user_settings
set daily_item_limit = 7
where user_id = '11111111-1111-4111-8111-111111111111';

select is(
  (
    select profile.timezone
    from public.profiles as profile
    where profile.id = '11111111-1111-4111-8111-111111111111'
  ),
  'Europe/London',
  'an unrelated settings change leaves the mirrored timezone alone'
);

update public.user_settings
set daily_item_limit = 1
where user_id = '11111111-1111-4111-8111-111111111111';

reset role;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;

select throws_ok(
  $$
    select *
    from public.create_learning_item_for_current_user(
      'web',
      'article',
      'https://example.test/over-limit',
      'https://example.test/over-limit',
      null
    )
  $$,
  'P0001',
  'Daily learning item limit reached',
  'daily capture limits are enforced atomically per user'
);

select isnt(
  (
    select was_created
    from public.create_learning_item_for_current_user(
      'web',
      'article',
      'https://example.test/learn?duplicate=at-limit',
      'https://example.test/learn',
      null
    )
  ),
  true,
  'an existing duplicate can still be resolved at the daily limit'
);

select ok(
  to_regprocedure('public.enqueue_playlist_sync_for_current_user()') is not null,
  'authenticated playlist sync RPC exists'
);

reset role;
update public.user_settings
set youtube_capture_enabled = true,
    youtube_playlist_id = 'PL123456789'
where user_id = '11111111-1111-4111-8111-111111111111';
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;

select isnt(
  public.enqueue_playlist_sync_for_current_user(),
  null::uuid,
  'an authenticated user can enqueue their configured playlist sync'
);

select public.enqueue_playlist_sync_for_current_user();

select is(
  (
    select count(*)
    from public.learning_jobs
    where user_id = '11111111-1111-4111-8111-111111111111'
      and stage = 'capture_playlist'
      and status in ('queued', 'running')
  ),
  1::bigint,
  'repeated playlist sync requests cannot create duplicate active jobs'
);

reset role;

-- Quiz attempts. A finished run is recorded against the artifact that was
-- answered, so a rebuilt quiz starts a fresh history, and retaking adds a row
-- rather than overwriting the previous score.

select set_config(
  'test.quiz_artifact_id',
  (
    select artifact.id::text
    from public.topic_artifacts as artifact
    where artifact.user_id = '11111111-1111-4111-8111-111111111111'
      and artifact.kind = 'quiz'
      and artifact.is_current
  ),
  true
);

select set_config(
  'test.guide_artifact_id',
  (
    select artifact.id::text
    from public.topic_artifacts as artifact
    where artifact.user_id = '11111111-1111-4111-8111-111111111111'
      and artifact.kind = 'study_guide'
      and artifact.is_current
  ),
  true
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;

select isnt(
  public.record_quiz_attempt(current_setting('test.quiz_artifact_id')::uuid, 7, 8),
  null::uuid,
  'an authenticated user can record a completed quiz run'
);

select public.record_quiz_attempt(current_setting('test.quiz_artifact_id')::uuid, 5, 8);

select is(
  (
    select count(*)
    from public.quiz_attempts
    where user_id = '11111111-1111-4111-8111-111111111111'
  ),
  2::bigint,
  'retaking a quiz records another attempt instead of replacing the last score'
);

select is(
  (
    select distinct topic_id
    from public.quiz_attempts
    where user_id = '11111111-1111-4111-8111-111111111111'
  ),
  '33333333-3333-4333-8333-333333333333'::uuid,
  'an attempt takes its topic from the artifact rather than from the caller'
);

select throws_ok(
  $$select public.record_quiz_attempt(
      current_setting('test.quiz_artifact_id')::uuid,
      9,
      8
    )$$,
  '22023',
  'Quiz score must fall within the number of questions',
  'a score larger than the quiz itself is refused'
);

select throws_ok(
  $$select public.record_quiz_attempt(
      current_setting('test.guide_artifact_id')::uuid,
      4,
      8
    )$$,
  'P0002',
  'Quiz not found',
  'an artifact that is not a quiz cannot take an attempt'
);

reset role;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
set local role authenticated;

select throws_ok(
  $$select public.record_quiz_attempt(
      current_setting('test.quiz_artifact_id')::uuid,
      8,
      8
    )$$,
  'P0002',
  'Quiz not found',
  'an account cannot record a score against a quiz it does not own'
);

select is(
  (select count(*) from public.quiz_attempts),
  0::bigint,
  'quiz attempts are invisible to another account'
);

reset role;

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;

select is(
  (select count(*) from public.quiz_attempts),
  2::bigint,
  'an account reads back its own quiz attempts'
);

reset role;

-- Ready-to-study replies. The worker asks for the chat, the toggle state, and
-- the message ids to thread under. Items that did not arrive from Telegram have
-- no message to reply to and must not appear, which is what stops a playlist
-- pull from producing a reply per video.

select ok(
  to_regprocedure('public.get_telegram_notice_context(uuid,uuid[])') is not null,
  'telegram notice context RPC exists'
);

select is(
  (
    select settings.ready_replies_enabled
    from public.user_settings as settings
    where settings.user_id = '22222222-2222-4222-8222-222222222222'
  ),
  true,
  'ready-to-study replies are on by default'
);

update public.learning_items
set provider_metadata = jsonb_build_object('telegram_message_id', 4242)
where user_id = '22222222-2222-4222-8222-222222222222'
  and status = 'done';

select is(
  jsonb_array_length(
    public.get_telegram_notice_context(
      '22222222-2222-4222-8222-222222222222',
      array(
        select learning_item.id
        from public.learning_items as learning_item
        where learning_item.user_id = '22222222-2222-4222-8222-222222222222'
      )
    ) -> 'items'
  ),
  1,
  'only items carrying an originating Telegram message are returned'
);

select is(
  (
    public.get_telegram_notice_context(
      '22222222-2222-4222-8222-222222222222',
      array(
        select learning_item.id
        from public.learning_items as learning_item
        where learning_item.user_id = '22222222-2222-4222-8222-222222222222'
          and learning_item.status = 'done'
      )
    ) -> 'items' -> 0 ->> 'telegramMessageId'
  )::bigint,
  4242::bigint,
  'the reply target is the message the link arrived in'
);

update public.user_settings
set ready_replies_enabled = false
where user_id = '22222222-2222-4222-8222-222222222222';

select is(
  (
    public.get_telegram_notice_context(
      '22222222-2222-4222-8222-222222222222',
      array(
        select learning_item.id
        from public.learning_items as learning_item
        where learning_item.user_id = '22222222-2222-4222-8222-222222222222'
      )
    ) ->> 'enabled'
  )::boolean,
  false,
  'turning replies off is reported to the worker'
);

select is(
  (
    public.get_telegram_notice_context(
      '11111111-1111-4111-8111-111111111111',
      array(
        select learning_item.id
        from public.learning_items as learning_item
        where learning_item.user_id = '22222222-2222-4222-8222-222222222222'
      )
    ) -> 'items'
  ),
  '[]'::jsonb,
  'another account cannot pull reply targets for items it does not own'
);

update public.user_settings
set ready_replies_enabled = true
where user_id = '22222222-2222-4222-8222-222222222222';

-- A project that already had accounts before this schema was deployed has
-- auth users with no profile or settings, because the bootstrap trigger only
-- fires on insert. The backfill must repair them and stay idempotent.
delete from public.user_settings
where user_id = '22222222-2222-4222-8222-222222222222';
delete from public.profiles
where id = '22222222-2222-4222-8222-222222222222';

select private.backfill_missing_user_records();

select is(
  (
    select count(*)
    from public.profiles as profile
    join public.user_settings as settings on settings.user_id = profile.id
    where profile.id = '22222222-2222-4222-8222-222222222222'
  ),
  1::bigint,
  'the backfill restores records for an account created before the trigger existed'
);

select private.backfill_missing_user_records();

select is(
  (
    select count(*)
    from public.profiles
    where id = '22222222-2222-4222-8222-222222222222'
  ),
  1::bigint,
  'running the backfill again changes nothing'
);

select * from finish();
rollback;
