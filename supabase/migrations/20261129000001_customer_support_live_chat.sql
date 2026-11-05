-- =========================================================================
-- MIGRATION: 20261129000001_customer_support_live_chat.sql
-- DESCRIPTION: Modul Layanan Bantuan Langsung Pelanggan (Customer Support Live Chat)
--              Tabel support_threads, support_messages, trigger auto-counter,
--              RLS multi-tenant terisolasi, bucket storage chat-attachments,
--              dan registrasi publikasi Supabase Realtime.
-- AUTHOR: AA (Talenavi Engineering Standard)
-- =========================================================================

-- 1. TABEL SUPPORT_THREADS
create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'waiting_admin', 'waiting_customer', 'resolved')),
  last_message_text text,
  last_message_at timestamptz default now(),
  unread_by_customer_count integer not null default 0 check (unread_by_customer_count >= 0),
  unread_by_admin_count integer not null default 0 check (unread_by_admin_count >= 0),
  attached_order_id uuid references public.orders(id) on delete set null,
  attached_product_id bigint references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 2. TABEL SUPPORT_MESSAGES
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'admin', 'system')),
  sender_id uuid references auth.users(id) on delete set null,
  message_text text not null check (char_length(trim(message_text)) >= 1 and char_length(message_text) <= 1000),
  attachment_url text,
  attachment_type text check (attachment_type is null or attachment_type in ('image', 'order_card', 'product_card')),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 3. INDEXES UNTUK PERFORMA KUERI
create index if not exists idx_support_threads_customer_id on public.support_threads(customer_id);
create index if not exists idx_support_threads_status on public.support_threads(status) where deleted_at is null;
create index if not exists idx_support_threads_last_message_at on public.support_threads(last_message_at desc);
create index if not exists idx_support_threads_attached_order_id on public.support_threads(attached_order_id) where attached_order_id is not null;
create index if not exists idx_support_threads_attached_product_id on public.support_threads(attached_product_id) where attached_product_id is not null;

-- Indeks unik parsial: Memastikan hanya ada tepat 1 thread aktif per pelanggan
create unique index if not exists idx_unique_active_thread_per_customer
on public.support_threads(customer_id)
where deleted_at is null;

-- Indeks pesan percakapan
create index if not exists idx_support_messages_thread_created on public.support_messages(thread_id, created_at asc) where deleted_at is null;
create index if not exists idx_support_messages_thread_unread on public.support_messages(thread_id, is_read) where is_read = false and deleted_at is null;
create index if not exists idx_support_messages_sender_id on public.support_messages(sender_id) where sender_id is not null;

-- 4. TRIGGER FUNCTION UNTUK ATOMIK UNREAD COUNTER & LAST MESSAGE SYNC
create or replace function public.trg_handle_support_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is not null then
    return new;
  end if;

  if new.sender_type = 'customer' then
    update public.support_threads
    set
      last_message_text = coalesce(nullif(trim(new.message_text), ''), case
        when new.attachment_type = 'order_card' then '[Kartu Pesanan]'
        when new.attachment_type = 'product_card' then '[Kartu Produk]'
        when new.attachment_url is not null then '[Lampiran Gambar]'
        else '[Pesan]'
      end),
      last_message_at = coalesce(new.created_at, now()),
      unread_by_admin_count = unread_by_admin_count + 1,
      status = case when status = 'resolved' then 'open' else 'waiting_admin' end,
      updated_at = now()
    where id = new.thread_id;
  elsif new.sender_type = 'admin' then
    update public.support_threads
    set
      last_message_text = coalesce(nullif(trim(new.message_text), ''), case
        when new.attachment_type = 'order_card' then '[Kartu Pesanan]'
        when new.attachment_type = 'product_card' then '[Kartu Produk]'
        when new.attachment_url is not null then '[Lampiran Gambar]'
        else '[Pesan]'
      end),
      last_message_at = coalesce(new.created_at, now()),
      unread_by_customer_count = unread_by_customer_count + 1,
      status = 'waiting_customer',
      updated_at = now()
    where id = new.thread_id;
  elsif new.sender_type = 'system' then
    update public.support_threads
    set
      last_message_text = coalesce(nullif(trim(new.message_text), ''), '[Pesan Sistem]'),
      last_message_at = coalesce(new.created_at, now()),
      updated_at = now()
    where id = new.thread_id;
  end if;

  return new;
