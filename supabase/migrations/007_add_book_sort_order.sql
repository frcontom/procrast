-- Books: orden personalizable (drag & drop)
ALTER TABLE books ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;