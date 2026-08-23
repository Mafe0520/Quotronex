-- ============================================================
-- Migración 001 — Tablas de admin de Quotronex
-- Correr en Supabase SQL Editor con rol superuser/service role
-- ============================================================

-- Admin users — solo los que pueden entrar al backoffice de Quotronex.
-- NO tiene relación con los roles de los contractors (owner/estimator/etc).
create table if not exists admin_users (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('superadmin', 'support')),
  created_at  timestamptz not null default now(),
  constraint admin_users_user_id_key unique (user_id)
);

-- RLS: solo service role puede leer/escribir. Ningún usuario autenticado normal.
alter table admin_users enable row level security;

create policy "admin_users: service role only"
  on admin_users
  using (false);   -- bloquea TODO acceso vía anon/authenticated

-- Admin audit log — inmutable. Solo INSERT permitido.
create table if not exists admin_audit_log (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  admin_user_id   uuid not null references admin_users(id),
  action          text not null,
  target_type     text not null,
  target_id       text,
  before_json     jsonb,
  after_json      jsonb
);

alter table admin_audit_log enable row level security;

create policy "admin_audit_log: service role only"
  on admin_audit_log
  using (false);

-- ============================================================
-- Insertar tu cuenta como superadmin.
-- Reemplaza con tu user_id real de Supabase Auth.
-- ============================================================
-- insert into admin_users (user_id, email, role)
-- values ('<tu-user-id-de-supabase>', 'mafepa05@gmail.com', 'superadmin');
