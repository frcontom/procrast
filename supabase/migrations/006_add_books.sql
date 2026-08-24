-- Books
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT DEFAULT '',
    total_pages INTEGER DEFAULT 0,
    current_page INTEGER DEFAULT 0,
    status TEXT DEFAULT 'reading' CHECK(status IN ('reading','finished','paused')),
    file_path TEXT DEFAULT '',
    file_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_books_user ON books(user_id);
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_books" ON books FOR ALL USING (auth.uid() = user_id);

-- Book reading log (se registra cada sesion de lectura: paginas recorridas y tiempo)
CREATE TABLE book_reading_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    seconds INTEGER DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_book_logs_book_date ON book_reading_logs(book_id, date);
ALTER TABLE book_reading_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_crud_own_book_logs" ON book_reading_logs FOR ALL USING (auth.uid() = user_id);

-- Storage bucket privado por usuario
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', false)
ON CONFLICT (id) DO NOTHING;

-- RLS sobre storage.objects para el bucket books:
-- carpeta = user_id, el usuario solo ve/escribe lo suyo
CREATE POLICY "books_read_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'books' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "books_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'books' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "books_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'books' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "books_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'books' AND (storage.foldername(name))[1] = auth.uid()::text);