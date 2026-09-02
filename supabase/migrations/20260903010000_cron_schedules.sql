-- Recurring maintenance schedules.
--
-- The worker Edge Function is invoked over HTTP every minute and due
-- maintenance work is enqueued hourly. Credentials are never stored in this
-- migration: the invocation reads the named Supabase Vault secrets
-- `project_url` and `internal_cron_secret` at execution time. Environments
-- without those secrets (local resets, CI, test runs) stay a no-op instead of
-- queueing HTTP requests that could never succeed.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.invoke_process_learning_jobs()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_url text;
  v_cron_secret text;
  v_request_id bigint;
begin
  select nullif(btrim(secret.decrypted_secret), '')
  into v_project_url
  from vault.decrypted_secrets as secret
  where secret.name = 'project_url'
  order by secret.created_at desc
  limit 1;

  select nullif(btrim(secret.decrypted_secret), '')
  into v_cron_secret
  from vault.decrypted_secrets as secret
  where secret.name = 'internal_cron_secret'
  order by secret.created_at desc
  limit 1;

  if v_project_url is null or v_cron_secret is null then
    return null;
  end if;

  select net.http_post(
    url := rtrim(v_project_url, '/') || '/functions/v1/process-learning-jobs',
    body := jsonb_build_object('batchSize', 5),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Cron-Secret', v_cron_secret
    ),
    timeout_milliseconds := 30000
  )
  into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.invoke_process_learning_jobs()
from public, anon, authenticated;

comment on function public.invoke_process_learning_jobs()
is 'Posts to the process-learning-jobs Edge Function using the project_url and internal_cron_secret Vault secrets. Returns null when either secret is unset.';

do $$
begin
  if exists (select 1 from cron.job where jobname = 'process-learning-jobs') then
    perform cron.unschedule('process-learning-jobs');
  end if;

  if exists (select 1 from cron.job where jobname = 'enqueue-due-maintenance-jobs') then
    perform cron.unschedule('enqueue-due-maintenance-jobs');
  end if;
end;
$$;

select cron.schedule(
  'process-learning-jobs',
  '* * * * *',
  $job$select public.invoke_process_learning_jobs();$job$
);

select cron.schedule(
  'enqueue-due-maintenance-jobs',
  '0 * * * *',
  $job$select public.enqueue_due_maintenance_jobs();$job$
);
