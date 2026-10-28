-- Módulo Calendario: actividades con día, hora, propósito y color
CREATE TABLE IF NOT EXISTS calendar_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    objective TEXT DEFAULT '',
    color TEXT DEFAULT '#a66cff',
    activity_date DATE NOT NULL,         -- día de la actividad
    start_time TEXT DEFAULT '',          -- hora "HH:MM", vacío = todo el día
    duration_minutes INTEGER DEFAULT 30,
    done BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_activities(user_id, activity_date);

ALTER TABLE calendar_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_crud_own_calendar" ON calendar_activities
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
