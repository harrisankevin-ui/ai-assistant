-- Max Personal Assistant — Schema v3
-- Run this in the Supabase SQL editor

-- Long-term memory for Max
create table if not exists memories (
  id         uuid primary key default gen_random_uuid(),
  category   text not null check (category in ('user_fact', 'preference', 'context')),
  key        text not null,
  value      text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists memories_key_idx on memories(key);
create index if not exists memories_category_idx on memories(category);

-- Link Telegram conversations to a chat ID
alter table conversations add column if not exists telegram_chat_id bigint unique;
create index if not exists conversations_telegram_chat_id_idx on conversations(telegram_chat_id);

-- Task priority levels
alter table tasks add column if not exists priority text not null default 'moderate'
  check (priority in ('low', 'moderate', 'high'));

-- Pre-populate Harrisan's memory
insert into memories (category, key, value) values
  ('user_fact',  'user_name',         'Harrisan'),
  ('user_fact',  'assistant_name',    'Max'),
  ('user_fact',  'timezone',          'America/Toronto'),
  ('user_fact',  'location',          'Toronto, Canada'),
  ('context',    'softball',          'Harrisan is starting a softball team'),
  ('preference', 'working_style',     'Entrepreneurial — has multiple projects across different life areas'),
  ('preference', 'task_priorities',   'Uses three priority levels: low, moderate, high'),
  ('preference', 'assistant_purpose', 'Help organize day-to-day life: tasks, reminders, priorities, projects')
on conflict (key) do update set value = excluded.value, updated_at = now();
