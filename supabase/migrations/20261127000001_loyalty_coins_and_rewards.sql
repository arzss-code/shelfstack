-- Sprint 9: Sistem Poin & Koin Belanja (ShelfStack Coins & Loyalty Rewards)
-- 1. Tabel public.user_coins (Saldo koin per user)
-- 2. Tabel public.coin_transactions (Ledger audit mutasi koin double-entry)
-- 3. Kolom koin pada public.orders (coins_used, coins_discount_cents, coins_earned)
-- 4. Kolom coin_cost pada public.coupons
-- 5. RPC claim_welcome_coins (Bonus sambutan 10.000 Koin)
-- 6. RPC exchange_coins_for_voucher (Penukaran koin ke voucher dompet)
-- 7. Update RPC create_order (Deduction koin saat checkout)
-- 8. Update RPC cancel_order (Refund koin saat order batal)
-- 9. Update RPC transition_order_status (Award 1% koin saat order completed)

-- =========================================================================
-- 1. TABEL PUBLIC.USER_COINS
-- =========================================================================
create table if not exists public.user_coins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_coins bigint not null default 0 check (balance_coins >= 0),
  lifetime_earned_coins bigint not null default 0 check (lifetime_earned_coins >= 0),
  lifetime_spent_coins bigint not null default 0 check (lifetime_spent_coins >= 0),
  has_claimed_welcome boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_coins enable row level security;

drop policy if exists "allow user read own coins" on public.user_coins;
create policy "allow user read own coins"
on public.user_coins for select
to authenticated
using ((select auth.uid()) = user_id);

-- =========================================================================
-- 2. TABEL PUBLIC.COIN_TRANSACTIONS
-- =========================================================================
create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('earned', 'spent', 'redeemed_voucher', 'welcome_bonus', 'refunded_order', 'cancelled_order')),
  amount_coins bigint not null check (amount_coins > 0),
  balance_after bigint not null check (balance_after >= 0),
  order_id uuid references public.orders(id) on delete set null,
  coupon_id uuid references public.coupons(id) on delete set null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_coin_transactions_user_date 
on public.coin_transactions (user_id, created_at desc);

create index if not exists idx_coin_transactions_order 
on public.coin_transactions (order_id);

alter table public.coin_transactions enable row level security;

drop policy if exists "allow user read own coin transactions" on public.coin_transactions;
create policy "allow user read own coin transactions"
on public.coin_transactions for select
to authenticated
using ((select auth.uid()) = user_id);

-- =========================================================================
-- 3. KOLOM PADA ORDERS & COUPONS
-- =========================================================================
alter table public.orders 
add column if not exists coins_used bigint not null default 0 check (coins_used >= 0),
add column if not exists coins_discount_cents bigint not null default 0 check (coins_discount_cents >= 0),
add column if not exists coins_earned bigint not null default 0 check (coins_earned >= 0);

alter table public.coupons 
add column if not exists coin_cost bigint default null check (coin_cost is null or coin_cost > 0);

-- Seed kupon eksklusif penukaran koin (jika belum ada)
insert into public.coupons (
  code, name, description, discount_type, discount_value, 
  max_discount_cents, min_purchase_cents, usage_limit, usage_count, 
  user_limit, starts_at, expires_at, is_active, coin_cost
) values 
(
  'KOINONGKIR', 
  'Gratis Ongkir Koin Rp 20.000', 
  'Potongan ongkir Rp 20.000 khusus penukaran 2.500 Koin', 
  'fixed', 
  2000000, 
  null, 
  5000000, 
  500, 
  0, 
  1, 
  now(), 
  now() + interval '90 days', 
  true, 
  2500
),
(
  'KOINHEMAT25', 
  'Diskon Koin 25%', 
  'Diskon 25% maks Rp 50.000 khusus penukaran 5.000 Koin', 
  'percentage', 
  25, 
  5000000, 
  15000000, 
  300, 
  0, 
  1, 
  now(), 
  now() + interval '90 days', 
  true, 
  5000
),
(
  'KOINSUPER50', 
  'Potongan Koin Rp 50.000', 
  'Potongan belanja Rp 50.000 khusus penukaran 10.000 Koin', 
  'fixed', 
  5000000, 
  null, 
  20000000, 
  200, 
  0, 
  1, 
  now(), 
  now() + interval '90 days', 
  true, 
  10000
)
on conflict (code) do update set
  coin_cost = excluded.coin_cost,
  updated_at = now();

