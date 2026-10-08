-- =========================================================================
-- Sprint 5 / Phase 2: Relational Architecture & Inventory Ledger Pattern
-- 1. Table public.stock_movements (Immutable Audit Trail)
-- 2. Anti-tamper database triggers on public.products (Insert & Update)
-- 3. Automatic context propagation in create_order, cancel_order, & handle_payment_webhook
-- =========================================================================

-- 1. Create stock_movements table
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  delta int not null,
  balance_after int not null,
  reason text not null,
  order_id uuid null references public.orders(id) on delete set null,
  notes text null,
  created_at timestamptz not null default now()
);

-- 2. Indexes for high performance audit queries
create index if not exists idx_stock_movements_product 
on public.stock_movements (product_id, created_at desc);

create index if not exists idx_stock_movements_order 
on public.stock_movements (order_id)
where order_id is not null;

create index if not exists idx_stock_movements_reason
on public.stock_movements (reason);

-- 3. Row Level Security (RLS)
alter table public.stock_movements enable row level security;

-- Admin can view stock movements audit trail
drop policy if exists "Admins can view stock movements" on public.stock_movements;
create policy "Admins can view stock movements"
on public.stock_movements
for select
using (
  exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid() and profiles.role = 'admin'
  )
);

-- Direct client modifications are strictly prohibited (Insert/Update/Delete only via database triggers & RPC)
drop policy if exists "Deny client mutations on stock movements" on public.stock_movements;
create policy "Deny client mutations on stock movements"
on public.stock_movements
for insert
with check (false);

-- 4. Trigger Function: Record Stock Movements on Update
create or replace function public.trg_record_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta int;
  v_reason text;
  v_order_id_str text;
  v_order_id uuid := null;
