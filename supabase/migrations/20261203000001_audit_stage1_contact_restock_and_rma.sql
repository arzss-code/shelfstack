-- =========================================================================
-- MIGRATION: 20261203000001_audit_stage1_contact_restock_and_rma.sql
-- DESCRIPTION: Stage 1 remediation for contact message persistence,
--              soft-delete readiness on categories & flash_deals,
--              atomic admin_restock_product RPC with ledger notes, and
--              complete RMA refund settlement (refunds + coins clawback).
-- =========================================================================

set search_path = public, pg_temp;

-- =========================================================================
-- 1. TABEL PUBLIC.CONTACT_MESSAGES (PERSISTENSI FORMULIR KONTAK)
-- =========================================================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  user_id uuid null references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  category text not null,
  order_number text null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  admin_notes text null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_contact_messages_status_created
  on public.contact_messages (status, created_at desc)
  where deleted_at is null;

create index if not exists idx_contact_messages_ticket_code
  on public.contact_messages (ticket_code);

alter table public.contact_messages enable row level security;

drop policy if exists "admins full access contact_messages" on public.contact_messages;
create policy "admins full access contact_messages"
  on public.contact_messages for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "service role full access contact_messages" on public.contact_messages;
create policy "service role full access contact_messages"
  on public.contact_messages for all to service_role
  using (true)
  with check (true);

-- =========================================================================
-- 2. SOFT-DELETE READINESS UNTUK CATEGORIES & FLASH_DEALS
-- =========================================================================
alter table public.categories
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz null;

alter table public.flash_deals
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz null;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories"
  on public.categories for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists "allow read active flash deals" on public.flash_deals;
create policy "allow read active flash deals"
  on public.flash_deals for select to anon, authenticated
  using (is_active = true and deleted_at is null);

-- =========================================================================
-- 3. TRIGGER STOK LEDGER DENGAN CATATAN + RPC ADMIN_RESTOCK_PRODUCT
-- =========================================================================
create or replace function public.trg_record_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_delta int;
  v_reason text;
  v_notes text;
  v_order_id_str text;
  v_order_id uuid := null;
begin
  if (old.stock is distinct from new.stock) then
    v_delta := new.stock - old.stock;
    v_reason := coalesce(nullif(current_setting('app.stock_change_reason', true), ''), 'manual_adjustment');
    v_notes := nullif(trim(coalesce(current_setting('app.stock_change_notes', true), '')), '');
    v_order_id_str := current_setting('app.stock_change_order_id', true);

    if v_order_id_str is not null and v_order_id_str <> '' then
      begin
        v_order_id := v_order_id_str::uuid;
      exception when others then
        v_order_id := null;
      end;
    end if;

    insert into public.stock_movements (
      product_id,
      delta,
      balance_after,
      reason,
      order_id,
      notes
    ) values (
      new.id,
      v_delta,
      new.stock,
      v_reason,
      v_order_id,
      v_notes
    );
  end if;

  return new;
end;
$$;

create or replace function public.admin_restock_product(
  p_product_id bigint,
  p_quantity int,
  p_notes text default null,
  p_variant_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product record;
  v_variant record;
  v_previous_stock int;
  v_new_stock int;
  v_clean_notes text := nullif(trim(coalesce(p_notes, '')), '');
begin
  if (auth.uid() is not null and not public.is_admin())
     or (auth.uid() is null and current_setting('role', true) in ('authenticated', 'anon')) then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang berhak menambah stok';
  end if;

  if p_quantity is null or p_quantity <= 0 or p_quantity > 10000 then
    raise exception 'INVALID_RESTOCK_QUANTITY: Jumlah restock harus antara 1 sampai 10000 unit';
  end if;

  select id, name, sku, stock
  into v_product
  from public.products
  where id = p_product_id and deleted_at is null
  for update;

  if not found then
    raise exception 'PRODUCT_NOT_FOUND: Produk tidak ditemukan di database';
  end if;

  if p_variant_id is not null then
    select id, sku, name, stock
    into v_variant
    from public.product_variants
    where id = p_variant_id
      and product_id = p_product_id
      and deleted_at is null
    for update;

    if not found then
      raise exception 'VARIANT_NOT_FOUND: Varian produk tidak ditemukan di database';
    end if;

    update public.product_variants
    set stock = coalesce(stock, 0) + p_quantity,
        updated_at = now()
    where id = p_variant_id;
  end if;

  v_previous_stock := coalesce(v_product.stock, 0);
  v_new_stock := v_previous_stock + p_quantity;

  perform set_config('app.stock_change_reason', 'manual_adjustment', true);
  perform set_config('app.stock_change_notes', coalesce(v_clean_notes, ''), true);

  update public.products
  set stock = v_new_stock
  where id = p_product_id;

  begin
    insert into public.activity_logs (
      entity_type,
      entity_id,
      action,
      description,
      old_data,
      new_data
    ) values (
      'products',
      p_product_id::int,
      'UPDATE'::public.activity_action,
      'Restock cepat produk ' || v_product.name || ' (+' || p_quantity::text || ' unit)',
      jsonb_build_object('stock', v_previous_stock, 'variant_id', p_variant_id),
      jsonb_build_object('stock', v_new_stock, 'variant_id', p_variant_id, 'notes', v_clean_notes)
    );
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'product_id', p_product_id,
    'product_name', v_product.name,
    'variant_id', p_variant_id,
    'previous_stock', v_previous_stock,
    'added_quantity', p_quantity,
    'new_stock', v_new_stock
  );
