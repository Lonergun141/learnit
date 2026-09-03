-- The bot answers a captured link when its materials are ready.
--
-- Sending a link already gets an immediate "Added 1 item." and then silence for
-- however long fetching, classifying and generating take. Whether it worked was
-- only discoverable by opening the app, and a permanent failure was invisible
-- until a digest mentioned an all-time "needs attention" count.
--
-- This is a reply, not a notification: it is threaded under the message the
-- person sent and delivered silently, so it appears in the conversation without
-- interrupting them. The daily digest stays the only thing that pings.
--
-- The two are independent — a receipt that a capture worked and a prompt to sit
-- down and study are different jobs — so this is its own toggle rather than a
-- mode chosen against `digest_enabled`.

alter table public.user_settings
  add column ready_replies_enabled boolean not null default true;

comment on column public.user_settings.ready_replies_enabled
is 'Whether the bot replies under a captured Telegram message once its topic materials are built, or the capture fails.';

-- Column-scoped like every other authenticated grant on this table.
grant update (ready_replies_enabled) on table public.user_settings to authenticated;

-- Reply context for a set of items the worker has just finished with.
--
-- Only items captured from Telegram carry an originating message id, so items
-- saved from the web form or pulled in by playlist capture return no message to
-- thread under and are silently left out. That is what keeps a thirty-video
-- playlist from producing thirty replies: it falls out of the data rather than
-- needing a special case.
create or replace function public.get_telegram_notice_context(
  p_user_id uuid,
  p_item_ids uuid[]
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'enabled',
    coalesce(
      (
        select settings.ready_replies_enabled
        from public.user_settings as settings
        where settings.user_id = p_user_id
      ),
      false
    ),
    'chatId',
    (
      select connection.chat_id
      from public.telegram_connections as connection
      where connection.user_id = p_user_id
    ),
    'items',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'itemId', learning_item.id,
            'title', learning_item.title,
            'topicId', learning_item.topic_id,
            'topicName', topic.name,
            'telegramMessageId',
            (learning_item.provider_metadata ->> 'telegram_message_id')::bigint
          )
          order by learning_item.built_at, learning_item.id
        )
        from public.learning_items as learning_item
        left join public.topics as topic
          on topic.id = learning_item.topic_id
         and topic.user_id = learning_item.user_id
        where learning_item.user_id = p_user_id
          and learning_item.id = any(p_item_ids)
          and learning_item.provider_metadata ? 'telegram_message_id'
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.get_telegram_notice_context(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.get_telegram_notice_context(uuid, uuid[])
  to service_role;

comment on function public.get_telegram_notice_context(uuid, uuid[])
is 'Returns the chat, toggle state, and originating message ids needed to reply under captured Telegram messages. Items with no originating message are omitted.';