begin
  if (old.stock is distinct from new.stock) then
    v_delta := new.stock - old.stock;
    v_reason := coalesce(nullif(current_setting('app.stock_change_reason', true), ''), 'manual_adjustment');
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
      order_id
    ) values (
      new.id,
      v_delta,
      new.stock,
      v_reason,
      v_order_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_products_stock_audit on public.products;
create trigger trg_products_stock_audit
after update on public.products
for each row
execute function public.trg_record_stock_movement();

-- 5. Trigger Function: Record Initial Stock on New Product Insert
create or replace function public.trg_record_product_initial_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.stock > 0) then
    insert into public.stock_movements (
      product_id,
      delta,
      balance_after,
      reason,
      order_id
    ) values (
      new.id,
      new.stock,
      new.stock,
      'initial_inventory',
      null
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_initial_stock_audit on public.products;
create trigger trg_products_initial_stock_audit
after insert on public.products
for each row
execute function public.trg_record_product_initial_stock();

-- 6. Propagate Session Context in create_order (Checkout Reason)
create or replace function public.create_order(p_items jsonb, p_address jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_total int := 0;
  r record;
  v_price int;
  v_stock int;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized: Pengguna harus login untuk membuat pesanan';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang belanja kosong';
  end if;

  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  -- Set session variables for audit trigger
  perform set_config('app.stock_change_reason', 'checkout', true);
  perform set_config('app.stock_change_order_id', v_order::text, true);

  for r in 
    select product_id, qty 
    from jsonb_to_recordset(p_items) as (product_id bigint, qty int)
    order by product_id asc 
  loop
    if r.qty <= 0 then
      raise exception 'Kuantitas tidak valid untuk produk ID %', r.product_id;
    end if;

    select price_cents, stock into v_price, v_stock
    from public.products
    where id = r.product_id and deleted_at is null
    for update;

    if not found then
      raise exception 'Produk ID % tidak ditemukan atau sudah dihapus', r.product_id;
    end if;

    if v_stock < r.qty then
      raise exception 'Stok tidak mencukupi untuk produk ID % (sisa: %, diminta: %)', r.product_id, v_stock, r.qty;
    end if;

    update public.products
    set stock = stock - r.qty
    where id = r.product_id;

    insert into public.order_items (order_id, product_id, qty, price_cents)
    values (v_order, r.product_id, r.qty, v_price);

    v_total := v_total + (v_price * r.qty);
  end loop;

  update public.orders
  set total_cents = v_total
  where id = v_order;

  return v_order;
end;
$$;

-- 7. Propagate Session Context in cancel_order (Order Cancellation Restock)
create or replace function public.cancel_order(p_order_id uuid, p_reason text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  r record;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized: Sesi login tidak ditemukan';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if v_order.user_id <> auth.uid() then
    if not exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid() and profiles.role = 'admin'
    ) then
      raise exception 'Forbidden: Anda tidak berhak membatalkan pesanan ini';
    end if;
  end if;

  if v_order.status <> 'pending' then
    raise exception 'Hanya pesanan pending yang dapat dibatalkan (status saat ini: %)', v_order.status;
  end if;

  -- Set session variables for audit trigger
  perform set_config('app.stock_change_reason', 'order_cancellation', true);
  perform set_config('app.stock_change_order_id', p_order_id::text, true);

  -- Restock items
  for r in
    select product_id, qty
    from public.order_items
    where order_id = p_order_id
  loop
    update public.products
    set stock = stock + r.qty
    where id = r.product_id;
  end loop;

  update public.orders
  set 
    status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = p_reason,
    updated_at = now()
  where id = p_order_id;

  return 'Pesanan berhasil dibatalkan dan stok telah dikembalikan ke etalase.';
end;
$$;

-- 8. Propagate Session Context in handle_payment_webhook (Webhook Auto-Restock)
create or replace function public.handle_payment_webhook(
  p_order_id uuid,
  p_target_status text,
  p_payment_type text default null,
  p_midtrans_id text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
  r record;
begin
  select status into v_current_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return 'ORDER_NOT_FOUND';
  end if;

  if v_current_status = 'cancelled' and p_target_status = 'paid' then
    insert into public.activity_logs (
      action,
      entity_type,
      entity_id,
      description,
      new_data
    ) values (
      'update',
      'orders',
      0,
      'CONFLICT: Webhook paid diterima untuk order yang sudah cancelled (Refund Required)',
      jsonb_build_object(
        'order_id', p_order_id,
        'midtrans_id', p_midtrans_id,
        'payment_type', p_payment_type
      )
    );
    return 'CONFLICT_ALREADY_CANCELLED';
  end if;

  if v_current_status = p_target_status then
    return 'NO_CHANGE_ALREADY_' || v_current_status;
  end if;

  if v_current_status = 'paid' and p_target_status <> 'paid' then
    return 'IGNORED_ORDER_ALREADY_PAID';
  end if;

  -- Jika status pending berubah menjadi cancelled / expire, kembalikan stok
  if v_current_status = 'pending' and p_target_status = 'cancelled' then
    perform set_config('app.stock_change_reason', 'webhook_expire_restock', true);
    perform set_config('app.stock_change_order_id', p_order_id::text, true);

    for r in
      select product_id, qty
      from public.order_items
      where order_id = p_order_id
    loop
      update public.products
      set stock = stock + r.qty
      where id = r.product_id;
    end loop;
  end if;

  update public.orders
  set
    status = p_target_status,
    payment_type = coalesce(p_payment_type, payment_type),
    midtrans_id = coalesce(p_midtrans_id, midtrans_id),
    paid_at = case when p_target_status = 'paid' then now() else paid_at end,
    cancelled_at = case when p_target_status = 'cancelled' then now() else cancelled_at end,
    cancellation_reason = case when p_target_status = 'cancelled' and cancellation_reason is null then 'Otomatis dibatalkan oleh Payment Gateway (Expired / Denied)' else cancellation_reason end,
    updated_at = now()
  where id = p_order_id;

  return 'UPDATED_TO_' || p_target_status;
end;
$$;
