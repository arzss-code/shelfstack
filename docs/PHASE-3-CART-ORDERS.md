# Phase 3 — Cart & Orders (Sprint 4, Minggu 7–9)

> Goal: checkout atomik + realtime status. Sprint paling sensitif — jangan tambah payment real.
> Backlog: K-01 … K-05 (+ K-06 cancel jika sempat).

## 1. Skema SQL `2026XXXXXX_orders.sql`

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  total_cents int not null check (total_cents >= 0),
  status text not null default 'pending'
    check (status in ('pending','paid','shipped','completed','cancelled')),
  address jsonb not null,
  created_at timestamptz default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  qty int not null check (qty > 0),
  price_cents int not null check (price_cents >= 0)
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- customer: baca miliknya, insert miliknya
create policy "owner read orders" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "owner insert orders" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "owner read items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
-- admin full via profiles check (tambah policy admin read/update untuk kedua tabel, pola sama seperti products)

-- RPC atomik
create or replace function public.create_order(p_items jsonb, p_address jsonb)
returns uuid as $$
declare v_order uuid; v_total int := 0; r record;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Keranjang kosong'; end if;
  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;
  for r in select * from jsonb_to_recordset(p_items) as (product_id bigint, qty int) loop
    if r.qty <= 0 then raise exception 'Qty invalid %', r.product_id; end if;
    perform 1 from public.products where id = r.product_id and deleted_at is null for update;
    if not found then raise exception 'Produk % tidak tersedia', r.product_id; end if;
    -- kunci stok, cek cukup
    update public.products set stock = stock - r.qty
    where id = r.product_id and stock >= r.qty;
    if not found then raise exception 'Stok kurang untuk produk %', r.product_id; end if;
    insert into public.order_items (order_id, product_id, qty, price_cents)
    select v_order, r.product_id, r.qty, price_cents from public.products where id = r.product_id;
    v_total := v_total + (select price_cents * r.qty from public.products where id = r.product_id);
  end loop;
  update public.orders set total_cents = v_total where id = v_order;
  return v_order;
end; $$ language plpgsql security definer;

create or replace function public.cancel_order(p_order uuid) returns void as $$
begin
  -- hanya owner pending/paid atau admin; kembalikan stok; tulis activity di API layer
  -- (implementasi penuh saat coding, prinsip: lock order FOR UPDATE, cek status, update + restore stock)
  raise exception 'implement di sprint (lihat template repo)';
end; $$ language plpgsql security definer;
```

Kenapa RPC `security definer` + `auth.uid()`? Agar cek stok + decrement + insert tidak bisa di-tamper client (misal kirim `total: 0`). Total selalu dihitung server dari `price_cents` asli. Lihat `ADR/003-price-cents-rpc.md`.

## 2. Zod Orders `app/features/orders/schema.ts`

```ts
import { z } from 'zod'
export const checkoutSchema = z.object({
  items: z
    .array(z.object({ product_id: z.number().int(), qty: z.number().int().min(1).max(99) }))
    .min(1),
  address: z.object({
    name: z.string().min(3),
    phone: z.string().min(9),
    street: z.string().min(10),
    city: z.string().min(3),
    postal: z.string().min(5),
    note: z.string().max(300).optional(),
  }),
})
```

## 3. Nuxt Cart + Pages

**Baru:**

- `app/features/cart/stores/cart.ts` — state `items: {product_id, qty, snapshot?}[]`, persist `localStorage 'shelfstack-cart'`, getters `count, total_cents (pakai snapshot price, revalidasi server saat checkout)`.
- `app/features/cart/components/CartDrawer.vue` — drawer kanan, qty stepper, hapus, subtotal, CTA Checkout.
- `app/pages/cart.vue` — tabel full untuk mobile + desktop.
- `app/pages/checkout.vue` — guard `auth`, form alamat + review + tombol `Buat Order` → `POST /api/orders` → redirect `/orders/[id]`.
- `app/pages/orders.vue`, `orders/[id].vue` — riwayat + detail + tombol `Bayar (Simulasi)` + `Batalkan` + timeline status + realtime subscribe.
- `server/api/orders/index.ts` — POST: Zod + `serverSupabaseClient` + `rpc('create_order')`. GET: list milik user (paginasi).
- `server/api/orders/[id].ts` — GET detail milik user (join items + products).
- `server/api/orders/[id]/pay.post.ts` — mock: `pending→paid` milik user (untuk demo, bukan payment real).

**Edit:**

- `app/layouts/default.vue` — mount `CartDrawer` + badge count di `AppNavbar.vue`.
- `app/pages/product/[id].vue` — tombol keranjang hubungkan ke `cartStore.add()` + toast + buka drawer.

## 4. Realtime

- Customer: `supabase.channel('orders-user').on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders',filter:`user_id=eq.${uid}`}, refresh)`.
- Admin: channel `orders-all` (hanya di layout admin, hanya jika admin).
- Selalu `removeChannel` on unmount. Enable tabel `orders` di Realtime publication (dashboard / migrasi `enable_realtime` seperti `20260818102146_enable_realtime.sql`).

## 5. Status Machine (legal)

```
pending → paid → shipped → completed
pending → cancelled | paid → cancelled (restock)
shipped → completed (tidak bisa cancel)
```

Validasi di server (`status.put.ts` Fase 4) + client disable tombol ilegal.

## 6. Test Plan

- Unit: cart total, persist/rehydrate, checkoutSchema invalid (telp pendek, keranjang kosong).
- E2E `tests/e2e/checkout.spec.ts`: seed produk stok 5 → add 2 → checkout → order pending → pay mock → paid → stok jadi 3 di DB.
- Negatif: checkout qty > stok → error per item; user B buka order user A → 403/404.

## 7. DoD

- [ ] Tidak ada insert `orders` langsung dari client tanpa RPC.
- [ ] Total selalu dari server. [ ] Realtime jalan 2 arah (customer lihat update admin).
- [ ] `version.json 0.12.0-s4`.
