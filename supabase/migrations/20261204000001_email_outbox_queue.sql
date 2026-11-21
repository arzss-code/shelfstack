-- Migration: 20261204000001_email_outbox_queue.sql
-- Purpose: Persistent transactional email outbox queue and audit trail for orders and support messages.

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_email_outbox_status_created on public.email_outbox (status, created_at);
create index if not exists idx_email_outbox_recipient on public.email_outbox (recipient);

alter table public.email_outbox enable row level security;

-- Admin & Service Role policies
drop policy if exists "email_outbox_admin_select" on public.email_outbox;
create policy "email_outbox_admin_select" on public.email_outbox
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "email_outbox_admin_all" on public.email_outbox;
create policy "email_outbox_admin_all" on public.email_outbox
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
