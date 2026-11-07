-- Módulo Estudio: las mejores técnicas de estudio en un solo lugar
-- Active Recall · Técnica Feynman · Repetición espaciada · Práctica deliberada

CREATE TABLE IF NOT EXISTS study_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,                 -- de qué trata el ítem
    subject TEXT DEFAULT '',             -- materia / tema para agrupar
    color TEXT DEFAULT '#a66cff',

    -- Active Recall: pregunta y respuesta
    question TEXT DEFAULT '',
    answer TEXT DEFAULT '',

    -- Técnica Feynman: tu explicación simple + huecos detectados
    feynman TEXT DEFAULT '',
    feynman_gaps TEXT DEFAULT '',

    -- Práctica deliberada: habilidad concreta y reps enfocadas
    skill TEXT DEFAULT '',
    reps INTEGER DEFAULT 0,

    -- Repetición espaciada (SM-2 simplificado)
    ease REAL DEFAULT 2.5,               -- factor de facilidad
    interval_days INTEGER DEFAULT 0,     -- días hasta el próximo repaso
    repetitions INTEGER DEFAULT 0,       -- repasos correctos seguidos
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- próximo repaso
    last_reviewed TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_user_due ON study_items(user_id, due_date);

-- Historial de repasos (para estadísticas y la curva de olvido)
CREATE TABLE IF NOT EXISTS study_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES study_items(id) ON DELETE CASCADE,
    technique TEXT NOT NULL,             -- 'recall' | 'feynman' | 'deliberate' | 'spaced'
    quality INTEGER DEFAULT 0,           -- 0-5: qué tan bien lo recordaste
    reviewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_reviews_user ON study_reviews(user_id, reviewed_at);

ALTER TABLE study_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_crud_own_study_items" ON study_items
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_crud_own_study_reviews" ON study_reviews
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
