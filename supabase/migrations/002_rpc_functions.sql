-- RPC: start_session
CREATE OR REPLACE FUNCTION start_session(
    p_activity_type TEXT,
    p_duration_minutes INTEGER,
    p_strict_mode BOOLEAN DEFAULT false
) RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
BEGIN
    INSERT INTO sessions (user_id, activity_type, duration_minutes)
    VALUES (auth.uid(), p_activity_type, p_duration_minutes)
    RETURNING id INTO v_session_id;

    RETURN jsonb_build_object(
        'session_id', v_session_id,
        'started_at', now(),
        'duration_minutes', p_duration_minutes
    );
END;
$$ LANGUAGE plpgsql;

-- RPC: link_pomodoro
CREATE OR REPLACE FUNCTION link_pomodoro(
    p_subtask_id UUID,
    p_session_id UUID,
    p_minutes INTEGER
) RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_goal_total INTEGER;
    v_goal_estimated INTEGER;
BEGIN
    INSERT INTO task_pomodoro_links (user_id, subtask_id, session_id, minutes, date)
    VALUES (auth.uid(), p_subtask_id, p_session_id, p_minutes, CURRENT_DATE);

    UPDATE task_subtasks
    SET completed_minutes = completed_minutes + p_minutes
    WHERE id = p_subtask_id;

    SELECT SUM(completed_minutes), SUM(estimated_minutes)
    INTO v_goal_total, v_goal_estimated
    FROM task_subtasks
    WHERE goal_id = (SELECT goal_id FROM task_subtasks WHERE id = p_subtask_id);

    RETURN jsonb_build_object(
        'total_completed', v_goal_total,
        'total_estimated', v_goal_estimated
    );
END;
$$ LANGUAGE plpgsql;

-- RPC: get_goal_rhythm
CREATE OR REPLACE FUNCTION get_goal_rhythm(p_goal_id UUID)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_goal RECORD;
    v_stats RECORD;
    v_days_total INT;
    v_days_elapsed INT;
    v_days_remaining INT;
    v_rhythm_daily INT;
    v_progress_pct INT;
    v_needed_daily INT;
    v_today_actual INT;
BEGIN
    SELECT * INTO v_goal FROM task_goals WHERE id = p_goal_id;
    IF NOT FOUND THEN RETURN NULL; END IF;

    SELECT
        COALESCE(SUM(estimated_minutes), 0) as total_estimated,
        COALESCE(SUM(completed_minutes), 0) as total_completed
    INTO v_stats
    FROM task_subtasks WHERE goal_id = p_goal_id;

    v_days_total := GREATEST(1, (v_goal.deadline - v_goal.start_date::DATE));
    v_days_elapsed := GREATEST(0, (CURRENT_DATE - v_goal.start_date::DATE));
    v_days_remaining := GREATEST(0, (v_goal.deadline - CURRENT_DATE));
    v_rhythm_daily := v_stats.total_estimated / v_days_total;
    v_progress_pct := LEAST(100, (v_stats.total_completed * 100 / NULLIF(v_stats.total_estimated, 0)));
    v_needed_daily := CASE WHEN v_days_remaining > 0
        THEN (v_stats.total_estimated - v_stats.total_completed) / v_days_remaining
        ELSE v_stats.total_estimated - v_stats.total_completed
    END;

    SELECT COALESCE(SUM(minutes), 0) INTO v_today_actual
    FROM task_pomodoro_links
    WHERE subtask_id IN (SELECT id FROM task_subtasks WHERE goal_id = p_goal_id)
    AND date = CURRENT_DATE;

    RETURN jsonb_build_object(
        'days_elapsed', v_days_elapsed,
        'days_remaining', v_days_remaining,
        'days_total', v_days_total,
        'estimated', v_stats.total_estimated,
        'completed', v_stats.total_completed,
        'progress_pct', v_progress_pct,
        'rhythm_daily', v_rhythm_daily,
        'needed_daily', v_needed_daily,
        'today_actual', v_today_actual
    );
END;
$$ LANGUAGE plpgsql;

-- RPC: add_xp
CREATE OR REPLACE FUNCTION add_xp(p_xp INTEGER)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_gamification RECORD;
    v_new_level INTEGER;
BEGIN
    INSERT INTO gamification (user_id, total_xp, level)
    VALUES (auth.uid(), p_xp, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_xp = gamification.total_xp + p_xp
    RETURNING * INTO v_gamification;

    v_new_level := 1;
    FOR i IN 1..20 LOOP
        IF v_gamification.total_xp >= (SELECT (i * 100) + (i * i * 10)) THEN
            v_new_level := i + 1;
        END IF;
    END LOOP;

    UPDATE gamification SET level = v_new_level WHERE user_id = auth.uid();

    RETURN jsonb_build_object(
        'total_xp', v_gamification.total_xp + p_xp,
        'level', v_new_level,
        'xp_gained', p_xp
    );
END;
$$ LANGUAGE plpgsql;

-- RPC: get_monthly_habits
CREATE OR REPLACE FUNCTION get_monthly_habits(p_month_key TEXT)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', h.id,
            'name', h.name,
            'icon', h.icon,
            'color', h.color,
            'is_primary', h.is_primary,
            'logs', (
                SELECT jsonb_agg(jsonb_build_object('date', hl.date, 'count', hl.count))
                FROM habit_logs hl
                WHERE hl.habit_id = h.id
            )
        )
    ) INTO v_result
    FROM habits h
    WHERE h.user_id = auth.uid() AND h.month_key = p_month_key;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- RPC: search_notes
CREATE OR REPLACE FUNCTION search_notes(p_query TEXT)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'content', content,
            'note_type', note_type,
            'tags', tags,
            'created_at', created_at
        )
    ) INTO v_result
    FROM knowledge_notes
    WHERE user_id = auth.uid()
    AND (title ILIKE '%' || p_query || '%' OR content ILIKE '%' || p_query || '%');

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- RPC: get_mood_stats
CREATE OR REPLACE FUNCTION get_mood_stats()
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_avg_before NUMERIC;
    v_avg_after NUMERIC;
    v_total_logs INT;
BEGIN
    SELECT AVG(before_mood), AVG(after_mood), COUNT(*)
    INTO v_avg_before, v_avg_after, v_total_logs
    FROM mood_logs
    WHERE user_id = auth.uid();

    RETURN jsonb_build_object(
        'avg_before', ROUND(COALESCE(v_avg_before, 0)::numeric, 1),
        'avg_after', ROUND(COALESCE(v_avg_after, 0)::numeric, 1),
        'total_logs', v_total_logs
    );
END;
$$ LANGUAGE plpgsql;
