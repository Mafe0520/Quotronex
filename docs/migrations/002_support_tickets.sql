-- Support tickets table
create table if not exists support_tickets (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  subject      text not null,
  status       text not null default 'open' check (status in ('open', 'waiting_on_admin', 'waiting_on_user', 'resolved', 'closed')),
  priority     text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

-- Messages within a ticket
create table if not exists support_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references support_tickets(id) on delete cascade,
  sender     text not null check (sender in ('user', 'admin')),
  body       text not null,
  created_at timestamptz not null default now()
);

-- RLS: contractors can only see their own tickets
alter table support_tickets enable row level security;
alter table support_messages enable row level security;

-- Contractors access their own business tickets
create policy "contractors_own_tickets" on support_tickets
  for all using (
    business_id in (
      select business_id from business_members where user_id = auth.uid()
    )
  );

create policy "contractors_own_messages" on support_messages
  for all using (
    ticket_id in (
      select id from support_tickets where business_id in (
        select business_id from business_members where user_id = auth.uid()
      )
    )
  );

-- Admin reads ALL via service role (bypasses RLS) — no additional policy needed

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger support_tickets_updated_at
  before update on support_tickets
  for each row execute function update_updated_at();
