-- AI Assistant — Schema v2
-- Run this in the Supabase SQL Editor (after running supabase-schema.sql first)

-- Projects table (dynamic, user-created)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default 'indigo',
  created_at timestamptz default now()
);

-- Add project_id to existing tables (nullable so existing data is unaffected)
alter table notes add column if not exists project_id uuid references projects(id) on delete set null;
alter table documents add column if not exists project_id uuid references projects(id) on delete set null;
alter table tasks add column if not exists project_id uuid references projects(id) on delete set null;

-- Reminders table
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  due_at timestamptz not null,
  project_id uuid references projects(id) on delete set null,
  telegram_chat_id bigint,
  sent boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists reminders_due_idx on reminders(due_at) where sent = false;
create index if not exists notes_project_idx on notes(project_id);
create index if not exists documents_project_idx on documents(project_id);
create index if not exists tasks_project_idx on tasks(project_id);