end;
$$;

revoke all on function public.trg_handle_support_message_insert() from public, anon, authenticated;

drop trigger if exists trg_support_message_insert on public.support_messages;
create trigger trg_support_message_insert
after insert on public.support_messages
for each row
execute function public.trg_handle_support_message_insert();

-- 5. ROW LEVEL SECURITY (RLS)
alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

-- 5.a Policy support_threads
drop policy if exists "owners and admins can read support_threads" on public.support_threads;
create policy "owners and admins can read support_threads"
on public.support_threads for select to authenticated
using ((customer_id = auth.uid() and deleted_at is null) or public.is_admin());

drop policy if exists "owners and admins can insert support_threads" on public.support_threads;
create policy "owners and admins can insert support_threads"
on public.support_threads for insert to authenticated
with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists "owners and admins can update support_threads" on public.support_threads;
create policy "owners and admins can update support_threads"
on public.support_threads for update to authenticated
using (customer_id = auth.uid() or public.is_admin())
with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists "admins can delete support_threads" on public.support_threads;
create policy "admins can delete support_threads"
on public.support_threads for delete to authenticated
using (public.is_admin());

-- 5.b Policy support_messages
drop policy if exists "thread participants and admins can read support_messages" on public.support_messages;
create policy "thread participants and admins can read support_messages"
on public.support_messages for select to authenticated
using (
  (
    deleted_at is null
    and exists (
      select 1 from public.support_threads t
      where t.id = support_messages.thread_id
        and t.customer_id = auth.uid()
        and t.deleted_at is null
    )
  )
  or public.is_admin()
);

drop policy if exists "thread participants and admins can insert support_messages" on public.support_messages;
create policy "thread participants and admins can insert support_messages"
on public.support_messages for insert to authenticated
with check (
  (
    sender_type = 'customer'
    and sender_id = auth.uid()
    and exists (
      select 1 from public.support_threads t
      where t.id = thread_id
        and t.customer_id = auth.uid()
        and t.deleted_at is null
    )
  )
  or
  (
    public.is_admin()
    and sender_type in ('admin', 'system')
  )
);

drop policy if exists "thread participants and admins can update support_messages" on public.support_messages;
create policy "thread participants and admins can update support_messages"
on public.support_messages for update to authenticated
using (
  exists (
    select 1 from public.support_threads t
    where t.id = support_messages.thread_id
      and (t.customer_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.support_threads t
    where t.id = support_messages.thread_id
      and (t.customer_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "admins can delete support_messages" on public.support_messages;
create policy "admins can delete support_messages"
on public.support_messages for delete to authenticated
using (public.is_admin());

-- 6. PERMISSION GRANTS & REVOKES
revoke all on public.support_threads from anon, public;
revoke all on public.support_messages from anon, public;

grant select, insert, update, delete on public.support_threads to authenticated;
grant all on public.support_threads to service_role;

grant select, insert, update, delete on public.support_messages to authenticated;
grant all on public.support_messages to service_role;

-- 7. KONFIGURASI BUCKET STORAGE: chat-attachments
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit'
  ) then
    update storage.buckets
    set
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
    where id = 'chat-attachments';
  end if;
end $$;

-- Storage RLS: Pengguna mengelola berkas pada folder user_id miliknya, admin mengelola semua
drop policy if exists "users manage own chat attachments" on storage.objects;
create policy "users manage own chat attachments"
on storage.objects for all to authenticated
using (bucket_id = 'chat-attachments' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
with check (bucket_id = 'chat-attachments' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Akses publik untuk membaca pratinjau gambar obrolan
drop policy if exists "public view chat attachments" on storage.objects;
create policy "public view chat attachments"
on storage.objects for select to public
using (bucket_id = 'chat-attachments');

-- 8. REGISTRASI SUPABASE REALTIME & REPLICA IDENTITY
alter table public.support_threads replica identity full;
alter table public.support_messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'support_threads'
  ) then
    alter publication supabase_realtime add table public.support_threads;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'support_messages'
  ) then
    alter publication supabase_realtime add table public.support_messages;
  end if;
end $$;
