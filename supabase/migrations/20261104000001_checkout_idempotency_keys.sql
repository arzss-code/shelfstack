-- =========================================================================
-- Sprint 5 / Phase 3: Transactional Checkout Idempotency Pattern
-- 1. Table public.order_idempotency_keys (User-Scoped Unique Constraint)
-- 2. Scoped unique constraint: (user_id, idempotency_key)
-- 3. Atomic create_order RPC with transactional lock & payload hash verification
-- =========================================================================

-- 1. Table: order_idempotency_keys
create table if not exists public.order_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  order_id uuid not null references public.orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_order_idempotency_user_key unique (user_id, idempotency_key)
);

-- 2. Indexes for fast user queries and order association
create index if not exists idx_order_idempotency_user_created 
on public.order_idempotency_keys (user_id, created_at desc);

create index if not exists idx_order_idempotency_order_id 
on public.order_idempotency_keys (order_id);

-- 3. Row Level Security (RLS)
alter table public.order_idempotency_keys enable row level security;

-- Customer can read only their own idempotency records
drop policy if exists "owner read idempotency keys" on public.order_idempotency_keys;
create policy "owner read idempotency keys"
on public.order_idempotency_keys for select to authenticated
using (user_id = auth.uid());

-- Admins can view all idempotency audit records
drop policy if exists "admin read idempotency keys" on public.order_idempotency_keys;
create policy "admin read idempotency keys"
on public.order_idempotency_keys for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid() and profiles.role = 'admin'
  )
);

-- Deny direct client mutations (must be created atomically via create_order RPC)
drop policy if exists "deny client mutations on idempotency keys" on public.order_idempotency_keys;
create policy "deny client mutations on idempotency keys"
on public.order_idempotency_keys for insert to authenticated
with check (false);

-- 4. Atomic create_order RPC with Idempotency Support
drop function if exists public.create_order(jsonb, jsonb);

create or replace function public.create_order(
  p_items jsonb,
  p_address jsonb,
  p_idempotency_key text default null,
  p_request_hash text default null
)
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
  v_existing_order uuid;
  v_existing_hash text;
  v_lock_key bigint;
begin
  -- 1. Pastikan pemanggil terautentikasi
  if auth.uid() is null then
    raise exception 'Unauthorized: Pengguna harus login untuk membuat pesanan';
  end if;

  -- 2. Validasi keranjang tidak kosong
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang belanja kosong';
  end if;

  -- 3. Pengecekan Idempotensi & Kunci Transaksi Deterministik
  if p_idempotency_key is not null and p_idempotency_key <> '' then
    -- Advisory lock transaksional terisolasi per (user_id, idempotency_key)
    -- Mengantrekan (serialize) request concurrent yang menggunakan kunci yang sama untuk user yang sama
    v_lock_key := ('x' || substr(md5(auth.uid()::text || ':' || p_idempotency_key), 1, 16))::bit(64)::bigint;
    perform pg_advisory_xact_lock(v_lock_key);

    -- Cek apakah order dengan key ini sudah pernah sukses dibuat sebelumnya
    select order_id, request_hash into v_existing_order, v_existing_hash
    from public.order_idempotency_keys
    where user_id = auth.uid() and idempotency_key = p_idempotency_key;

    if found then
      -- Case B: Same key + different payload -> IDEMPOTENCY_CONFLICT!
      if p_request_hash is not null and v_existing_hash <> p_request_hash then
        raise exception 'IDEMPOTENCY_CONFLICT: Idempotency-Key "%" telah digunakan untuk transaksi dengan rincian berbeda', p_idempotency_key;
      end if;

      -- Case A: Same key + same payload -> Idempotent Replay!
      return v_existing_order;
    end if;
  end if;

  -- 4. Inisialisasi draft order
  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  -- Set session variables untuk audit trigger (stock_movements)
  perform set_config('app.stock_change_reason', 'checkout', true);
  perform set_config('app.stock_change_order_id', v_order::text, true);

  -- 5. Kunci baris produk dengan urutan deterministik (ORDER BY product_id ASC FOR UPDATE)
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

  -- 6. Update total akhir pesanan
  update public.orders
  set total_cents = v_total
  where id = v_order;

  -- 7. Simpan Idempotency Record (jika key disediakan)
  if p_idempotency_key is not null and p_idempotency_key <> '' then
    insert into public.order_idempotency_keys (
      user_id,
      idempotency_key,
      request_hash,
      order_id
    ) values (
      auth.uid(),
      p_idempotency_key,
      coalesce(p_request_hash, ''),
      v_order
    );
  end if;

  return v_order;
end;
$$;

grant execute on function public.create_order(jsonb, jsonb, text, text) to authenticated;
