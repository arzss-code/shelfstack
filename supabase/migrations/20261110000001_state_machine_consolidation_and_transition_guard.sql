-- =========================================================================
-- Sprint 6 / Task 06: Order, Payment & Refund State Machine Consolidation
-- 1. Database-Enforced Trigger Guard: trg_enforce_order_state_machine
--    - Single source of truth for order status transitions at the storage layer
--    - Strictly prevents illegal transitions, skip transitions, and rollbacks
--    - Enforces terminal states: 'completed', 'cancelled', 'refunded'
--    - Automatically guarantees timestamps: paid_at, cancelled_at, refunded_at
-- 2. Consolidated RPCs with Deterministic Product Lock Ordering (ORDER BY product_id ASC):
--    - public.cancel_order
--    - public.handle_payment_webhook
--    - public.transition_order_status
-- =========================================================================

-- =========================================================================
-- 1. TRIGGER GUARD: ENFORCE ORDER STATE MACHINE AT STORAGE LEVEL
-- =========================================================================
create or replace function public.trg_enforce_order_state_machine()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- 1.1. Jika status tidak berubah, izinkan operasi update lainnya (snap_token, updated_at, dsb.)
  if old.status is not distinct from new.status then
    return new;
  end if;

  -- 1.2. Guard: Status Terminal (completed, cancelled, refunded) bersifat mutlak dan tidak boleh diubah
  if old.status in ('completed', 'cancelled', 'refunded') then
    raise exception 'TERMINAL_ORDER_STATE: Pesanan dalam status "%" bersifat terminal dan tidak dapat diubah lagi ke "%"', old.status, new.status;
  end if;

  -- 1.3. Guard: Validasi Matriks Transisi Status Resmi
  if old.status = 'pending' and new.status not in ('paid', 'cancelled') then
    raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', old.status, new.status;
  elsif old.status = 'paid' and new.status not in ('shipped', 'refunded') then
    raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', old.status, new.status;
  elsif old.status = 'shipped' and new.status not in ('completed') then
    raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', old.status, new.status;
  end if;

  -- 1.4. Invariant: Pastikan timestamp transisi terisi otomatis jika belum ada
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  elsif new.status = 'cancelled' and new.cancelled_at is null then
    new.cancelled_at := now();
  elsif new.status = 'refunded' and new.refunded_at is null then
    new.refunded_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_order_state_machine_guard on public.orders;
create trigger trg_order_state_machine_guard
before update on public.orders
for each row
execute function public.trg_enforce_order_state_machine();


