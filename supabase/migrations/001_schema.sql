-- Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Focus',
    activity_type TEXT DEFAULT 'focus',
    duration_minutes INTEGER DEFAULT 25,
    strict_mode BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_user ON profiles(user_id);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON profiles FOR ALL USING (auth.uid() = user_id);

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    session_name TEXT DEFAULT '',
    duration_minutes INTEGER NOT NULL,
    elapsed_seconds INTEGER DEFAULT 0,
    state TEXT DEFAULT 'completed' CHECK(state IN ('completed','cancelled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    interruption_reason TEXT
);
CREATE INDEX idx_sessions_user_date ON sessions(user_id, started_at DESC);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON sessions FOR ALL USING (auth.uid() = user_id);

-- Statistics
CREATE TABLE statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    interrupted_sessions INTEGER DEFAULT 0,
    total_seconds INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0
);
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON statistics FOR ALL USING (auth.uid() = user_id);

-- Task Goals
CREATE TABLE task_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    deadline DATE NOT NULL,
    start_date DATE,
    estimated_minutes INTEGER NOT NULL DEFAULT 0,
    icon TEXT DEFAULT 'bi-bullseye',
    color TEXT DEFAULT '#FF6B6B',
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('critical','high','normal','low')),
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','archived')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_goals_user_status ON task_goals(user_id, status);
ALTER TABLE task_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON task_goals FOR ALL USING (auth.uid() = user_id);

-- Task Subtasks
CREATE TABLE task_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES task_goals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    estimated_minutes INTEGER DEFAULT 0,
    completed_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed')),
    difficulty TEXT DEFAULT 'normal' CHECK(difficulty IN ('easy','normal','hard')),
    depends_on UUID REFERENCES task_subtasks(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_subtasks_goal ON task_subtasks(goal_id);
ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON task_subtasks FOR ALL USING (auth.uid() = user_id);

-- Task Pomodoro Links
CREATE TABLE task_pomodoro_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subtask_id UUID NOT NULL REFERENCES task_subtasks(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    minutes INTEGER DEFAULT 0,
    date DATE NOT NULL,
    subtask_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_pomo_links_subtask ON task_pomodoro_links(subtask_id);
CREATE INDEX idx_pomo_links_date ON task_pomodoro_links(date);
ALTER TABLE task_pomodoro_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON task_pomodoro_links FOR ALL USING (auth.uid() = user_id);

-- Habits
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'bi-star',
    color TEXT DEFAULT '#156390',
    month_key TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_habits_month ON habits(user_id, month_key);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON habits FOR ALL USING (auth.uid() = user_id);

-- Habit Logs
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INTEGER DEFAULT 1,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(habit_id, date)
);
CREATE INDEX idx_habit_logs_date ON habit_logs(habit_id, date);
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON habit_logs FOR ALL USING (auth.uid() = user_id);

-- Habit Streaks
CREATE TABLE habit_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_date DATE
);
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON habit_streaks FOR ALL USING (auth.uid() = user_id);

-- Knowledge Notes
CREATE TABLE knowledge_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    content TEXT DEFAULT '',
    note_type TEXT DEFAULT 'general' CHECK(note_type IN ('general','session','mission','habit')),
    reference_id TEXT,
    tags TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notes_type ON knowledge_notes(user_id, note_type);
ALTER TABLE knowledge_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON knowledge_notes FOR ALL USING (auth.uid() = user_id);

-- Identity Statements
CREATE TABLE identity_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    color TEXT DEFAULT '#A66CFF',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE identity_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON identity_statements FOR ALL USING (auth.uid() = user_id);

-- Identity Roles
CREATE TABLE identity_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'bi-person-badge',
    color TEXT DEFAULT '#A66CFF',
    active BOOLEAN DEFAULT true
);
ALTER TABLE identity_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON identity_roles FOR ALL USING (auth.uid() = user_id);

-- Identity Logs
CREATE TABLE identity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    statement_id UUID REFERENCES identity_statements(id) ON DELETE CASCADE,
    role_id UUID REFERENCES identity_roles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    note TEXT DEFAULT '',
    rating INTEGER DEFAULT 3 CHECK(rating BETWEEN 1 AND 5)
);
ALTER TABLE identity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON identity_logs FOR ALL USING (auth.uid() = user_id);

-- Coaching Messages
CREATE TABLE coaching_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    msg_type TEXT DEFAULT 'insight' CHECK(msg_type IN ('insight','nudge','achievement','milestone')),
    category TEXT DEFAULT 'general',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    shown BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE coaching_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON coaching_messages FOR ALL USING (auth.uid() = user_id);

-- Gamification
CREATE TABLE gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    settings JSONB DEFAULT '{}'
);
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON gamification FOR ALL USING (auth.uid() = user_id);

-- Badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMPTZ,
    UNIQUE(user_id, code)
);
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON badges FOR ALL USING (auth.uid() = user_id);

-- Mood Logs
CREATE TABLE mood_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    before_mood INTEGER,
    after_mood INTEGER,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_data" ON mood_logs FOR ALL USING (auth.uid() = user_id);
