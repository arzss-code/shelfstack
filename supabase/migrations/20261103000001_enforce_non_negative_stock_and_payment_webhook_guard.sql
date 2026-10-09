-- Sprint 5 / Phase 1: Database Invariants Hardening & Webhook State Guard
-- 1. CHECK Constraint: products.stock >= 0 (Anti-Overselling Schema Invariant)
-- 2. State-Hardened handle_payment_webhook (Anti-Rollback, Anti-Phantom Stock, Deterministic Restock)

-- =========================================================================
-- 1. ENFORCE NON-NEGATIVE STOCK CONSTRAINT (PRODUCTS)
-- =========================================================================
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_stock_non_negative'
  ) then
    alter table public.products
      add constraint products_stock_non_negative check (stock >= 0);
  end if;
end $$;

-- =========================================================================
-- 2. HARDENED & ATOMIC PAYMENT WEBHOOK PROCESSOR (RPC)
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

  -- 2. Proteksi State Terminal / Progresif (paid, shipped, completed)
  --    Webhook Midtrans TIDAK BOLEH membatalkan atau me-rollback pesanan yang sudah lunas/diproses.
  if v_current_status in ('paid', 'shipped', 'completed') then
    -- Jika ada event stale expire/cancel/deny yang tiba terlambat:
    if p_target_status = 'cancelled' then
      return 'IGNORED_STALE_CANCEL_ON_PAID_ORDER';
    end if;

    -- Jika event paid duplikat: idempoten
    if p_target_status = 'paid' then
      return 'NO_CHANGE_ALREADY_' || upper(v_current_status);
    end if;

    -- Abaikan status gateway lainnya yang mencoba mendegradasi order progresif
    return 'IGNORED_ORDER_ALREADY_PROGRESSING';
  end if;

  -- 3. Proteksi Pesanan yang Sudah Dibatalkan (Phantom Stock & Late Payment Protection)
  if v_current_status = 'cancelled' then
    if p_target_status = 'paid' then
      -- Pembayaran masuk setelah pesanan dibatalkan/expired.
      -- Jangan ubah status pesanan dan JANGAN kurangi stok. Catat ke activity_logs untuk rekonsiliasi refund.
      begin
        insert into public.activity_logs (
          action,
          entity_type,
          entity_id,
          description,
          new_data
        ) values (
          'UPDATE'::public.activity_action,
          'orders',
          0,
          'CONFLICT: Webhook paid diterima untuk order yang sudah cancelled (Refund Required)',
          jsonb_build_object(
            'order_id', p_order_id,
            'midtrans_id', p_midtrans_id,
            'payment_type', p_payment_type
          )
        );
      exception when others then
        null;
      end;

      return 'CONFLICT_ALREADY_CANCELLED';
    end if;

    -- Event cancel duplikat: idempoten tanpa restock berulang
    if p_target_status = 'cancelled' then
      return 'NO_CHANGE_ALREADY_CANCELLED';
    end if;

    return 'IGNORED_ORDER_ALREADY_CANCELLED';
  end if;

  -- 4. Transisi Normal dari status 'pending'
  if v_current_status = 'pending' then
    -- A. pending -> paid: Pembayaran Berhasil
    if p_target_status = 'paid' then
      update public.orders
      set
        status = 'paid',
        payment_type = coalesce(p_payment_type, payment_type),
        midtrans_id = coalesce(p_midtrans_id, midtrans_id),
        paid_at = coalesce(paid_at, now()),
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

    -- B. pending -> cancelled: Kadaluarsa / Ditolak di Gateway (Wajib Restock Atomik)
    if p_target_status = 'cancelled' then
      -- Set session variables untuk audit trigger ledger (stock_movements)
      perform set_config('app.stock_change_reason', 'webhook_expire_restock', true);
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

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
        cancelled_at = coalesce(cancelled_at, now()),
        cancellation_reason = coalesce(cancellation_reason, 'Otomatis dibatalkan oleh Payment Gateway (Expired / Denied)'),
        updated_at = now()
      where id = p_order_id;

      return 'CANCELLED_AND_RESTOCKED';
    end if;

    return 'INVALID_TARGET_STATUS_FOR_PENDING';
  end if;

  -- 5. Fallback Default untuk transisi tak terduga
  return 'INVALID_TRANSITION';
end;
$$;

-- Izin eksekusi untuk RPC
grant execute on function public.handle_payment_webhook(uuid, text, text, text) to service_role;
grant execute on function public.handle_payment_webhook(uuid, text, text, text) to authenticated;