-- =========================================================================
-- 2. HARDENED CANCEL_ORDER (ORDER BY product_id ASC & ACTIVITY LOGGING)
-- =========================================================================
create or replace function public.cancel_order(
  p_order_id uuid,
  p_reason text default 'Dibatalkan oleh pelanggan'
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
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

  -- Set session variables untuk audit ledger trigger (stock_movements)
  perform set_config('app.stock_change_reason', 'order_cancellation', true);
  perform set_config('app.stock_change_order_id', p_order_id::text, true);

  -- Restock item dengan urutan deterministik untuk mencegah deadlocks
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

  update public.orders
  set 
    status = 'cancelled',
    cancelled_at = coalesce(cancelled_at, now()),
    cancellation_reason = p_reason,
    updated_at = now()
  where id = p_order_id;

  -- Activity log
  begin
    insert into public.activity_logs (
      entity_type,
      entity_id,
      action,
      description,
      old_data,
      new_data
    ) values (
      'order',
      0,
      'UPDATE'::public.activity_action,
      'Pesanan dibatalkan: ' || coalesce(p_reason, 'Dibatalkan oleh pelanggan/admin'),
      jsonb_build_object('order_id', p_order_id, 'status', 'pending'),
      jsonb_build_object('order_id', p_order_id, 'status', 'cancelled', 'reason', p_reason)
    );
  exception when others then
    null;
  end;

  return true;
end;
$$;


-- =========================================================================
-- 3. HARDENED HANDLE_PAYMENT_WEBHOOK (DETERMINISTIC PRODUCT LOCKING)
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
set search_path = public, pg_temp
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

  -- 2. Proteksi Pesanan yang Sudah Direfund (Terminal Refunded State Guard)
  if v_current_status = 'refunded' then
    return 'IGNORED_ORDER_ALREADY_REFUNDED';
  end if;

  -- 3. Proteksi State Terminal / Progresif (paid, shipped, completed)
  if v_current_status in ('paid', 'shipped', 'completed') then
    if p_target_status = 'cancelled' then
      return 'IGNORED_STALE_CANCEL_ON_PAID_ORDER';
    end if;

    if p_target_status = 'paid' then
      return 'NO_CHANGE_ALREADY_' || upper(v_current_status);
    end if;

    return 'IGNORED_ORDER_ALREADY_PROGRESSING';
  end if;

  -- 4. Proteksi Pesanan yang Sudah Dibatalkan (Phantom Stock & Late Payment Protection)
  if v_current_status = 'cancelled' then
    if p_target_status = 'paid' then
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

    if p_target_status = 'cancelled' then
      return 'NO_CHANGE_ALREADY_CANCELLED';
    end if;

    return 'IGNORED_ORDER_ALREADY_CANCELLED';
  end if;

  -- 5. Transisi Normal dari status 'pending'
  if v_current_status = 'pending' then
    if p_target_status = 'paid' then
      update public.orders
      set
        status = 'paid',
        payment_type = coalesce(p_payment_type, payment_type),
        midtrans_id = coalesce(p_midtrans_id, midtrans_id),
        paid_at = coalesce(paid_at, now()),
        updated_at = now()
      where id = p_order_id;

      for r in
        select product_id, qty
        from public.order_items
        where order_id = p_order_id
        order by product_id asc
      loop
        update public.products
        set sold_count = sold_count + r.qty
        where id = r.product_id;
      end loop;

      return 'PAID_SUCCESS';
    end if;

    if p_target_status = 'cancelled' then
      perform set_config('app.stock_change_reason', 'webhook_expire_restock', true);
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

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

      update public.orders
      set
        status = 'cancelled',
        cancelled_at = coalesce(cancelled_at, now()),
        cancellation_reason = 'Dibatalkan/Kadaluarsa oleh Payment Gateway',
        updated_at = now()
      where id = p_order_id;

      return 'CANCELLED_SUCCESS';
    end if;
  end if;

  return 'NO_CHANGE';
end;
$$;


-- =========================================================================
-- 4. HARDENED TRANSITION_ORDER_STATUS (DETERMINISTIC PRODUCT LOCKING)
-- =========================================================================
create or replace function public.transition_order_status(
  p_order_id uuid,
  p_target_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order record;
  r record;
begin
  if auth.uid() is not null and not public.is_admin() and current_user not in ('service_role', 'postgres') then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang dapat memperbarui status pesanan';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND: Pesanan tidak ditemukan';
  end if;

  if v_order.status = p_target_status then
    return jsonb_build_object(
      'order_id', p_order_id,
      'current_status', v_order.status,
      'previous_status', v_order.status,
      'no_op', true,
      'message', 'Status pesanan sudah dalam status target (' || p_target_status || ')'
    );
  end if;

  if v_order.status = 'pending' then
    if p_target_status = 'paid' then
      update public.orders
      set status = 'paid', paid_at = coalesce(paid_at, now()), updated_at = now()
      where id = p_order_id;

      for r in
        select product_id, qty
        from public.order_items
        where order_id = p_order_id
        order by product_id asc
      loop
        update public.products set sold_count = sold_count + r.qty where id = r.product_id;
      end loop;
    elsif p_target_status = 'cancelled' then
      perform set_config('app.stock_change_reason', 'admin_order_cancellation', true);
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

      for r in
        select product_id, qty
        from public.order_items
        where order_id = p_order_id
        order by product_id asc
      loop
        update public.products set stock = stock + r.qty where id = r.product_id;
      end loop;

      update public.orders
      set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now()), cancellation_reason = coalesce(p_reason, 'Dibatalkan oleh Administrator'), updated_at = now()
      where id = p_order_id;
    else
      raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', v_order.status, p_target_status;
    end if;

  elsif v_order.status = 'paid' then
    if p_target_status = 'shipped' then
      update public.orders set status = 'shipped', updated_at = now() where id = p_order_id;
    elsif p_target_status = 'cancelled' then
      raise exception 'INVALID_ORDER_TRANSITION: Pesanan berstatus paid tidak dapat dibatalkan tanpa proses refund resmi (gunakan modul refund)';
    elsif p_target_status = 'refunded' then
      raise exception 'INVALID_ORDER_TRANSITION: Transisi ke status refunded harus melalui modul refund resmi (create_refund_attempt & finalize_refund)';
    else
      raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', v_order.status, p_target_status;
    end if;

  elsif v_order.status = 'shipped' then
    if p_target_status = 'completed' then
      update public.orders set status = 'completed', updated_at = now() where id = p_order_id;
    else
      raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', v_order.status, p_target_status;
    end if;

  elsif v_order.status in ('completed', 'cancelled', 'refunded') then
    raise exception 'INVALID_ORDER_TRANSITION: Pesanan sudah berada dalam status terminal (%) dan tidak dapat diubah lagi', v_order.status;

  else
    raise exception 'INVALID_ORDER_TRANSITION: Status pesanan tidak dikenal: %', v_order.status;
  end if;

  begin
    insert into public.activity_logs (
      entity_type,
      entity_id,
      action,
      description,
      old_data,
      new_data
    ) values (
      'order',
      0,
      'UPDATE'::public.activity_action,
      'Status pesanan diperbarui menjadi: ' || p_target_status || coalesce(' (Alasan: ' || p_reason || ')', ''),
      jsonb_build_object('order_id', p_order_id, 'status', v_order.status),
      jsonb_build_object('order_id', p_order_id, 'status', p_target_status, 'reason', p_reason)
    );
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'order_id', p_order_id,
    'current_status', p_target_status,
    'previous_status', v_order.status,
    'no_op', false,
    'message', 'Status pesanan berhasil diperbarui menjadi ' || p_target_status
  );
end;
$$;
