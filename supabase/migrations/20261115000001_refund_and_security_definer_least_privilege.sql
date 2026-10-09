-- =========================================================================
-- MIGRATION: 20261115000001_refund_and_security_definer_least_privilege.sql
-- Task 07.3: Refund RPC Authorization & Complete Security Definer Least-Privilege
-- 
-- 1. Cabut hak EXECUTE public.handle_refund_webhook dari PUBLIC, anon, authenticated
--    dan batasi HANYA untuk role service_role (karena caller runtime adalah endpoint
--    webhook Midtrans di server setelah verifikasi signature SHA-512).
-- 2. Perbaiki bug otorisasi SECURITY DEFINER pada:
--    - public.create_refund_attempt
--    - public.finalize_refund
--    - public.transition_order_status
--    (Di dalam fungsi SECURITY DEFINER, current_user selalu 'postgres' sehingga 
--    kondisi `current_user not in ('service_role', 'postgres')` sebelumnya selalu 
--    evaluasi false dan meloloskan pemanggil non-admin).
-- 3. Cabut hak EXECUTE public.create_refund_attempt dari anon dan public.
-- 4. Cabut hak EXECUTE public.trg_enforce_order_state_machine dari anon, authenticated, public.
-- =========================================================================

-- 1. RESTRICT handle_refund_webhook STRICTLY TO service_role
revoke all on function public.handle_refund_webhook(
  uuid, text, text, boolean, text, text, jsonb, text, timestamptz, integer
) from public, anon, authenticated;

grant execute on function public.handle_refund_webhook(
  uuid, text, text, boolean, text, text, jsonb, text, timestamptz, integer
) to service_role;


-- 2. HARDEN public.create_refund_attempt (Admin Only, Anti-Bypass)
create or replace function public.create_refund_attempt(
  p_order_id uuid,
  p_idempotency_key text,
  p_reason text default 'Permintaan refund oleh Administrator'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order record;
  v_existing_refund record;
  v_refund_id uuid;
begin
  -- 1. Authorization: Administrator or service_role only
  -- Menggunakan deteksi auth.uid() & role session yang kebal context-switching SECURITY DEFINER
  if (auth.uid() is not null and not public.is_admin())
     or (auth.uid() is null and current_setting('role', true) in ('authenticated', 'anon')) then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang berhak memproses refund pesanan';
  end if;

  -- 2. Kunci baris order secara eksklusif FOR UPDATE
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND: Pesanan tidak ditemukan';
  end if;

  -- 3. Cek Idempotency: jika ada attempt dengan (order_id, idempotency_key) yang sama persis
  select * into v_existing_refund
  from public.refunds
  where order_id = p_order_id and idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'refund_id', v_existing_refund.id,
      'order_id', p_order_id,
      'amount_cents', v_existing_refund.amount_cents,
      'status', v_existing_refund.status,
      'idempotency_key', v_existing_refund.idempotency_key,
      'gateway_transaction_id', v_existing_refund.gateway_transaction_id,
      'is_replay', true
    );
  end if;

  -- 4. Validasi Status Order: HANYA order berstatus 'paid' yang dapat direfund
  if v_order.status <> 'paid' then
    raise exception 'INVALID_ORDER_STATE_FOR_REFUND: Hanya pesanan dengan status "paid" yang dapat direfund (status saat ini: %)', v_order.status;
  end if;

  -- 5. Cek apakah ada refund lain untuk order ini yang sedang aktif atau sudah berhasil
  if exists (
    select 1 from public.refunds
    where order_id = p_order_id and status in ('succeeded', 'pending')
  ) then
    raise exception 'REFUND_ALREADY_IN_PROGRESS: Pesanan ini sudah memiliki refund aktif atau telah berhasil direfund';
  end if;

  -- 6. Insert new refund record dengan status 'pending'
  -- Amount di-derive SERVER-SIDE secara terpercaya dari order.total_cents
  insert into public.refunds (
    order_id,
    user_id,
    amount_cents,
    status,
    gateway,
    gateway_transaction_id,
    idempotency_key,
    reason
  ) values (
    p_order_id,
    v_order.user_id,
    v_order.total_cents,
    'pending',
    'midtrans',
    coalesce(v_order.midtrans_id, v_order.id::text),
    p_idempotency_key,
    coalesce(p_reason, 'Permintaan refund oleh Administrator')
  )
  returning id into v_refund_id;

  -- Catat inisiasi ke activity_logs
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
      'Refund diinisiasi: ' || coalesce(p_reason, 'Admin request'),
      jsonb_build_object('order_id', p_order_id, 'status', 'paid'),
      jsonb_build_object('order_id', p_order_id, 'refund_id', v_refund_id, 'amount_cents', v_order.total_cents, 'idempotency_key', p_idempotency_key)
    );
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'refund_id', v_refund_id,
    'order_id', p_order_id,
    'amount_cents', v_order.total_cents,
    'status', 'pending',
    'idempotency_key', p_idempotency_key,
    'gateway_transaction_id', coalesce(v_order.midtrans_id, v_order.id::text),
    'is_replay', false
  );
end;
$$;

revoke all on function public.create_refund_attempt(uuid, text, text) from public, anon;
grant execute on function public.create_refund_attempt(uuid, text, text) to authenticated, service_role;


