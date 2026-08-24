-- Favoritos en el catálogo
ALTER TABLE price_book_items
  ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text;
