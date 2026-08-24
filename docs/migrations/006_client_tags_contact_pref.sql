-- Tags y preferencia de contacto para clientes
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tags        text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contact_pref text    CHECK (contact_pref IN ('phone','email','sms','any')) DEFAULT 'any';
