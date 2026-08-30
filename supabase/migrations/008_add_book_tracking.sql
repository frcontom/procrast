-- Books: mejoras de seguimiento
ALTER TABLE books ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- Book bookmarks / notas por pagina
CREATE TABLE IF NOT EXISTS book_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    page INTEGER NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book ON book_bookmarks(book_id, page);
ALTER TABLE book_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_bookmarks" ON book_bookmarks FOR ALL USING (auth.uid() = user_id);

-- Book chapters (para marcar avance por capitulo)
CREATE TABLE IF NOT EXISTS book_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_page INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chapters_book ON book_chapters(book_id, sort_order);
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_chapters" ON book_chapters FOR ALL USING (auth.uid() = user_id);