-- =========================================================================
-- 4. RPC CLAIM_WELCOME_COINS
-- =========================================================================
create or replace function public.claim_welcome_coins()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_coins record;
  v_new_balance bigint;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized: Pengguna harus login untuk klaim welcome bonus';
  end if;

  select * into v_coins
  from public.user_coins
  where user_id = v_user_id
  for update;

  if not found then
    insert into public.user_coins (
      user_id, balance_coins, lifetime_earned_coins, lifetime_spent_coins, has_claimed_welcome
    ) values (
      v_user_id, 10000, 10000, 0, true
    ) returning balance_coins into v_new_balance;
  else
    if v_coins.has_claimed_welcome then
      raise exception 'Bonus sambutan 10.000 Koin sudah pernah diklaim sebelumnya';
    end if;

    update public.user_coins
    set balance_coins = balance_coins + 10000,
        lifetime_earned_coins = lifetime_earned_coins + 10000,
        has_claimed_welcome = true,
        updated_at = now()
    where user_id = v_user_id
    returning balance_coins into v_new_balance;
  end if;

  -- Catat riwayat audit mutasi
  insert into public.coin_transactions (
    user_id, type, amount_coins, balance_after, description
  ) values (
    v_user_id, 'welcome_bonus', 10000, v_new_balance, 'Bonus Sambutan Pengguna Baru ShelfStack'
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Selamat! Anda mendapatkan 10.000 Koin ShelfStack.',
    'balance_coins', v_new_balance
  );
end;
$$;

revoke all on function public.claim_welcome_coins() from public, anon;
grant execute on function public.claim_welcome_coins() to authenticated;

