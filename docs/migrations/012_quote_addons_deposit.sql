-- Add-ons opcionales en items de cotización
ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS optional boolean NOT NULL DEFAULT false;

-- Depósito en cotizaciones
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS deposit_cents integer,
  ADD COLUMN IF NOT EXISTS deposit_pct numeric(5,2);
