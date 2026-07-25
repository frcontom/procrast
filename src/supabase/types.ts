export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: ProfileInsert; Update: ProfileUpdate }
      sessions: { Row: Session; Insert: SessionInsert; Update: SessionUpdate }
      statistics: { Row: Statistic; Insert: StatisticInsert }
      task_goals: { Row: TaskGoal; Insert: TaskGoalInsert; Update: TaskGoalUpdate }
      task_subtasks: { Row: TaskSubtask; Insert: TaskSubtaskInsert; Update: TaskSubtaskUpdate }
      task_pomodoro_links: { Row: TaskPomodoroLink; Insert: TaskPomodoroLinkInsert }
      habits: { Row: Habit; Insert: HabitInsert; Update: HabitUpdate }
      habit_logs: { Row: HabitLog; Insert: HabitLogInsert }
      habit_streaks: { Row: HabitStreak; Insert: HabitStreakInsert; Update: HabitStreakUpdate }
      knowledge_notes: { Row: KnowledgeNote; Insert: KnowledgeNoteInsert; Update: KnowledgeNoteUpdate }
      identity_statements: { Row: IdentityStatement; Insert: IdentityStatementInsert; Update: IdentityStatementUpdate }
      identity_roles: { Row: IdentityRole; Insert: IdentityRoleInsert; Update: IdentityRoleUpdate }
      identity_logs: { Row: IdentityLog; Insert: IdentityLogInsert }
      coaching_messages: { Row: CoachingMessage; Insert: CoachingMessageInsert; Update: CoachingMessageUpdate }
      gamification: { Row: Gamification; Insert: GamificationInsert; Update: GamificationUpdate }
      badges: { Row: Badge; Insert: BadgeInsert; Update: BadgeUpdate }
      mood_logs: { Row: MoodLog; Insert: MoodLogInsert }
    }
    Functions: {
      start_session: { Args: { p_activity_type: string; p_duration_minutes: number; p_strict_mode?: boolean }; Returns: any }
      link_pomodoro: { Args: { p_subtask_id: string; p_session_id: string; p_minutes: number }; Returns: any }
      get_goal_rhythm: { Args: { p_goal_id: string }; Returns: any }
    }
  }
}

export interface Profile { id: string; user_id: string; name: string; activity_type: string; duration_minutes: number; strict_mode: boolean; config: any; created_at: string }
export interface ProfileInsert { user_id: string; name?: string; activity_type?: string; duration_minutes?: number; strict_mode?: boolean; config?: any }
export interface ProfileUpdate { name?: string; activity_type?: string; duration_minutes?: number; strict_mode?: boolean; config?: any }

export interface Session { id: string; user_id: string; activity_type: string; session_name: string; duration_minutes: number; elapsed_seconds: number; state: 'completed' | 'cancelled'; started_at: string; finished_at: string | null; interruption_reason: string | null }
export interface SessionInsert { user_id: string; activity_type: string; session_name?: string; duration_minutes: number; elapsed_seconds?: number; state?: 'completed' | 'cancelled'; finished_at?: string | null; interruption_reason?: string | null }
export interface SessionUpdate { session_name?: string; elapsed_seconds?: number; state?: 'completed' | 'cancelled'; finished_at?: string | null; interruption_reason?: string | null }

export interface Statistic { id: string; user_id: string; total_sessions: number; completed_sessions: number; interrupted_sessions: number; total_seconds: number; current_streak: number; best_streak: number }
export interface StatisticInsert { user_id: string; total_sessions?: number; completed_sessions?: number; interrupted_sessions?: number; total_seconds?: number; current_streak?: number; best_streak?: number }

export interface TaskGoal { id: string; user_id: string; name: string; description: string; deadline: string; start_date: string | null; estimated_minutes: number; icon: string; color: string; priority: 'critical' | 'high' | 'normal' | 'low'; notes: string; status: 'active' | 'completed' | 'archived'; completed_at: string | null; created_at: string }
export interface TaskGoalInsert { user_id: string; name: string; description?: string; deadline: string; start_date?: string | null; estimated_minutes?: number; icon?: string; color?: string; priority?: 'critical' | 'high' | 'normal' | 'low'; notes?: string; status?: 'active' | 'completed' | 'archived' }
export interface TaskGoalUpdate { name?: string; description?: string; deadline?: string; start_date?: string | null; estimated_minutes?: number; icon?: string; color?: string; priority?: 'critical' | 'high' | 'normal' | 'low'; notes?: string; status?: 'active' | 'completed' | 'archived'; completed_at?: string | null }

