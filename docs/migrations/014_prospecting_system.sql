-- ============================================================
-- Migración 014 — Prospecting System
-- Tablas, funciones y RLS para Lead Research & Launch Pipeline
-- Correr en Supabase SQL Editor con rol superuser/service role
--
-- Convenciones:
--   • Tablas prefijadas con prospect_ para no colisionar con app
--   • RLS: usando (false) — solo service role tiene acceso
--   • Todas las funciones son SECURITY DEFINER (service role)
--   • No hay referencias a auth.users ni a businesses del app
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. SUPPRESSION LIST
-- Fuente de verdad. Nunca se vacía automáticamente.
-- Un lead puede coincidir con varias entradas.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_suppression_list (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_type  text        NOT NULL
    CHECK (identifier_type IN (
      'email', 'domain', 'facebook_url', 'instagram_url', 'business_name_city'
    )),
  identifier_value text        NOT NULL,
  reason           text        NOT NULL
    CHECK (reason IN (
      'contact_requested_removal',
      'opted_out',
      'do_not_contact',
      'legal_request',
      'manual'
    )),
  notes            text,
  source_lead_id   uuid,       -- referencia informativa, no FK (el lead podría borrarse)
  suppressed_at    timestamptz NOT NULL DEFAULT now(),
  suppressed_by    text
    CHECK (suppressed_by IN ('contact_request', 'opt_out_link', 'manual_operator')),
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT prospect_suppression_unique UNIQUE (identifier_type, identifier_value)
);

CREATE INDEX IF NOT EXISTS idx_suppression_value
  ON prospect_suppression_list (identifier_value);

ALTER TABLE prospect_suppression_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospect_suppression_list: service role only"
  ON prospect_suppression_list
  USING (false);


