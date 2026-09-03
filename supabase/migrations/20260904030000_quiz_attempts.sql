-- A quiz score that lives in React state is gone the moment the tab reloads,
-- which makes the last step of a topic the only one that leaves no trace. An
-- attempt is recorded per completed run so the score survives a refresh, a
-- second device, and a retake — and so retaking is a deliberate new attempt
-- rather than an overwrite of the old one.
--
-- Only completed runs are stored. A half-finished quiz is still browser state:
-- persisting every answer would mean a write per question for a record nobody
-- reads.

-- Attempts are scoped to the artifact, not just the topic: a rebuilt quiz (v2)
-- asks different questions, so its scores are not comparable to v1's. The
-- composite unique mirrors topics_id_user_unique and learning_items_id_user_unique
-- so the attempt can carry an owner-consistent foreign key rather than trusting
-- the two columns to agree.
alter table public.topic_artifacts
  add constraint topic_artifacts_id_user_unique unique (id, user_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null,
  artifact_id uuid not null,
  score integer not null,
  total_questions integer not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint quiz_attempts_total_questions_positive check (total_questions > 0),
  constraint quiz_attempts_score_within_total check (score between 0 and total_questions),
  constraint quiz_attempts_topic_owner_fk
    foreign key (topic_id, user_id)
    references public.topics (id, user_id)
    on delete cascade,
  constraint quiz_attempts_artifact_owner_fk
    foreign key (artifact_id, user_id)
    references public.topic_artifacts (id, user_id)
    on delete cascade
);

comment on table public.quiz_attempts
is 'One row per completed quiz run. Retaking a quiz adds a row rather than replacing one.';

-- The topic page reads the newest attempts for one artifact, and derives the
-- best score from the same set.
create index quiz_attempts_user_artifact_completed_idx
  on public.quiz_attempts (user_id, artifact_id, completed_at desc);
create index quiz_attempts_user_topic_completed_idx
  on public.quiz_attempts (user_id, topic_id, completed_at desc);

alter table public.quiz_attempts enable row level security;

create policy quiz_attempts_select_own
on public.quiz_attempts for select
to authenticated
using ((select auth.uid()) = user_id);

-- Recording goes through the RPC below rather than an insert grant, so the row's
-- owner and topic are derived from the artifact instead of being asserted by the
-- caller.
revoke all on table public.quiz_attempts from anon, authenticated;
grant select on table public.quiz_attempts to authenticated;
grant all on table public.quiz_attempts to service_role;

create or replace function public.record_quiz_attempt(
  p_artifact_id uuid,
  p_score integer,
  p_total_questions integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_topic_id uuid;
  v_attempt_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- Reading the topic from the artifact is also the ownership check: an artifact
  -- belonging to someone else simply does not come back.
  select artifact.topic_id
  into v_topic_id
  from public.topic_artifacts as artifact
  where artifact.id = p_artifact_id
    and artifact.user_id = v_user_id
    and artifact.kind = 'quiz';

  if v_topic_id is null then
    raise exception 'Quiz not found' using errcode = 'P0002';
  end if;

  if p_total_questions is null or p_total_questions <= 0 then
    raise exception 'A quiz attempt needs at least one question' using errcode = '22023';
  end if;

  if p_score is null or p_score < 0 or p_score > p_total_questions then
    raise exception 'Quiz score must fall within the number of questions' using errcode = '22023';
  end if;

  insert into public.quiz_attempts (
    user_id,
    topic_id,
    artifact_id,
    score,
    total_questions
  )
  values (
    v_user_id,
    v_topic_id,
    p_artifact_id,
    p_score,
    p_total_questions
  )
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

revoke all on function public.record_quiz_attempt(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.record_quiz_attempt(uuid, integer, integer)
  to authenticated;