-- =========================================================================
-- 5. RPC EXCHANGE_COINS_FOR_VOUCHER
-- =========================================================================
create or replace function public.exchange_coins_for_voucher(p_coupon_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_coupon record;
  v_user_coins record;
  v_new_balance bigint;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized: Pengguna harus login untuk menukar koin';
  end if;

  -- 1. Validasi kupon
  select * into v_coupon
  from public.coupons
  where id = p_coupon_id
    and deleted_at is null
    and is_active = true
  for update;

  if not found then
    raise exception 'Voucher tidak ditemukan atau sudah tidak aktif';
  end if;

  if v_coupon.coin_cost is null or v_coupon.coin_cost <= 0 then
    raise exception 'Voucher ini tidak tersedia untuk penukaran koin';
  end if;

  -- 2. Cek apakah user sudah pernah klaim voucher ini dan masih aktif
  if exists (
    select 1 from public.user_coupons
    where user_id = v_user_id
      and coupon_id = p_coupon_id
      and status = 'claimed'
  ) then
    raise exception 'Anda sudah memiliki voucher ini di dompet Anda';
  end if;

  -- 3. Cek saldo koin user
  select * into v_user_coins
  from public.user_coins
  where user_id = v_user_id
  for update;

  if not found or v_user_coins.balance_coins < v_coupon.coin_cost then
    raise exception 'Saldo koin tidak mencukupi untuk menukar voucher ini (Dibutuhkan: % Koin)', v_coupon.coin_cost;
  end if;

  -- 4. Potong saldo koin
  update public.user_coins
  set balance_coins = balance_coins - v_coupon.coin_cost,
      lifetime_spent_coins = lifetime_spent_coins + v_coupon.coin_cost,
      updated_at = now()
  where user_id = v_user_id
  returning balance_coins into v_new_balance;

  -- 5. Simpan voucher ke dompet user_coupons
  insert into public.user_coupons (
    user_id, coupon_id, status, claimed_at
  ) values (
    v_user_id, v_coupon.id, 'claimed', now()
  )
  on conflict (user_id, coupon_id) do update set
    status = 'claimed',
    claimed_at = now(),
    used_at = null,
    order_id = null,
    updated_at = now();

  -- 6. Catat riwayat audit mutasi
  insert into public.coin_transactions (
    user_id, type, amount_coins, balance_after, coupon_id, description
  ) values (
    v_user_id, 
    'redeemed_voucher', 
    v_coupon.coin_cost, 
    v_new_balance, 
    v_coupon.id, 
    'Penukaran ' || v_coupon.coin_cost || ' Koin untuk voucher ' || v_coupon.code
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Voucher ' || v_coupon.name || ' berhasil ditukarkan dan tersimpan di dompet Anda.',
    'coupon_code', v_coupon.code,
    'balance_coins', v_new_balance
  );
end;
$$;

revoke all on function public.exchange_coins_for_voucher(uuid) from public, anon;
grant execute on function public.exchange_coins_for_voucher(uuid) to authenticated;

-- =========================================================================
-- 6. UPDATE RPC CREATE_ORDER DENGAN INTEGRASI PEMAKAIAN KOIN
-- =========================================================================
create or replace function public.create_order(
  p_items jsonb,
  p_address jsonb,
  p_idempotency_key text default null,
  p_request_hash text default null,
  p_coupon_code text default null,
  p_shipping_service text default 'reguler',
  p_courier_code text default null,
  p_coins_used bigint default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_subtotal int := 0;
  v_discount int := 0;
  v_subtotal_after_coupon int := 0;
  v_max_coins bigint := 0;
  v_actual_coins_used bigint := 0;
  v_coins_discount_cents bigint := 0;
  v_total int := 0;
  r record;
  v_price int;
  v_stock int;
  v_existing_order uuid;
  v_existing_hash text;
  v_lock_key bigint;
  v_coupon record;
  v_coupon_id uuid := null;
  v_coupon_code text := null;
  v_user_usage_count int := 0;
  v_shipping_cost int := 0;
  v_shipping_service text := coalesce(lower(trim(p_shipping_service)), 'reguler');
  v_user_coins record;
  v_new_coin_balance bigint;
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
    v_lock_key := ('x' || substr(md5(auth.uid()::text || ':' || p_idempotency_key), 1, 16))::bit(64)::bigint;
    perform pg_advisory_xact_lock(v_lock_key);

    select order_id, request_hash into v_existing_order, v_existing_hash
    from public.order_idempotency_keys
    where user_id = auth.uid() and idempotency_key = p_idempotency_key;

    if found then
      if p_request_hash is not null and v_existing_hash <> p_request_hash then
        raise exception 'IDEMPOTENCY_CONFLICT: Idempotency-Key "%" telah digunakan untuk transaksi dengan rincian berbeda', p_idempotency_key;
      end if;

      return v_existing_order;
    end if;
  end if;

  -- 4. Inisialisasi draft order
  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  -- Set session variables untuk audit trigger
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

    v_subtotal := v_subtotal + (v_price * r.qty);
  end loop;

  -- 6. Validasi dan Kalkulasi Kupon Diskon (jika ada)
  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(trim(p_coupon_code))
      and deleted_at is null
      and is_active = true
    for update;

    if not found then
      raise exception 'Kupon "%" tidak ditemukan atau sudah tidak aktif', p_coupon_code;
    end if;

    if v_coupon.starts_at is not null and now() < v_coupon.starts_at then
      raise exception 'Kupon "%" belum dapat digunakan', p_coupon_code;
    end if;

    if v_coupon.expires_at is not null and now() > v_coupon.expires_at then
      raise exception 'Kupon "%" sudah kedaluwarsa', p_coupon_code;
    end if;

    if v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit then
      raise exception 'Kuota kupon "%" telah habis', p_coupon_code;
    end if;

    if v_subtotal < v_coupon.min_purchase_cents then
      raise exception 'Minimum pembelian untuk kupon "%" adalah Rp %', 
        p_coupon_code, (v_coupon.min_purchase_cents / 100);
    end if;

    if v_coupon.user_limit is not null then
      select count(*) into v_user_usage_count
      from public.coupon_usages
      where coupon_id = v_coupon.id
        and user_id = auth.uid();

      if v_user_usage_count >= v_coupon.user_limit then
        raise exception 'Anda telah mencapai batas maksimum pemakaian kupon "%"', p_coupon_code;
      end if;
    end if;

    v_coupon_id := v_coupon.id;
    v_coupon_code := v_coupon.code;

    if v_coupon.discount_type = 'percentage' then
      v_discount := floor((v_subtotal * v_coupon.discount_value) / 100);
      if v_coupon.max_discount_cents is not null and v_discount > v_coupon.max_discount_cents then
        v_discount := v_coupon.max_discount_cents;
      end if;
    else
      v_discount := v_coupon.discount_value;
    end if;

    if v_discount > v_subtotal then
      v_discount := v_subtotal;
    end if;

    update public.coupons
    set usage_count = usage_count + 1,
        updated_at = now()
    where id = v_coupon.id;

    insert into public.coupon_usages (
      coupon_id, user_id, order_id, discount_cents
    ) values (
      v_coupon.id, auth.uid(), v_order, v_discount
    );

    update public.user_coupons
    set status = 'used',
        used_at = now(),
        order_id = v_order,
        updated_at = now()
    where user_id = auth.uid()
      and coupon_id = v_coupon_id
      and status = 'claimed';

    if not found then
      insert into public.user_coupons (
        user_id, coupon_id, status, claimed_at, used_at, order_id
      ) values (
        auth.uid(), v_coupon_id, 'used', now(), now(), v_order
      );
    end if;
  end if;

  v_subtotal_after_coupon := greatest(0, v_subtotal - v_discount);

  -- 7. Validasi dan Kalkulasi Pemakaian Koin (Maksimal 50% dari subtotal setelah kupon)
  if p_coins_used > 0 then
    -- 1 Koin = Rp 1 = 100 sen
    v_max_coins := floor((v_subtotal_after_coupon * 0.5) / 100);
    
    select * into v_user_coins
    from public.user_coins
    where user_id = auth.uid()
    for update;

    if not found or v_user_coins.balance_coins < p_coins_used then
      raise exception 'Saldo koin tidak mencukupi (Saldo: %, Diminta: %)', 
        coalesce(v_user_coins.balance_coins, 0), p_coins_used;
    end if;

    v_actual_coins_used := least(p_coins_used, v_max_coins);
    v_coins_discount_cents := v_actual_coins_used * 100;

    if v_actual_coins_used > 0 then
      update public.user_coins
      set balance_coins = balance_coins - v_actual_coins_used,
          lifetime_spent_coins = lifetime_spent_coins + v_actual_coins_used,
          updated_at = now()
      where user_id = auth.uid()
      returning balance_coins into v_new_coin_balance;

      insert into public.coin_transactions (
        user_id, type, amount_coins, balance_after, order_id, description
      ) values (
        auth.uid(), 
        'spent', 
        v_actual_coins_used, 
        v_new_coin_balance, 
        v_order, 
        'Pemotongan ' || v_actual_coins_used || ' Koin saat checkout pesanan'
      );
    end if;
  end if;

  -- 8. Kalkulasi Biaya Pengiriman
  if v_shipping_service = 'express' then
    v_shipping_cost := 3000000;
  elsif v_shipping_service = 'instant' then
    v_shipping_cost := 4500000;
  elsif v_shipping_service = 'cargo' then
    v_shipping_cost := 2500000;
  else
    v_shipping_service := 'reguler';
    if v_subtotal >= 50000000 then
      v_shipping_cost := 0;
    else
      v_shipping_cost := 1500000;
    end if;
  end if;

  -- Total pesanan: subtotal - diskon voucher - diskon koin + ongkir
  v_total := greatest(0, v_subtotal_after_coupon - v_coins_discount_cents + v_shipping_cost);

  -- 9. Update data pesanan final
  update public.orders
  set total_cents = v_total,
      subtotal_cents = v_subtotal,
      discount_cents = v_discount,
      coupon_id = v_coupon_id,
      coupon_code = v_coupon_code,
      coins_used = v_actual_coins_used,
      coins_discount_cents = v_coins_discount_cents,
      shipping_service = v_shipping_service,
      courier_code = p_courier_code,
      shipping_cost_cents = v_shipping_cost,
      updated_at = now()
  where id = v_order;

  -- 10. Catat idempotensi jika disertakan
  if p_idempotency_key is not null and p_idempotency_key <> '' then
    insert into public.order_idempotency_keys (
      user_id, idempotency_key, order_id, request_hash
    ) values (
      auth.uid(), p_idempotency_key, v_order, p_request_hash
    );
  end if;

  return v_order;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, text, text, text, text, text, bigint) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, text, text, text, text, text, bigint) to authenticated;

