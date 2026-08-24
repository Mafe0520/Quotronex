-- Job photos (before / during / after)
CREATE TABLE IF NOT EXISTS job_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  business_id   uuid NOT NULL,
  url           text NOT NULL,
  phase         text NOT NULL CHECK (phase IN ('before', 'during', 'after')),
  caption       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business members can manage job photos"
  ON job_photos FOR ALL
  USING (business_id IN (SELECT unnest(get_my_business_ids())));

-- Change orders
CREATE TABLE IF NOT EXISTS change_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  business_id   uuid NOT NULL,
  description   text NOT NULL,
  amount_cents  integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business members can manage change orders"
  ON change_orders FOR ALL
  USING (business_id IN (SELECT unnest(get_my_business_ids())));

-- Job enhancements on jobs table
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS flags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completion_summary text,
  ADD COLUMN IF NOT EXISTS warranty_notes text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;
