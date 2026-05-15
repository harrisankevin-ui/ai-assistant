-- v5: add missing task columns (due_at, archived, completed_at)
-- These columns were referenced by the application code but never added to the schema.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS tasks_archived_idx ON tasks(archived) WHERE archived = FALSE;
CREATE INDEX IF NOT EXISTS tasks_due_at_idx ON tasks(due_at) WHERE due_at IS NOT NULL;