-- 3. HARDEN public.finalize_refund (Admin & Service Role Only, Anti-Bypass)
create or replace function public.finalize_refund(
  p_refund_id uuid,
  p_success boolean,
  p_gateway_refund_id text default null,
  p_failure_reason text default null,
  p_bank_confirmed_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_refund record;
  v_order record;
  v_current_sold int;
  r record;
begin
  -- 1. Authorization: Administrator or service_role only
  if (auth.uid() is not null and not public.is_admin())
     or (auth.uid() is null and current_setting('role', true) in ('authenticated', 'anon')) then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang berhak menyelesaikan refund';
  end if;

  -- 2. Kunci baris refund FOR UPDATE
  select * into v_refund
  from public.refunds
  where id = p_refund_id
  for update;

  if not found then
    raise exception 'REFUND_NOT_FOUND: Record refund tidak ditemukan';
  end if;

  -- Jika refund sudah final (succeeded/failed), return idempotent
  if v_refund.status in ('succeeded', 'failed') then
    return jsonb_build_object(
      'refund_id', p_refund_id,
      'order_id', v_refund.order_id,
      'status', v_refund.status,
      'already_finalized', true
    );
  end if;

  -- 3. Kunci baris order FOR UPDATE
  select * into v_order
  from public.orders
  where id = v_refund.order_id
  for update;

  if p_success then
    -- A. Update status refund ke 'succeeded' dan simpan konfirmasi bank
    update public.refunds
    set
      status = 'succeeded',
      gateway_refund_id = coalesce(p_gateway_refund_id, gateway_refund_id),
      bank_confirmed_at = coalesce(p_bank_confirmed_at, now()),
      processed_at = now(),
      updated_at = now()
    where id = p_refund_id;

    -- B. Set trusted transition source context sebelum mengupdate order ke 'refunded'
    perform set_config('app.order_transition_source', 'finalize_refund_rpc', true);

    update public.orders
    set
      status = 'refunded',
      refunded_at = now(),
      updated_at = now()
    where id = v_refund.order_id;

    -- C. Restock stok produk & kurangi sold_count secara atomik dengan validasi integritas
    perform set_config('app.stock_change_reason', 'order_refund_restock', true);
    perform set_config('app.stock_change_order_id', v_refund.order_id::text, true);

    for r in select product_id, qty from public.order_items where order_id = v_refund.order_id order by product_id asc loop
      select sold_count into v_current_sold
      from public.products
      where id = r.product_id
      for update;

      if v_current_sold < r.qty then
        raise exception 'DATA_INCONSISTENCY_SOLD_COUNT: sold_count (%) kurang dari qty order (%) untuk produk %', v_current_sold, r.qty, r.product_id;
      end if;

      update public.products
      set
        stock = stock + r.qty,
        sold_count = sold_count - r.qty
      where id = r.product_id;
    end loop;

    -- D. Activity log
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
        'Refund berhasil dikonfirmasi oleh Bank/Gateway: dana dikembalikan dan stok direstock',
        jsonb_build_object('order_id', v_refund.order_id, 'status', 'paid', 'refund_id', p_refund_id),
        jsonb_build_object('order_id', v_refund.order_id, 'status', 'refunded', 'gateway_refund_id', p_gateway_refund_id, 'bank_confirmed_at', coalesce(p_bank_confirmed_at, now()))
      );
    exception when others then
      null;
    end;

    return jsonb_build_object(
      'refund_id', p_refund_id,
      'order_id', v_refund.order_id,
      'status', 'succeeded',
      'order_status', 'refunded',
      'bank_confirmed_at', coalesce(p_bank_confirmed_at, now()),
      'already_finalized', false
    );
  else
    -- B. Refund gagal di gateway
    update public.refunds
    set
      status = 'failed',
      failure_reason = coalesce(p_failure_reason, 'Refund ditolak oleh payment gateway'),
      processed_at = now(),
      updated_at = now()
    where id = p_refund_id;

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
        'Refund gagal di Gateway: ' || coalesce(p_failure_reason, 'Gateway failure'),
        jsonb_build_object('order_id', v_refund.order_id, 'refund_id', p_refund_id),
        jsonb_build_object('order_id', v_refund.order_id, 'status', 'failed', 'failure_reason', p_failure_reason)
      );
    exception when others then
      null;
    end;

    return jsonb_build_object(
      'refund_id', p_refund_id,
      'order_id', v_refund.order_id,
      'status', 'failed',
      'order_status', v_order.status,
      'failure_reason', p_failure_reason,
      'already_finalized', false
    );
  end if;
end;
$$;

revoke all on function public.finalize_refund(uuid, boolean, text, text, timestamptz) from public, anon;
grant execute on function public.finalize_refund(uuid, boolean, text, text, timestamptz) to authenticated, service_role;


-- 4. HARDEN public.transition_order_status (Admin & Service Role Only, Anti-Bypass)
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
  if (auth.uid() is not null and not public.is_admin())
     or (auth.uid() is null and current_setting('role', true) in ('authenticated', 'anon')) then
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

  -- Set trusted transition source context for admin transitions
  perform set_config('app.order_transition_source', 'admin_transition_rpc', true);

  if v_order.status = 'pending' then
    if p_target_status = 'paid' then
      -- GUARD: Admin dilarang menandai pending -> paid tanpa verifikasi payment gateway
      raise exception 'ADMIN_PAYMENT_OVERRIDE_DISABLED: Perubahan status dari "pending" ke "paid" oleh admin dinonaktifkan. Status paid hanya dapat ditetapkan melalui konfirmasi resmi payment gateway (Midtrans).';
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

revoke all on function public.transition_order_status(uuid, text, text) from public, anon;
grant execute on function public.transition_order_status(uuid, text, text) to authenticated, service_role;


-- 5. REVOKE DIRECT EXECUTE ON TRIGGER FUNCTIONS
revoke all on function public.trg_enforce_order_state_machine() from public, anon, authenticated;
