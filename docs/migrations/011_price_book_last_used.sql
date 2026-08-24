-- Trackear cuándo se usó un price book item por última vez
ALTER TABLE price_book_items
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz;
