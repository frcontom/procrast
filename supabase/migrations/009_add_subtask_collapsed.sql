-- Task subtasks: estado de colapso persistido en DB
ALTER TABLE task_subtasks ADD COLUMN IF NOT EXISTS collapsed BOOLEAN DEFAULT true;