-- ─────────────────────────────────────────────────────────────
-- 2. LEADS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_leads (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad del negocio
  business_name          text        NOT NULL,
  trade                  text
    CHECK (trade IN ('painting','plumbing','electrical','hvac','pressure_washing','other')),
  city                   text,
  state                  char(2),

  -- Canales de contacto web/social
  website                text,
  contact_form_url       text,
  has_contact_form       boolean,
  facebook_url           text,
  instagram_url          text,
  tiktok_url             text,
  linkedin_url           text,
  google_business_url    text,

  -- Email (canal principal de outreach)
  -- NULL si no se encontró; nunca guardar texto como 'Not found'
  email                  text,
  email_origin           text
    CHECK (email_origin IN ('public_direct', 'enriched_provider', 'manual')),
  email_provider         text,       -- null si public_direct; 'hunter.io'|'apollo.io' si enriched
  email_source_url       text,
  email_collected_at     timestamptz,
  email_last_verified_at timestamptz,

  -- Teléfono: informativo únicamente, no canal de outreach
  phone_public           text,
  phone_source           text,

  -- Inteligencia
  language_signal        text
    CHECK (language_signal IN ('en', 'es', 'bilingual', 'unknown')),
  language_confidence    numeric(3,2)
    CHECK (language_confidence BETWEEN 0 AND 1),
  business_size          text
    CHECK (business_size IN ('solo', 'small_2_5', 'medium_6_20', 'unknown')),
  business_size_signals  text,
  uses_software          text
    CHECK (uses_software IN ('yes', 'no', 'unknown')),
  uses_software_signals  text,
  website_quality        text
    CHECK (website_quality IN ('modern', 'outdated', 'none')),

  -- Scoring
  priority               text        NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  priority_score         integer     CHECK (priority_score BETWEEN 0 AND 100),
  score_signals          text[]      DEFAULT '{}',

  -- Pipeline
  -- ready es el gate real: solo leads en 'ready' pueden iniciar outreach
  outreach_status        text        NOT NULL DEFAULT 'new'
    CHECK (outreach_status IN (
      'new', 'researched', 'ready', 'contacted',
      'replied', 'interested', 'demo', 'paid',
      'not_interested', 'suppressed'
    )),

  -- Supresión (cache — fuente de verdad en prospect_suppression_list)
  -- No hay FK: un lead puede coincidir con N supresiones
  is_suppressed          boolean     NOT NULL DEFAULT false,

  -- Seguimiento
  contacted_at           timestamptz,
  last_activity_at       timestamptz,
  notes                  text,
  internal_tags          text[]      DEFAULT '{}',

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  -- Invariantes de estado
  CONSTRAINT email_origin_requires_email
    CHECK (email_origin IS NULL OR email IS NOT NULL),

  CONSTRAINT suppressed_status_consistent
    CHECK (
      NOT (is_suppressed = true AND outreach_status NOT IN ('suppressed', 'not_interested'))
    ),

  CONSTRAINT contacted_requires_ready
    CHECK (
      outreach_status NOT IN ('contacted','replied','interested','demo','paid')
      OR contacted_at IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_leads_trade            ON prospect_leads (trade);
CREATE INDEX IF NOT EXISTS idx_leads_state            ON prospect_leads (state);
CREATE INDEX IF NOT EXISTS idx_leads_status           ON prospect_leads (outreach_status);
CREATE INDEX IF NOT EXISTS idx_leads_score            ON prospect_leads (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_language         ON prospect_leads (language_signal);
CREATE INDEX IF NOT EXISTS idx_leads_suppressed       ON prospect_leads (is_suppressed);
CREATE INDEX IF NOT EXISTS idx_leads_uses_software    ON prospect_leads (uses_software);
CREATE INDEX IF NOT EXISTS idx_leads_website_quality  ON prospect_leads (website_quality);
CREATE INDEX IF NOT EXISTS idx_leads_email            ON prospect_leads (email);

ALTER TABLE prospect_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospect_leads: service role only"
  ON prospect_leads
  USING (false);


-- ─────────────────────────────────────────────────────────────
-- 3. LEAD SOURCES
-- Trazabilidad multi-fuente. Nunca se modifica; solo INSERT.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_lead_sources (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           uuid        NOT NULL REFERENCES prospect_leads(id) ON DELETE CASCADE,
  source_type       text        NOT NULL
    CHECK (source_type IN (
      'yelp', 'google_places', 'angi', 'bbb', 'licensing_board',
      'hunter', 'apollo', 'website_scrape', 'facebook_page',
      'thumbtack', 'houzz', 'manual'
    )),
  source_url        text,
  provider          text,

  -- Raw data exactamente como llegó de la fuente
  raw_business_name text,
  raw_email         text,
  raw_phone         text,
  raw_address       text,
  raw_website       text,

  collected_at      timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_lead_id     ON prospect_lead_sources (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_source_type ON prospect_lead_sources (source_type);

ALTER TABLE prospect_lead_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospect_lead_sources: service role only"
  ON prospect_lead_sources
  USING (false);


-- ─────────────────────────────────────────────────────────────
-- 4. LEAD ACTIVITIES
-- Registro de acciones humanas. No incluye 'call' ni 'sms'.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_lead_activities (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid        NOT NULL REFERENCES prospect_leads(id) ON DELETE CASCADE,
  type        text        NOT NULL
    CHECK (type IN (
      'note',
      'email_sent',
      'email_replied',
      'dm_facebook',
      'dm_instagram',
      'contact_form_submitted',
      'community_mention',
      'referral_contact',
      'status_change',
      'suppression_added',
      'research_note'
      -- 'call' y 'sms' excluidos permanentemente
    )),
  content     text,
  channel_url text,
  old_status  text,
  new_status  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_lead_id   ON prospect_lead_activities (lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_created   ON prospect_lead_activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type      ON prospect_lead_activities (type);

ALTER TABLE prospect_lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospect_lead_activities: service role only"
  ON prospect_lead_activities
  USING (false);


-- ─────────────────────────────────────────────────────────────
-- 5. COMMUNITIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_communities (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  platform         text
    CHECK (platform IN ('facebook', 'reddit', 'linkedin', 'association', 'directory', 'other')),
  url              text,
  trade            text[],
  geography        text,
  language         text
    CHECK (language IN ('en', 'es', 'bilingual')),
  member_count     integer,
  member_count_at  date,
  community_type   text
    CHECK (community_type IN ('group', 'subreddit', 'association', 'directory', 'forum')),
  rules_summary    text,
  allows_promo     text
    CHECK (allows_promo IN ('yes', 'no', 'limited', 'unknown')),
  promo_rules      text,
  activity_level   text
    CHECK (activity_level IN ('high', 'medium', 'low')),
  priority         text        NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  notes            text,
  found_at         date,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE prospect_communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospect_communities: service role only"
  ON prospect_communities
  USING (false);


-- ─────────────────────────────────────────────────────────────
-- 6. CAMPAIGNS + JUNCTION
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_campaigns (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  filters     jsonb,
  channel     text
    CHECK (channel IN ('email', 'facebook_dm', 'instagram_dm', 'contact_form', 'community')),
  status      text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prospect_campaign_leads (
  campaign_id      uuid        NOT NULL REFERENCES prospect_campaigns(id) ON DELETE CASCADE,
  lead_id          uuid        NOT NULL REFERENCES prospect_leads(id) ON DELETE CASCADE,
  added_at         timestamptz NOT NULL DEFAULT now(),
  status_at_time   text,
  PRIMARY KEY (campaign_id, lead_id)
);

ALTER TABLE prospect_campaigns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_campaign_leads  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospect_campaigns: service role only"
  ON prospect_campaigns
  USING (false);

CREATE POLICY "prospect_campaign_leads: service role only"
  ON prospect_campaign_leads
  USING (false);


-- ─────────────────────────────────────────────────────────────
-- 7. FUNCIÓN: calculate_lead_score
-- Devuelve (score INTEGER, signals TEXT[], priority TEXT).
-- Pura: no hace escrituras. Llamar desde update_lead_score.
--
-- Grupos con techo:
--   G1 Trade fit   max 20
--   G2 Biz size    max 18
--   G3 Need/pain   max 30  (aditivo, cap)
--   G4 Channel     max 22  (aditivo, cap)
--   G5 Lang bonus  max 10
--   TOTAL          cap 100
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prospect_calculate_lead_score(p_lead_id uuid)
RETURNS TABLE (
  score    integer,
  signals  text[],
  priority text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  r           prospect_leads%ROWTYPE;
  g1          integer := 0;
  g2          integer := 0;
  g3_raw      integer := 0;
  g4_raw      integer := 0;
  g5          integer := 0;
  total       integer := 0;
  sigs        text[]  := '{}';
  prio        text    := 'low';
BEGIN
  SELECT * INTO r FROM prospect_leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, '{}'::text[], 'low'::text;
    RETURN;
  END IF;

  -- Lead suprimido: score siempre 0
  IF r.is_suppressed THEN
    RETURN QUERY SELECT 0, ARRAY['Suppressed']::text[], 'low'::text;
    RETURN;
  END IF;

  -- G1: Trade fit (max 20)
  IF r.trade IN ('painting','plumbing','electrical','hvac','pressure_washing') THEN
    g1   := 20;
    sigs := array_append(sigs, initcap(replace(r.trade, '_', ' ')));
  END IF;

  -- G2: Business size (max 18)
  IF    r.business_size = 'small_2_5'   THEN g2 := 18; sigs := array_append(sigs, '2-5 employees');
  ELSIF r.business_size = 'solo'        THEN g2 := 12; sigs := array_append(sigs, 'Solo operator');
  ELSIF r.business_size = 'medium_6_20' THEN g2 := 6;  sigs := array_append(sigs, '6-20 employees');
  ELSE                                       g2 := 3;
  END IF;

  -- G3: Need / pain signals (cap 30)
  IF    r.website_quality = 'none'     THEN g3_raw := g3_raw + 18; sigs := array_append(sigs, 'No website');
  ELSIF r.website_quality = 'outdated' THEN g3_raw := g3_raw + 12; sigs := array_append(sigs, 'Outdated website');
  END IF;

  IF    r.uses_software = 'no'      THEN g3_raw := g3_raw + 15; sigs := array_append(sigs, 'No CRM/software');
  ELSIF r.uses_software = 'unknown' THEN g3_raw := g3_raw + 5;
  END IF;

  -- G4: Contact channel (cap 22)
  IF r.email IS NOT NULL THEN
    IF    r.email_origin = 'public_direct'     THEN g4_raw := g4_raw + 15; sigs := array_append(sigs, 'Public email');
    ELSIF r.email_origin = 'enriched_provider' THEN g4_raw := g4_raw + 10; sigs := array_append(sigs, 'Email (enriched)');
    ELSIF r.email_origin = 'manual'            THEN g4_raw := g4_raw + 10; sigs := array_append(sigs, 'Email (manual)');
    END IF;
  END IF;

  IF r.has_contact_form   THEN g4_raw := g4_raw + 8; sigs := array_append(sigs, 'Contact form'); END IF;
  IF r.facebook_url  IS NOT NULL THEN g4_raw := g4_raw + 7; sigs := array_append(sigs, 'Facebook'); END IF;
  IF r.instagram_url IS NOT NULL THEN g4_raw := g4_raw + 5; sigs := array_append(sigs, 'Instagram'); END IF;

  -- G5: Language bonus (max 10)
  IF    r.language_signal = 'es'        THEN g5 := 10; sigs := array_append(sigs, 'Spanish');
  ELSIF r.language_signal = 'bilingual' THEN g5 := 7;  sigs := array_append(sigs, 'Bilingual');
  END IF;

  -- Total con caps por grupo
  total := g1 + g2 + LEAST(g3_raw, 30) + LEAST(g4_raw, 22) + g5;
  total := LEAST(total, 100);

  -- Derivar priority desde score
  prio := CASE
    WHEN total >= 70 THEN 'high'
    WHEN total >= 40 THEN 'medium'
    ELSE 'low'
  END;

  RETURN QUERY SELECT total, sigs, prio;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 8. FUNCIÓN: update_lead_score
-- Recalcula y persiste score + signals + priority en el lead.
-- Llamar después de INSERT o UPDATE de datos del lead.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prospect_update_lead_score(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score    integer;
  v_signals  text[];
  v_priority text;
BEGIN
  SELECT score, signals, priority
    INTO v_score, v_signals, v_priority
    FROM prospect_calculate_lead_score(p_lead_id);

  UPDATE prospect_leads
  SET
    priority_score = v_score,
    score_signals  = v_signals,
    priority       = v_priority,
    updated_at     = now()
  WHERE id = p_lead_id;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 9. FUNCIÓN: check_and_apply_suppression
-- Verifica TODOS los identificadores del lead contra
-- prospect_suppression_list de forma atómica (FOR UPDATE).
-- Si hay match: is_suppressed=true, status='suppressed', score=0.
-- Devuelve true si se encontró supresión.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prospect_check_and_apply_suppression(p_lead_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_suppressed boolean := false;
  v_lead       prospect_leads%ROWTYPE;
BEGIN
  -- Bloquear la fila del lead para que no haya race condition
  SELECT * INTO v_lead
    FROM prospect_leads
    WHERE id = p_lead_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Verificar todos los identificadores disponibles del lead
  SELECT EXISTS (
    SELECT 1 FROM prospect_suppression_list sl
    WHERE
      -- Email exacto
      (sl.identifier_type = 'email'
        AND v_lead.email IS NOT NULL
        AND sl.identifier_value = v_lead.email)
      OR
      -- Dominio del website
      (sl.identifier_type = 'domain'
        AND v_lead.website IS NOT NULL
        AND v_lead.website LIKE '%' || sl.identifier_value || '%')
      OR
      -- Facebook URL exacto
      (sl.identifier_type = 'facebook_url'
        AND v_lead.facebook_url IS NOT NULL
        AND sl.identifier_value = v_lead.facebook_url)
      OR
      -- Instagram URL exacto
      (sl.identifier_type = 'instagram_url'
        AND v_lead.instagram_url IS NOT NULL
        AND sl.identifier_value = v_lead.instagram_url)
      OR
      -- business_name|city|state compuesto
      (sl.identifier_type = 'business_name_city'
        AND sl.identifier_value = v_lead.business_name || '|' || COALESCE(v_lead.city,'') || '|' || COALESCE(v_lead.state,''))
  ) INTO v_suppressed;

  IF v_suppressed THEN
    UPDATE prospect_leads
    SET
      is_suppressed   = true,
      outreach_status = 'suppressed',
      priority_score  = 0,
      score_signals   = ARRAY['Suppressed'],
      priority        = 'low',
      updated_at      = now()
    WHERE id = p_lead_id;
  END IF;

  RETURN v_suppressed;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 10. FUNCIÓN: ingest_lead
-- Punto de entrada para importación.
-- Lógica:
--   1. Deduplicar: busca lead existente por email, website, o
--      business_name+state. Si encuentra → agrega source y retorna.
--   2. Si es nuevo → INSERT lead + source.
--   3. Siempre: check_and_apply_suppression → update_lead_score.
-- Devuelve (lead_id, is_duplicate).
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prospect_ingest_lead(
  p_business_name          text,
  p_trade                  text        DEFAULT NULL,
  p_city                   text        DEFAULT NULL,
  p_state                  char(2)     DEFAULT NULL,
  p_website                text        DEFAULT NULL,
  p_email                  text        DEFAULT NULL,
  p_email_origin           text        DEFAULT NULL,
  p_email_provider         text        DEFAULT NULL,
  p_email_source_url       text        DEFAULT NULL,
  p_phone_public           text        DEFAULT NULL,
  p_phone_source           text        DEFAULT NULL,
  p_facebook_url           text        DEFAULT NULL,
  p_instagram_url          text        DEFAULT NULL,
  p_language_signal        text        DEFAULT NULL,
  p_language_confidence    numeric     DEFAULT NULL,
  p_business_size          text        DEFAULT NULL,
  p_business_size_signals  text        DEFAULT NULL,
  p_uses_software          text        DEFAULT NULL,
  p_uses_software_signals  text        DEFAULT NULL,
  p_website_quality        text        DEFAULT NULL,
  p_has_contact_form       boolean     DEFAULT NULL,
  p_contact_form_url       text        DEFAULT NULL,
  p_source_type            text        DEFAULT 'manual',
  p_source_url             text        DEFAULT NULL,
  p_provider               text        DEFAULT NULL,
  p_raw_business_name      text        DEFAULT NULL,
  p_raw_email              text        DEFAULT NULL,
  p_raw_phone              text        DEFAULT NULL,
  p_raw_address            text        DEFAULT NULL,
  p_raw_website            text        DEFAULT NULL
)
RETURNS TABLE (lead_id uuid, is_duplicate boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_id    uuid;
  v_duplicate  boolean := false;
BEGIN
  -- ── Paso 1: Deduplicación ──────────────────────────────────
  -- Prioridad: email exacto > website exacto > nombre+estado
  SELECT id INTO v_lead_id
    FROM prospect_leads
    WHERE
      (p_email IS NOT NULL AND email = p_email)
      OR (p_website IS NOT NULL AND website = p_website)
      OR (
        lower(trim(business_name)) = lower(trim(p_business_name))
        AND state = p_state
      )
    LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    v_duplicate := true;
  ELSE
    -- ── Paso 2: Insertar nuevo lead ──────────────────────────
    INSERT INTO prospect_leads (
      business_name, trade, city, state,
      website, contact_form_url, has_contact_form,
      email, email_origin, email_provider, email_source_url,
      email_collected_at,
      phone_public, phone_source,
      facebook_url, instagram_url,
      language_signal, language_confidence,
      business_size, business_size_signals,
      uses_software, uses_software_signals,
      website_quality
    ) VALUES (
      p_business_name, p_trade, p_city, p_state,
      p_website, p_contact_form_url, p_has_contact_form,
      p_email, p_email_origin, p_email_provider, p_email_source_url,
      CASE WHEN p_email IS NOT NULL THEN now() ELSE NULL END,
      p_phone_public, p_phone_source,
      p_facebook_url, p_instagram_url,
      p_language_signal, p_language_confidence,
      p_business_size, p_business_size_signals,
      p_uses_software, p_uses_software_signals,
      p_website_quality
    )
    RETURNING id INTO v_lead_id;
  END IF;

  -- ── Paso 3: Registrar fuente (siempre, incluso en duplicado)
  INSERT INTO prospect_lead_sources (
    lead_id, source_type, source_url, provider,
    raw_business_name, raw_email, raw_phone, raw_address, raw_website,
    collected_at
  ) VALUES (
    v_lead_id, p_source_type, p_source_url, p_provider,
    COALESCE(p_raw_business_name, p_business_name),
    p_raw_email, p_raw_phone, p_raw_address, p_raw_website,
    now()
  );

  -- ── Paso 4: Verificar supresión (atómico, incluye el lock)
  PERFORM prospect_check_and_apply_suppression(v_lead_id);

  -- ── Paso 5: Calcular / recalcular score
  PERFORM prospect_update_lead_score(v_lead_id);

  RETURN QUERY SELECT v_lead_id, v_duplicate;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 11. FUNCIÓN: suppress_by_identifier
-- Añade una entrada a suppression_list Y re-verifica todos los
-- leads existentes que coincidan con ese identificador.
-- Atómica: los leads afectados quedan suprimidos de inmediato.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prospect_suppress_by_identifier(
  p_type    text,
  p_value   text,
  p_reason  text,
  p_notes   text    DEFAULT NULL,
  p_by      text    DEFAULT 'manual_operator'
)
RETURNS integer  -- cantidad de leads afectados
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected_id uuid;
  v_count       integer := 0;
BEGIN
  -- Insertar o ignorar si ya existe
  INSERT INTO prospect_suppression_list
    (identifier_type, identifier_value, reason, notes, suppressed_by)
  VALUES
    (p_type, p_value, p_reason, p_notes, p_by)
  ON CONFLICT (identifier_type, identifier_value) DO NOTHING;

  -- Re-verificar todos los leads existentes que podrían matchear
  FOR v_affected_id IN
    SELECT id FROM prospect_leads
    WHERE is_suppressed = false
      AND (
        (p_type = 'email'             AND email         = p_value)
        OR (p_type = 'domain'         AND website LIKE '%' || p_value || '%')
        OR (p_type = 'facebook_url'   AND facebook_url  = p_value)
        OR (p_type = 'instagram_url'  AND instagram_url = p_value)
        OR (p_type = 'business_name_city'
            AND (business_name || '|' || COALESCE(city,'') || '|' || COALESCE(state,'')) = p_value)
      )
  LOOP
    PERFORM prospect_check_and_apply_suppression(v_affected_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 12. TRIGGER: updated_at automático en prospect_leads
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prospect_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER prospect_leads_updated_at
  BEFORE UPDATE ON prospect_leads
  FOR EACH ROW EXECUTE FUNCTION prospect_set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 13. VISTA: prospect_leads_ready
-- Leads elegibles para iniciar outreach por email.
-- Condiciones:
--   • outreach_status = 'ready'       (aprobado explícitamente)
--   • email IS NOT NULL               (hay canal)
--   • email_origin IS NOT NULL        (origen válido)
--   • is_suppressed = false           (no suprimido)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW prospect_leads_ready AS
SELECT *
FROM prospect_leads
WHERE
  outreach_status  = 'ready'
  AND email        IS NOT NULL
  AND email_origin IS NOT NULL
  AND is_suppressed = false;

-- La vista hereda RLS de la tabla subyacente (service role only)


-- ─────────────────────────────────────────────────────────────
-- 14. COMENTARIOS DE DOCUMENTACIÓN
-- ─────────────────────────────────────────────────────────────
COMMENT ON TABLE  prospect_suppression_list IS
  'Fuente de verdad de supresiones. Nunca se elimina automáticamente.';

COMMENT ON TABLE  prospect_leads IS
  'Leads de contractors para prospecting. outreach_status=ready es el gate para contactar.';

COMMENT ON TABLE  prospect_lead_sources IS
  'Trazabilidad multi-fuente. Inmutable: solo INSERT, nunca UPDATE.';

COMMENT ON TABLE  prospect_lead_activities IS
  'Historial de acciones humanas. No incluye call ni sms por decisión de diseño.';

COMMENT ON COLUMN prospect_leads.email IS
  'NULL si no encontrado. Nunca guardar texto "Not found".';

COMMENT ON COLUMN prospect_leads.phone_public IS
  'Informativo únicamente. No es canal de outreach. No participa en scoring.';

COMMENT ON COLUMN prospect_leads.outreach_status IS
  'Gate: solo ready puede iniciar outreach. new→researched→ready es proceso manual.';

COMMENT ON COLUMN prospect_leads.is_suppressed IS
  'Cache denormalizado. Fuente de verdad: prospect_suppression_list.';

COMMENT ON FUNCTION prospect_ingest_lead IS
  'Punto de entrada para importación. Deduplica, registra fuente, verifica supresión, calcula score.';

COMMENT ON FUNCTION prospect_suppress_by_identifier IS
  'Añade supresión y aplica retroactivamente a todos los leads existentes que coincidan.';