end;
$$;

revoke all on function public.admin_restock_product(bigint, int, text, uuid) from public, anon;
grant execute on function public.admin_restock_product(bigint, int, text, uuid) to authenticated, service_role;

-- =========================================================================
-- 4. UPGRADE ADMIN_REVIEW_RETURN_REQUEST: REFUND SETTLEMENT, COINS, & SOLD_COUNT
-- =========================================================================
create or replace function public.admin_review_return_request(
  p_return_id uuid,
  p_status text,
  p_admin_notes text default null,
  p_replacement_courier text default null,
  p_replacement_tracking_number text default null,
  p_refund_amount_cents int default null,
  p_restock_inventory boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ticket public.return_requests%rowtype;
  v_order public.orders%rowtype;
  v_updated public.return_requests%rowtype;
  v_now timestamptz := now();
  v_restocked_at timestamptz;
  v_resolved_at timestamptz;
  v_refund_cents int;
  v_refund_key text;
  v_new_coin_balance bigint;
  v_clawback_coins bigint := 0;
  r record;
begin
  if (auth.uid() is not null and not public.is_admin())
     or (auth.uid() is null and current_setting('role', true) in ('authenticated', 'anon')) then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang dapat meninjau tiket retur';
  end if;

  if p_status not in ('approved', 'rejected', 'item_received', 'completed') then
    raise exception 'INVALID_RETURN_STATUS: Status keputusan retur tidak valid: %', p_status;
  end if;

  select * into v_ticket
  from public.return_requests
  where id = p_return_id and deleted_at is null
  for update;

  if not found then
    raise exception 'RETURN_NOT_FOUND: Tiket retur tidak ditemukan';
  end if;

  if v_ticket.status in ('rejected', 'cancelled') and v_ticket.status <> p_status then
    raise exception 'INVALID_RETURN_TRANSITION: Tiket retur dalam status % tidak dapat diubah lagi', v_ticket.status;
  end if;

  if v_ticket.status = 'completed' and p_status <> 'completed' then
    raise exception 'INVALID_RETURN_TRANSITION: Tiket retur yang sudah selesai tidak dapat dikembalikan ke %', p_status;
  end if;

  select * into v_order
  from public.orders
  where id = v_ticket.order_id
  for update;

  v_restocked_at := v_ticket.restocked_at;
  if p_status = 'completed' and p_restock_inventory and v_ticket.restocked_at is null then
    perform set_config('app.stock_change_reason', 'return_restock', true);
    perform set_config('app.stock_change_order_id', v_ticket.order_id::text, true);
    perform set_config('app.stock_change_notes', 'Restock retur #' || substr(v_ticket.id::text, 1, 8), true);

    for r in
      select product_id, variant_id, qty
      from public.order_items
      where order_id = v_ticket.order_id
      order by product_id asc, variant_id nulls last
    loop
      update public.products
      set stock = stock + r.qty,
          sold_count = greatest(0, coalesce(sold_count, 0) - r.qty)
      where id = r.product_id;

      if r.variant_id is not null then
        update public.product_variants
        set stock = stock + r.qty,
            updated_at = v_now
        where id = r.variant_id;
      end if;
    end loop;

    v_restocked_at := v_now;
  end if;

  -- Akuntansi & settlement saat tiket bertipe refund diselesaikan
  if p_status = 'completed' and v_ticket.status <> 'completed' and v_ticket.solution_type = 'refund' and v_order.id is not null then
    v_refund_cents := coalesce(p_refund_amount_cents, v_ticket.refund_amount_cents, v_order.total_cents);
    v_refund_key := 'rma-refund-' || v_ticket.id::text;

    if v_refund_cents > 0 then
      insert into public.refunds (
        order_id,
        user_id,
        amount_cents,
        currency,
        gateway,
        status,
        idempotency_key,
        reason,
        processed_at,
        bank_confirmed_at
      ) values (
        v_order.id,
        v_order.user_id,
        v_refund_cents,
        'IDR',
        'rma_settlement',
        'succeeded',
        v_refund_key,
        coalesce(nullif(trim(p_admin_notes), ''), 'Penyelesaian retur dana #' || substr(v_ticket.id::text, 1, 8)),
        v_now,
        v_now
      )
      on conflict (idempotency_key) do nothing;
    end if;

    -- Kembalikan koin yang dipakai saat checkout jika belum pernah dikembalikan
    if coalesce(v_order.coins_used, 0) > 0 and not exists (
      select 1 from public.coin_transactions
      where order_id = v_order.id and type in ('refunded_order', 'cancelled_order')
    ) then
      update public.user_coins
      set balance_coins = balance_coins + v_order.coins_used,
          lifetime_spent_coins = greatest(0, lifetime_spent_coins - v_order.coins_used),
          updated_at = v_now
      where user_id = v_order.user_id
      returning balance_coins into v_new_coin_balance;

      if found then
        insert into public.coin_transactions (
          user_id, type, amount_coins, balance_after, order_id, description
        ) values (
          v_order.user_id,
          'refunded_order',
          v_order.coins_used,
          v_new_coin_balance,
          v_order.id,
          'Pengembalian ' || v_order.coins_used::text || ' Koin dari retur pesanan #' || substr(v_order.id::text, 1, 8)
        );
      end if;
    end if;

    -- Tarik kembali cashback 1% (coins_earned) secara aman dan idempoten
    if coalesce(v_order.coins_earned, 0) > 0 and exists (
      select 1 from public.coin_transactions
      where order_id = v_order.id and type = 'earned'
    ) and not exists (
      select 1 from public.coin_transactions
      where order_id = v_order.id
        and type = 'spent'
        and description like 'Penyesuaian cashback retur%'
    ) then
      select balance_coins into v_new_coin_balance
      from public.user_coins
      where user_id = v_order.user_id
      for update;

      if found and v_new_coin_balance > 0 then
        v_clawback_coins := least(v_new_coin_balance, v_order.coins_earned);

        update public.user_coins
        set balance_coins = balance_coins - v_clawback_coins,
            lifetime_earned_coins = greatest(0, lifetime_earned_coins - v_clawback_coins),
            updated_at = v_now
        where user_id = v_order.user_id
        returning balance_coins into v_new_coin_balance;

        if v_clawback_coins > 0 then
          insert into public.coin_transactions (
            user_id, type, amount_coins, balance_after, order_id, description
          ) values (
            v_order.user_id,
            'spent',
            v_clawback_coins,
            v_new_coin_balance,
            v_order.id,
            'Penyesuaian cashback retur #' || substr(v_ticket.id::text, 1, 8)
          );
        end if;
      end if;
    end if;
  end if;

  v_resolved_at := case
    when p_status in ('completed', 'rejected') then coalesce(v_ticket.resolved_at, v_now)
    else v_ticket.resolved_at
  end;

  update public.return_requests
  set status = p_status,
      admin_notes = coalesce(nullif(trim(p_admin_notes), ''), admin_notes),
      replacement_courier = coalesce(nullif(trim(p_replacement_courier), ''), replacement_courier),
      replacement_tracking_number = coalesce(nullif(trim(p_replacement_tracking_number), ''), replacement_tracking_number),
      refund_amount_cents = coalesce(p_refund_amount_cents, refund_amount_cents),
      restocked_at = v_restocked_at,
      resolved_at = v_resolved_at,
      updated_at = v_now
  where id = p_return_id
  returning * into v_updated;

  return to_jsonb(v_updated);
end;
$$;

revoke all on function public.admin_review_return_request(uuid, text, text, text, text, int, boolean) from public, anon;
grant execute on function public.admin_review_return_request(uuid, text, text, text, text, int, boolean) to authenticated, service_role;
