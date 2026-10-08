-- Migration: RPC Pembatalan Pesanan Atomik (cancel_order) & Restock Produk
-- Referensi: User Story K-06 (Sprint 4 / Fase 3)

create or replace function public.cancel_order(p_order_id uuid, p_reason text default 'Dibatalkan oleh pelanggan')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_user_id uuid;
  r record;
begin
  -- 1. Validasi autentikasi
  if auth.uid() is null then
    raise exception 'Unauthorized: Pengguna harus login untuk membatalkan pesanan';
  end if;

  -- 2. Kunci baris order FOR UPDATE
  select status, user_id into v_status, v_user_id
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  -- 3. Validasi hak akses (Hanya pemilik atau admin yang berhak)
  if v_user_id != auth.uid() and not public.is_admin() then
    raise exception 'Forbidden: Anda tidak memiliki izin untuk membatalkan pesanan ini';
  end if;

  -- 4. Validasi status order (Hanya 'pending' yang boleh dibatalkan)
  if v_status != 'pending' then
    raise exception 'Hanya pesanan dengan status pending yang dapat dibatalkan (status saat ini: %)', v_status;
  end if;

  -- 5. Restock kuantitas produk secara atomik
  for r in select product_id, qty from public.order_items where order_id = p_order_id loop
    update public.products
    set stock = stock + r.qty
    where id = r.product_id;
  end loop;

  -- 6. Perbarui status pesanan menjadi 'cancelled'
  update public.orders
  set status = 'cancelled', updated_at = now()
  where id = p_order_id;

  -- 7. Catat audit log ke activity_logs
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
      'UPDATE',
      coalesce(p_reason, 'Pesanan dibatalkan'),
      jsonb_build_object('order_id', p_order_id, 'status', v_status),
      jsonb_build_object('order_id', p_order_id, 'status', 'cancelled')
    );
  exception when others then
    null;
  end;

  return true;
end;
$$;

grant execute on function public.cancel_order(uuid, text) to authenticated;
