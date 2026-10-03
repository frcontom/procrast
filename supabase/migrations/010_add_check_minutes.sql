-- Minutos acreditados manualmente con el check de una tarea (<10 min).
-- Al desmarcar la tarea se revierte SOLO este tiempo; los minutos legítimos
-- acumulados por pomodoro nunca se tocan.
ALTER TABLE task_subtasks ADD COLUMN IF NOT EXISTS check_minutes integer NOT NULL DEFAULT 0;
