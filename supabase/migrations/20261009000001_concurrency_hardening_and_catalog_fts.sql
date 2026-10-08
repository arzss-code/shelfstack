-- Sprint 4 / Phase 0: Concurrency Hardening & Tier-1 Catalog Database Optimizations
-- 1. Deadlock Elimination on create_order (Consistent Lock Ordering by product_id ASC)
-- 2. Atomic & Idempotent Webhook Processing (handle_payment_webhook with automatic restock on expire/cancel)
-- 3. Catalog Compound Indexes for High Throughput Search & Filtering

-- =========================================================================
-- 1. RE-DEFINE create_order WITH DETERMINISTIC LOCK ORDERING (ANTI-DEADLOCK)
-- =========================================================================
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
  -- 1. Pastikan pemanggil terautentikasi
  if auth.uid() is null then
    raise exception 'Unauthorized: Pengguna harus login untuk membuat pesanan';
  end if;

  -- 2. Validasi keranjang tidak kosong
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang belanja kosong';
  end if;

  -- 3. Inisialisasi draft order
  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  -- 4. KUNCI BARIS PRODUK DENGAN URUTAN DETERMINISTIK (ORDER BY product_id ASC)
  --    Menghindari circular deadlock ketika 2 user checkout barang yang sama secara simultan
  for r in 
    select product_id, qty 
    from jsonb_to_recordset(p_items) as (product_id bigint, qty int)
    order by product_id asc 
  loop
    if r.qty <= 0 then
      raise exception 'Kuantitas tidak valid untuk produk ID %', r.product_id;
    end if;

    -- Kunci baris produk FOR UPDATE secara eksklusif
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

    -- Kurangi stok produk secara atomik
    update public.products
    set stock = stock - r.qty
    where id = r.product_id;

    -- Simpan item pesanan dengan snapshot harga saat transaksi dibuat
    insert into public.order_items (order_id, product_id, qty, price_cents)
    values (v_order, r.product_id, r.qty, v_price);

    -- Akumulasi total biaya di server (anti-tamper)
    v_total := v_total + (v_price * r.qty);
  end loop;

  -- 5. Update total akhir pesanan
  update public.orders
  set total_cents = v_total
  where id = v_order;

  return v_order;
end;
$$;

-- =========================================================================
-- 2. ATOMIC & IDEMPOTENT PAYMENT WEBHOOK PROCESSOR (RPC)
-- =========================================================================
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
  -- 1. Kunci baris order secara eksklusif FOR UPDATE
  select status into v_current_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return 'ORDER_NOT_FOUND';
  end if;

  -- 2. Idempotency Check: Jika status sudah sama, segera return tanpa aksi ganda
  if v_current_status = p_target_status then
    return 'ALREADY_' || upper(p_target_status);
  end if;

  -- 3. Proteksi Phantom Stock: Jika order sudah dibatalkan pelanggan/sistem,
  --    jangan biarkan webhook menimpa status menjadi 'paid'.
  if v_current_status = 'cancelled' and p_target_status = 'paid' then
    -- Catat log peringatan: pembayaran masuk untuk pesanan yang sudah dibatalkan
    insert into public.activity_logs (
      entity_type, entity_id, action, description, old_data, new_data
    ) values (
      'order',
      p_order_id::text,
      'PAYMENT_CONFLICT',
      'Pembayaran diterima untuk pesanan yang sudah dibatalkan. Diperlukan refund manual/otomatis.',
      jsonb_build_object('status', 'cancelled'),
      jsonb_build_object('midtrans_id', p_midtrans_id, 'attempted_status', 'paid')
    );
    return 'CONFLICT_ALREADY_CANCELLED';
  end if;

  -- 4. Transisi: pending -> paid
  if v_current_status = 'pending' and p_target_status = 'paid' then
    update public.orders
    set 
      status = 'paid',
      payment_type = coalesce(p_payment_type, payment_type),
      midtrans_id = coalesce(p_midtrans_id, midtrans_id),
      paid_at = now(),
      updated_at = now()
    where id = p_order_id;

    -- Inkrementasi sold_count pada produk yang dibeli
    for r in select product_id, qty from public.order_items where order_id = p_order_id loop
      update public.products
      set sold_count = sold_count + r.qty
      where id = r.product_id;
    end loop;

    return 'PAID_SUCCESS';
  end if;

  -- 5. Transisi: pending -> cancelled (Expired / Denied di Payment Gateway)
  --    Wajib mengembalikan stok produk (mencegah Restock Leak)
  if v_current_status = 'pending' and p_target_status = 'cancelled' then
    -- Restock produk secara atomik
    for r in select product_id, qty from public.order_items where order_id = p_order_id loop
      update public.products
      set stock = stock + r.qty
      where id = r.product_id;
    end loop;

    update public.orders
    set 
      status = 'cancelled',
      payment_type = coalesce(p_payment_type, payment_type),
      midtrans_id = coalesce(p_midtrans_id, midtrans_id),
      updated_at = now()
    where id = p_order_id;

    return 'CANCELLED_AND_RESTOCKED';
  end if;

  -- 6. Transisi status lainnya (misal: paid -> shipped / completed jika webhook memicu)
  update public.orders
  set 
    status = p_target_status,
    updated_at = now()
  where id = p_order_id;

  return 'UPDATED_' || upper(p_target_status);
end;
$$;

-- Beri izin eksekusi ke authenticated dan service_role
grant execute on function public.handle_payment_webhook(uuid, text, text, text) to service_role;
grant execute on function public.handle_payment_webhook(uuid, text, text, text) to authenticated;

-- =========================================================================
-- 3. COMPOUND INDEXING UNTUK KATALOG & ORDER PERFORMANCE
-- =========================================================================
-- Index pencarian katalog dengan filter kategori, harga, dan ketersediaan stok
create index if not exists idx_products_catalog_perf 
on public.products (category_id, price_cents, stock) 
where deleted_at is null;

-- Index pengurutan popularitas produk (sold_count dan rating) sekelas e-commerce tier-1
create index if not exists idx_products_popular_perf 
on public.products (sold_count desc, rating desc) 
where deleted_at is null;

-- Index filter pesanan berdasarkan status dan waktu pembuatan
create index if not exists idx_orders_status_date_perf 
on public.orders (status, created_at desc);
