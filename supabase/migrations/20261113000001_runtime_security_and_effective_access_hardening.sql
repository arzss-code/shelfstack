-- =========================================================================
-- Sprint 7 / Task 07: Runtime Security & Effective Access Hardening
-- 1. Orders Table Privilege Lockdown:
--    - REVOKE all UPDATE privileges on public.orders from authenticated, anon, and public
--    - DROP RLS policy "admin update orders"
--    - Restrict service_role UPDATE to snap_token & updated_at only (needed for payment token generation)
--    - Enforces zero direct client-side UPDATE capability on orders (all mutations via server API / canonical RPC)
-- 2. Order Items Immutability Hardening:
--    - REVOKE INSERT, UPDATE, DELETE on public.order_items from authenticated, anon, public
--    - DROP policy "admin all items" (replace with "admin read items" SELECT only)
--    - Ensures order items remain immutable financial records post-checkout
-- 3. Activity Logs Access Hardening:
--    - REVOKE INSERT, UPDATE, DELETE on public.activity_logs from anon, public
-- =========================================================================

-- =========================================================================
-- 1. ORDERS TABLE PRIVILEGE LOCKDOWN
-- =========================================================================
-- Revoke all direct update privileges from client roles
revoke update on public.orders from authenticated, anon, public;

-- Drop RLS policy allowing direct update by admin
drop policy if exists "admin update orders" on public.orders;

-- Restrict service_role to only operational payment token caching
revoke update on public.orders from service_role;
grant update (
  snap_token,
  updated_at
) on public.orders to service_role;


-- =========================================================================
-- 2. ORDER ITEMS IMMUTABILITY HARDENING
-- =========================================================================
-- Revoke direct mutation privileges on order items
revoke insert, update, delete on public.order_items from authenticated, anon, public;

-- Remove broad admin policy that allowed update and delete
drop policy if exists "admin all items" on public.order_items;

-- Restrict admin to read-only on order_items
drop policy if exists "admin read items" on public.order_items;
create policy "admin read items"
on public.order_items for select to authenticated
using (public.is_admin());


-- =========================================================================
-- 3. ACTIVITY LOGS ACCESS HARDENING
-- =========================================================================
-- Ensure unauthenticated/anon callers cannot directly insert or modify activity logs
revoke insert, update, delete on public.activity_logs from anon, public;
