-- Sprint 5 / Task 03: Order State Machine & Admin Status Transition Hardening
-- 1. Database RPC transition_order_status dengan SELECT ... FOR UPDATE (Anti-TOCTOU Race)
-- 2. State Machine Invariants Enforcement:
--    - pending -> paid (Tandai lunas, update sold_count)
--    - pending -> cancelled (Restock atomik produk, catat stock ledger)
--    - paid -> shipped (Update status)
--    - shipped -> completed (Update status)
--    - paid -> cancelled: DITOLAK (karena belum ada refund flow)
--    - shipped / completed / cancelled -> cancelled: DITOLAK
--    - Rollback status (misal completed -> paid, shipped -> pending): DITOLAK
--    - Duplicate same-status transition: IDEMPOTENT NO-OP

create or replace function public.transition_order_status(
  p_order_id uuid,
  p_target_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  r record;
begin
  -- 1. Authorization check: hanya administrator atau service_role / postgres
  if auth.uid() is not null and not public.is_admin() and current_user not in ('service_role', 'postgres') then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang dapat memperbarui status pesanan';
  end if;

  -- 2. Kunci baris order secara eksklusif FOR UPDATE (mencegah TOCTOU race)
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND: Pesanan tidak ditemukan';
  end if;

  -- 3. Idempotent check: jika sudah di target status, kembalikan no-op success
  if v_order.status = p_target_status then
    return jsonb_build_object(
      'order_id', p_order_id,
      'current_status', v_order.status,
      'previous_status', v_order.status,
      'no_op', true,
      'message', 'Status pesanan sudah dalam status target (' || p_target_status || ')'
    );
  end if;

  -- 4. Validasi State Machine & Invariant Mutasi
  if v_order.status = 'pending' then
    if p_target_status = 'paid' then
      -- Invariant: Tandai lunas, perbarui sold_count
      update public.orders
      set
        status = 'paid',
        paid_at = coalesce(paid_at, now()),
        updated_at = now()
      where id = p_order_id;

      for r in select product_id, qty from public.order_items where order_id = p_order_id loop
        update public.products
        set sold_count = sold_count + r.qty
        where id = r.product_id;
      end loop;

    elsif p_target_status = 'cancelled' then
      -- Invariant: Batalkan pesanan dan restock produk secara atomik
      perform set_config('app.stock_change_reason', 'admin_order_cancellation', true);
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

      for r in select product_id, qty from public.order_items where order_id = p_order_id loop
        update public.products
        set stock = stock + r.qty
        where id = r.product_id;
      end loop;

      update public.orders
      set
        status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = coalesce(p_reason, 'Dibatalkan oleh Administrator'),
        updated_at = now()
      where id = p_order_id;

    else
      raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', v_order.status, p_target_status;
    end if;

  elsif v_order.status = 'paid' then
    if p_target_status = 'shipped' then
      update public.orders
      set
        status = 'shipped',
        updated_at = now()
      where id = p_order_id;

    elsif p_target_status = 'cancelled' then
      raise exception 'INVALID_ORDER_TRANSITION: Pesanan berstatus paid tidak dapat dibatalkan tanpa proses refund resmi (fitur refund belum tersedia)';

    else
      raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', v_order.status, p_target_status;
    end if;

  elsif v_order.status = 'shipped' then
    if p_target_status = 'completed' then
      update public.orders
      set
        status = 'completed',
        updated_at = now()
      where id = p_order_id;

    else
      raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', v_order.status, p_target_status;
    end if;

  elsif v_order.status in ('completed', 'cancelled') then
    raise exception 'INVALID_ORDER_TRANSITION: Pesanan sudah berada dalam status terminal (%) dan tidak dapat diubah lagi', v_order.status;

  else
    raise exception 'INVALID_ORDER_TRANSITION: Status pesanan tidak dikenal: %', v_order.status;
  end if;

  -- 5. Catat audit log di activity_logs secara transaksional
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
      coalesce(p_reason, 'Status pesanan diubah dari ' || v_order.status || ' ke ' || p_target_status || ' oleh Administrator'),
      jsonb_build_object('order_id', p_order_id, 'status', v_order.status),
      jsonb_build_object('order_id', p_order_id, 'status', p_target_status)
    );
  exception when others then
    -- Fail safe jika table activity_logs mengalami isu non-kritis
    null;
  end;

  return jsonb_build_object(
    'order_id', p_order_id,
    'current_status', p_target_status,
    'previous_status', v_order.status,
    'no_op', false,
    'message', 'Status pesanan berhasil diubah menjadi ' || p_target_status
  );
end;
$$;

-- Hak akses eksekusi RPC
revoke execute on function public.transition_order_status(uuid, text, text) from public;
grant execute on function public.transition_order_status(uuid, text, text) to authenticated;
grant execute on function public.transition_order_status(uuid, text, text) to service_role;
