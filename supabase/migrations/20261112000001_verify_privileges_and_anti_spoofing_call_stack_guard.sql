-- =========================================================================
-- Sprint 6 / Task 06.2: Verify Database Privileges & Anti-Spoofing Call-Stack Guard
-- 1. Table & Column Level Privilege Hardening:
--    - REVOKE table-level UPDATE on public.orders from public, anon, authenticated, service_role
--    - GRANT column-level UPDATE on safe operational fields only (snap_token, payment_type, midtrans_id, address, cancellation_reason, updated_at)
--    - Explicitly blocks direct column update on status, paid_at, cancelled_at, refunded_at, total_cents
-- 2. Anti-Spoofing Call-Stack Guard in Trigger (Defense-in-Depth):
--    - Uses PL/pgSQL GET DIAGNOSTICS ... PG_CONTEXT to inspect the actual execution call chain
--    - Rejects context forgery (e.g. SELECT set_config('app.order_transition_source', ...))
--    - Enforces that mutations must physically originate from trusted canonical RPC functions
-- 3. Strict Function Execute Grants & Security Definer Integrity
-- =========================================================================

-- =========================================================================
-- 1. REVOKE TABLE-LEVEL UPDATE & GRANT RESTRICTED OPERATIONAL COLUMNS ONLY
-- =========================================================================
-- In PostgreSQL, table-level UPDATE grants access to all columns regardless of column revokes.
-- We must revoke table-level UPDATE completely from client & service roles.
revoke update on public.orders from public, anon, authenticated, service_role;

-- Grant column-level UPDATE on safe non-financial operational fields only
grant update (
  address,
  snap_token,
  payment_type,
  midtrans_id,
  cancellation_reason,
  updated_at
) on public.orders to authenticated, service_role;


-- =========================================================================
-- 2. HARDENED TRIGGER: CALL STACK (PG_CONTEXT) & CONTEXT SOURCE GUARD
-- =========================================================================
create or replace function public.trg_enforce_order_state_machine()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_source text;
  v_call_stack text;
begin
  -- 2.1. Jika status tidak berubah, izinkan operasi update pada kolom operasional lainnya
  if old.status is not distinct from new.status then
    return new;
  end if;

  -- 2.2. Dapatkan call stack PL/pgSQL aktual (Call Chain Inspection)
  get diagnostics v_call_stack = pg_context;

  -- 2.3. Validasi Session Transaction Setting (app.order_transition_source)
  v_source := nullif(current_setting('app.order_transition_source', true), '');

  if v_source is null then
    raise exception 'DIRECT_STATUS_MUTATION_FORBIDDEN: Perubahan status pesanan dari "%" ke "%" ditolak. Direct SQL UPDATE dilarang; seluruh perubahan status wajib melalui canonical RPC resmi yang menjalankan business side-effects secara atomik.', old.status, new.status;
  end if;

  -- 2.4. Guard: Status Terminal (completed, cancelled, refunded) bersifat mutlak dan tidak boleh diubah
  if old.status in ('completed', 'cancelled', 'refunded') then
    raise exception 'TERMINAL_ORDER_STATE: Pesanan dalam status "%" bersifat terminal dan tidak dapat diubah lagi ke "%"', old.status, new.status;
  end if;

  -- 2.5. Anti-Spoofing: Verifikasi Otoritas Sumber & Call Stack Integrity
  -- Memastikan mutasi status tidak hanya memiliki custom setting, tetapi secara fisik
  -- dieksekusi dari dalam canonical RPC yang mengelola seluruh side effects transaksi secara utuh.
  if new.status = 'paid' then
    if v_source <> 'payment_webhook' or v_call_stack not like '%handle_payment_webhook%' then
      raise exception 'INVALID_TRANSITION_SOURCE: Status "paid" hanya dapat ditetapkan melalui payment webhook resmi (source: %, call stack tidak valid)', v_source;
    end if;
  elsif new.status = 'cancelled' then
    if v_source not in ('cancel_order_rpc', 'payment_webhook', 'admin_transition_rpc') or
       (v_call_stack not like '%cancel_order%' and
        v_call_stack not like '%handle_payment_webhook%' and
        v_call_stack not like '%transition_order_status%') then
      raise exception 'INVALID_TRANSITION_SOURCE: Status "cancelled" hanya dapat diubah melalui cancellation RPC resmi (source: %, call stack tidak valid)', v_source;
    end if;
  elsif new.status in ('shipped', 'completed') then
    if v_source <> 'admin_transition_rpc' or v_call_stack not like '%transition_order_status%' then
      raise exception 'INVALID_TRANSITION_SOURCE: Status "%" hanya dapat diubah melalui admin transition RPC resmi (source: %, call stack tidak valid)', new.status, v_source;
    end if;
  elsif new.status = 'refunded' then
    if v_source <> 'finalize_refund_rpc' or v_call_stack not like '%finalize_refund%' then
      raise exception 'INVALID_TRANSITION_SOURCE: Status "refunded" hanya dapat diubah melalui finalize_refund RPC resmi (source: %, call stack tidak valid)', v_source;
    end if;
  end if;

  -- 2.6. Validasi Matriks Transisi Status Resmi
  if old.status = 'pending' and new.status not in ('paid', 'cancelled') then
    raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', old.status, new.status;
  elsif old.status = 'paid' and new.status not in ('shipped', 'refunded') then
    raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', old.status, new.status;
  elsif old.status = 'shipped' and new.status not in ('completed') then
    raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', old.status, new.status;
  end if;

  -- 2.7. Invariant: Pastikan timestamp transisi terisi otomatis jika belum ada
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


-- =========================================================================
-- 3. FUNCTION PRIVILEGES & SECURITY HARDENING
-- =========================================================================
-- Revoke all function execution from anon & public
revoke all on function public.handle_payment_webhook(uuid, text, text, text) from public, anon;
grant execute on function public.handle_payment_webhook(uuid, text, text, text) to service_role;

revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated, service_role;

revoke all on function public.transition_order_status(uuid, text, text) from public, anon;
grant execute on function public.transition_order_status(uuid, text, text) to authenticated, service_role;

revoke all on function public.finalize_refund(uuid, boolean, text, text, timestamptz) from public, anon;
grant execute on function public.finalize_refund(uuid, boolean, text, text, timestamptz) to authenticated, service_role;