-- =========================================================================
-- 7. UPDATE RPC CANCEL_ORDER DENGAN PENGEMBALIAN KOIN
-- =========================================================================
create or replace function public.cancel_order(
  p_order_id uuid,
  p_reason text default 'Dibatalkan oleh pelanggan'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  r record;
  v_new_coin_balance bigint;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if auth.uid() is distinct from v_order.user_id then
    raise exception 'Unauthorized: Hanya pemilik pesanan yang dapat membatalkan pesanan';
  end if;

  if v_order.status not in ('pending', 'unpaid') then
    raise exception 'Pesanan dengan status "%" tidak dapat dibatalkan', v_order.status;
  end if;

  perform set_config('app.stock_change_reason', 'order_cancellation', true);
  perform set_config('app.stock_change_order_id', p_order_id::text, true);

  -- Restock item
  for r in
    select product_id, qty
    from public.order_items
    where order_id = p_order_id
    order by product_id asc
  loop
    update public.products
    set stock = stock + r.qty
    where id = r.product_id;
  end loop;

  -- Rollback kupon jika ada
  if v_order.coupon_id is not null then
    update public.coupons
    set usage_count = greatest(0, usage_count - 1),
        updated_at = now()
    where id = v_order.coupon_id;

    delete from public.coupon_usages
    where order_id = p_order_id;

    update public.user_coupons
    set status = 'claimed',
        used_at = null,
        order_id = null,
        updated_at = now()
    where order_id = p_order_id;
  end if;

  -- Rollback pemakaian koin jika ada
  if coalesce(v_order.coins_used, 0) > 0 then
    update public.user_coins
    set balance_coins = balance_coins + v_order.coins_used,
        lifetime_spent_coins = greatest(0, lifetime_spent_coins - v_order.coins_used),
        updated_at = now()
    where user_id = v_order.user_id
    returning balance_coins into v_new_coin_balance;

    insert into public.coin_transactions (
      user_id, type, amount_coins, balance_after, order_id, description
    ) values (
      v_order.user_id, 
      'cancelled_order', 
      v_order.coins_used, 
      v_new_coin_balance, 
      p_order_id, 
      'Pengembalian ' || v_order.coins_used || ' Koin dari pembatalan pesanan'
    );
  end if;

  update public.orders
  set 
    status = 'cancelled',
    cancelled_at = coalesce(cancelled_at, now()),
    cancellation_reason = p_reason,
    updated_at = now()
  where id = p_order_id;

  begin
    insert into public.activity_logs (
      entity_type, entity_id, action, description, created_at
    ) values (
      'order', p_order_id, 'cancelled', 'Pesanan dibatalkan. Alasan: ' || coalesce(p_reason, '-'), now()
    );
  exception when others then
    -- fail-safe
  end;

  return true;
end;
$$;

revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated;

-- =========================================================================
-- 8. UPDATE TRANSITION_ORDER_STATUS DENGAN CASHBACK KOIN 1% SAAT COMPLETED
-- =========================================================================
create or replace function public.transition_order_status(
  p_order_id uuid,
  p_new_status text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_eligible boolean := false;
  v_earned_coins bigint := 0;
  v_new_coin_balance bigint;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  -- Validasi transisi status
  if v_order.status = 'pending' and p_new_status in ('paid', 'cancelled') then
    v_eligible := true;
  elsif v_order.status = 'paid' and p_new_status in ('processing', 'cancelled', 'refunded') then
    v_eligible := true;
  elsif v_order.status = 'processing' and p_new_status in ('shipped', 'cancelled', 'refunded') then
    v_eligible := true;
  elsif v_order.status = 'shipped' and p_new_status in ('completed', 'returned') then
    v_eligible := true;
  elsif v_order.status = p_new_status then
    return true;
  end if;

  if not v_eligible then
    raise exception 'Transisi status tidak valid dari "%" ke "%"', v_order.status, p_new_status;
  end if;

  -- Jika order completed: Berikan reward 1% koin dari nilai belanja bersih
  if p_new_status = 'completed' and coalesce(v_order.coins_earned, 0) = 0 then
    -- Nilai belanja bersih: subtotal - diskon voucher - diskon koin
    v_earned_coins := greatest(0, floor(
      (v_order.subtotal_cents - coalesce(v_order.discount_cents, 0) - coalesce(v_order.coins_discount_cents, 0)) * 0.01 / 100
    ));

    if v_earned_coins > 0 then
      insert into public.user_coins (
        user_id, balance_coins, lifetime_earned_coins, lifetime_spent_coins
      ) values (
        v_order.user_id, v_earned_coins, v_earned_coins, 0
      )
      on conflict (user_id) do update set
        balance_coins = public.user_coins.balance_coins + v_earned_coins,
        lifetime_earned_coins = public.user_coins.lifetime_earned_coins + v_earned_coins,
        updated_at = now()
      returning balance_coins into v_new_coin_balance;

      insert into public.coin_transactions (
        user_id, type, amount_coins, balance_after, order_id, description
      ) values (
        v_order.user_id, 
        'earned', 
        v_earned_coins, 
        v_new_coin_balance, 
        p_order_id, 
        'Cashback ' || v_earned_coins || ' Koin dari penyelesaian pesanan'
      );
    end if;
  end if;

  update public.orders
  set status = p_new_status,
      coins_earned = case when p_new_status = 'completed' then v_earned_coins else coins_earned end,
      completed_at = case when p_new_status = 'completed' then now() else completed_at end,
      updated_at = now()
  where id = p_order_id;

  begin
    insert into public.activity_logs (
      entity_type, entity_id, action, description, created_at
    ) values (
      'order', p_order_id, p_new_status, 'Perubahan status pesanan menjadi ' || p_new_status || coalesce('. Catatan: ' || p_note, ''), now()
    );
  exception when others then
    -- fail-safe
  end;

  return true;
end;
$$;

revoke all on function public.transition_order_status(uuid, text, text) from public, anon;
grant execute on function public.transition_order_status(uuid, text, text) to authenticated, service_role;

