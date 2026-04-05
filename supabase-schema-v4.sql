-- Max Personal Assistant — Schema v4
-- Adds weekly_brief flag to tasks
-- Run this in the Supabase SQL editor

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS weekly_brief BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS tasks_weekly_brief_idx ON tasks(weekly_brief) WHERE weekly_brief = TRUE;
