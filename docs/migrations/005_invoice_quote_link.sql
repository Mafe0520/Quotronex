-- Link invoices to their source quote
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);
