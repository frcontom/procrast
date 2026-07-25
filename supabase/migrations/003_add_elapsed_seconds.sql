ALTER TABLE task_pomodoro_links ADD COLUMN IF NOT EXISTS elapsed_seconds INTEGER DEFAULT 0;
