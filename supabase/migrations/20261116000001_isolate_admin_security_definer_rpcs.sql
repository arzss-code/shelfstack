-- =========================================================================
-- MIGRATION: 20261116000001_isolate_admin_security_definer_rpcs.sql
-- Task 07.4: Isolate Admin-Only SECURITY DEFINER RPCs (Strict Least-Privilege)
-- 
-- 1. Cabut hak EXECUTE dari PUBLIC, anon, dan authenticated untuk:
--    - public.create_refund_attempt(uuid, text, text)
--    - public.finalize_refund(uuid, boolean, text, text, timestamptz)
--    - public.transition_order_status(uuid, text, text)
-- 
-- 2. Berikan hak EXECUTE secara eksklusif kepada role service_role.
-- 
-- Rationale:
-- Seluruh pemanggil runtime ketiga fungsi ini berada di Nitro server-side API:
-- - /api/orders/[id]/refund (didahului verifikasi requireAdmin)
-- - /api/orders/[id]/status (didahului verifikasi requireAdmin)
-- - /api/orders/[id]/check-payment-status (reconciliation)
-- Tidak ada client browser atau customer yang memerlukan akses langsung via PostgREST.
-- Dengan isolasi ini, ketiga fungsi kebal dari akses RPC publik / authenticated,
-- dan peringatan Security Advisor 'authenticated_security_definer' tereliminasi.
-- =========================================================================

-- 1. ISOLATE create_refund_attempt
revoke all on function public.create_refund_attempt(
  uuid, text, text
) from public, anon, authenticated;

grant execute on function public.create_refund_attempt(
  uuid, text, text
) to service_role;


-- 2. ISOLATE finalize_refund
revoke all on function public.finalize_refund(
  uuid, boolean, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.finalize_refund(
  uuid, boolean, text, text, timestamptz
) to service_role;


-- 3. ISOLATE transition_order_status
revoke all on function public.transition_order_status(
  uuid, text, text
) from public, anon, authenticated;

grant execute on function public.transition_order_status(
  uuid, text, text
) to service_role;
