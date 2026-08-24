-- Expiración y notas en cotizaciones
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS notes       text,
  ADD COLUMN IF NOT EXISTS decline_reason text;