export interface TaskSubtask { id: string; user_id: string; goal_id: string; name: string; description: string; estimated_minutes: number; completed_minutes: number; status: 'pending' | 'in_progress' | 'completed'; difficulty: 'easy' | 'normal' | 'hard'; depends_on: string | null; sort_order: number; created_at: string }
export interface TaskSubtaskInsert { user_id: string; goal_id: string; name: string; description?: string; estimated_minutes?: number; completed_minutes?: number; status?: 'pending' | 'in_progress' | 'completed'; difficulty?: 'easy' | 'normal' | 'hard'; depends_on?: string | null; sort_order?: number }
export interface TaskSubtaskUpdate { name?: string; description?: string; estimated_minutes?: number; completed_minutes?: number; status?: 'pending' | 'in_progress' | 'completed'; difficulty?: 'easy' | 'normal' | 'hard'; depends_on?: string | null; sort_order?: number }

export interface TaskPomodoroLink { id: string; user_id: string; subtask_id: string; session_id: string | null; minutes: number; date: string; subtask_name: string; created_at: string }
export interface TaskPomodoroLinkInsert { user_id: string; subtask_id: string; session_id?: string | null; minutes?: number; date: string; subtask_name?: string }

export interface Habit { id: string; user_id: string; name: string; icon: string; color: string; month_key: string; is_primary: boolean; created_at: string }
export interface HabitInsert { user_id: string; name: string; icon?: string; color?: string; month_key: string; is_primary?: boolean }
export interface HabitUpdate { name?: string; icon?: string; color?: string; month_key?: string; is_primary?: boolean }

export interface HabitLog { id: string; user_id: string; habit_id: string; date: string; count: number; note: string; created_at: string }
export interface HabitLogInsert { user_id: string; habit_id: string; date: string; count?: number; note?: string }

export interface HabitStreak { id: string; user_id: string; habit_id: string; current_streak: number; best_streak: number; last_date: string | null }
export interface HabitStreakInsert { user_id: string; habit_id: string; current_streak?: number; best_streak?: number; last_date?: string | null }
export interface HabitStreakUpdate { current_streak?: number; best_streak?: number; last_date?: string | null }

export interface KnowledgeNote { id: string; user_id: string; title: string; content: string; note_type: 'general' | 'session' | 'mission' | 'habit'; reference_id: string | null; tags: string; created_at: string; updated_at: string }
export interface KnowledgeNoteInsert { user_id: string; title?: string; content?: string; note_type?: 'general' | 'session' | 'mission' | 'habit'; reference_id?: string | null; tags?: string }
export interface KnowledgeNoteUpdate { title?: string; content?: string; note_type?: 'general' | 'session' | 'mission' | 'habit'; reference_id?: string | null; tags?: string }

export interface IdentityStatement { id: string; user_id: string; statement: string; category: string; color: string; active: boolean; created_at: string }
export interface IdentityStatementInsert { user_id: string; statement: string; category?: string; color?: string; active?: boolean }
export interface IdentityStatementUpdate { statement?: string; category?: string; color?: string; active?: boolean }

export interface IdentityRole { id: string; user_id: string; name: string; description: string; icon: string; color: string; active: boolean }
export interface IdentityRoleInsert { user_id: string; name: string; description?: string; icon?: string; color?: string; active?: boolean }
export interface IdentityRoleUpdate { name?: string; description?: string; icon?: string; color?: string; active?: boolean }

export interface IdentityLog { id: string; user_id: string; statement_id: string | null; role_id: string | null; date: string; note: string; rating: number }
export interface IdentityLogInsert { user_id: string; statement_id?: string | null; role_id?: string | null; date: string; note?: string; rating?: number }

export interface CoachingMessage { id: string; user_id: string; msg_type: 'insight' | 'nudge' | 'achievement' | 'milestone'; category: string; title: string; message: string; shown: boolean; created_at: string }
export interface CoachingMessageInsert { user_id: string; msg_type: 'insight' | 'nudge' | 'achievement' | 'milestone'; category?: string; title: string; message: string; shown?: boolean }
export interface CoachingMessageUpdate { shown?: boolean }

export interface Gamification { id: string; user_id: string; total_xp: number; level: number; settings: any }
export interface GamificationInsert { user_id: string; total_xp?: number; level?: number; settings?: any }
export interface GamificationUpdate { total_xp?: number; level?: number; settings?: any }

export interface Badge { id: string; user_id: string; code: string; title: string; description: string; icon: string; unlocked: boolean; unlocked_at: string | null }
export interface BadgeInsert { user_id: string; code: string; title?: string; description?: string; icon?: string; unlocked?: boolean; unlocked_at?: string | null }
export interface BadgeUpdate { title?: string; description?: string; icon?: string; unlocked?: boolean; unlocked_at?: string | null }

export interface MoodLog { id: string; user_id: string; session_id: string | null; before_mood: number | null; after_mood: number | null; note: string; created_at: string }
export interface MoodLogInsert { user_id: string; session_id?: string | null; before_mood?: number | null; after_mood?: number | null; note?: string }
