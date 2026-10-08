# Phase 3 — Cart & Orders (Sprint 4, Minggu 7–9)

> Goal: checkout atomik + Midtrans Sandbox Snap + verified webhook + realtime status. Sprint paling sensitif — jangan gunakan live production credentials.
> Backlog: K-01 … K-05 (+ K-06 cancel jika sempat).
> Referensi Desain: `docs/superpowers/specs/2026-10-01-cart-orders-midtrans-design.md`

## 1. Skema SQL `20261001000001_orders_and_checkout_rpc.sql`

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  total_cents int not null check (total_cents >= 0),
  status text not null default 'pending'
    check (status in ('pending','paid','shipped','completed','cancelled')),
  address jsonb not null,
  snap_token text,
  payment_type text,
  midtrans_id text,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

-- customer: baca miliknya saja. DILARANG direct insert/update dari client!
-- Pembuatan order HANYA via security definer RPC create_order().
create policy "owner read orders" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "owner read items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- admin full access via profiles
create policy "admin all orders" on public.orders for all to authenticated using (
  exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.role = 'admin')
);
create policy "admin all items" on public.order_items for all to authenticated using (
  exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.role = 'admin')
);

-- RPC atomik (Security Definer)
create or replace function public.create_order(p_items jsonb, p_address jsonb)
returns uuid as $$
declare
  v_order uuid;
  v_total int := 0;
  r record;
  v_price int;
  v_stock int;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;

  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  for r in select * from jsonb_to_recordset(p_items) as (product_id bigint, qty int) loop
    if r.qty <= 0 then
      raise exception 'Qty invalid untuk produk %', r.product_id;
    end if;

    -- Kunci baris produk FOR UPDATE untuk mencegah race condition stok
    select price_cents, stock into v_price, v_stock
    from public.products
    where id = r.product_id and deleted_at is null
    for update;

    if not found then
      raise exception 'Produk % tidak tersedia', r.product_id;
    end if;

    if v_stock < r.qty then
      raise exception 'Stok tidak cukup untuk produk %', r.product_id;
    end if;

    -- Kurangi stok
    update public.products
    set stock = stock - r.qty
    where id = r.product_id;

    -- Masukkan order item dengan snapshot price_cents asli dari server
    insert into public.order_items (order_id, product_id, qty, price_cents)
    values (v_order, r.product_id, r.qty, v_price);

    v_total := v_total + (v_price * r.qty);
  end loop;

  update public.orders
  set total_cents = v_total
  where id = v_order;

  return v_order;
end; $$ language plpgsql security definer;

-- Enable Supabase Realtime publication
alter publication supabase_realtime add table public.orders;
```

Kenapa RPC `security definer` + `auth.uid()`? Agar validasi stok, pengurangan stok atomik, dan kalkulasi total tidak bisa di-tamper oleh client (misal injeksi total 0). Total selalu dihitung server dari `price_cents` produk di DB. (Lihat `ADR/003-price-cents-rpc.md`).

## 2. Shared Zod Order Schema `shared/schemas/order.ts`

```ts
import { z } from 'zod'

export const checkoutItemSchema = z.object({
  product_id: z.number().int().positive(),
  qty: z.number().int().min(1).max(99),
})

export const checkoutAddressSchema = z.object({
  name: z.string().min(3, 'Nama penerima minimal 3 karakter.'),
  phone: z
    .string()
    .min(9, 'Nomor telepon minimal 9 digit.')
    .max(15, 'Nomor telepon maksimal 15 digit.'),
  street: z.string().min(10, 'Alamat lengkap minimal 10 karakter.'),
  city: z.string().min(3, 'Kota/Kabupaten minimal 3 karakter.'),
  postal: z.string().min(5, 'Kode pos minimal 5 karakter.').max(10),
  note: z.string().max(300, 'Catatan maksimal 300 karakter.').optional(),
})

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Keranjang tidak boleh kosong.'),
  address: checkoutAddressSchema,
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
```

## 3. Nuxt Cart, Pages & Server Endpoints

**File Baru:**

- `app/features/cart/stores/cart.ts` — Pinia store, persist `localStorage 'shelfstack-cart'`, actions: `addItem`, `updateQuantity`, `removeItem`, `clearCart`. Getters: `totalItems`, `totalPriceCents`, `formattedTotalPrice`.
- `app/features/cart/components/CartDrawer.vue` — drawer slide-over dari kanan, stepper kuantitas, subtotal, tombol Checkout.
- `app/pages/cart.vue` — halaman ringkasan keranjang belanja penuh.
- `app/pages/checkout.vue` — guard autentikasi, form alamat Zod, ringkasan barang, tombol buat pesanan.
- `app/pages/orders/index.vue` & `app/pages/orders/[id].vue` — daftar riwayat & halaman detail pesanan, tombol bayar Snap (jika pending), timeline status, dan realtime subscribe.
- `server/api/orders/index.post.ts` — validasi Zod body, panggil RPC `create_order`, return order ID.
- `server/api/orders/index.get.ts` — query daftar order milik user terautentikasi dengan paginasi.
- `server/api/orders/[id].get.ts` — query detail pesanan (join `order_items` & `products`).
- `server/api/orders/[id]/payment-token.post.ts` — membuat token Midtrans Snap untuk order status pending.
- `server/api/midtrans/notification.post.ts` — webhook Midtrans: validasi SHA-512 signature (`order_id + status_code + gross_amount + server_key`), mapping status (`settlement/capture` -> `paid`, `cancel/expire` -> `cancelled`), update order.

**File Dimodifikasi:**

- `app/layouts/default.vue` — mount `CartDrawer` global.
- `app/components/AppNavbar.vue` — hubungkan Cart pill ke `cartStore.totalItems` dan event buka drawer.
- `app/pages/product/[id].vue` — integrasikan konfigurator ke `cartStore.addItem` dan auto-open drawer.
- `.env.example` — dokumentasikan variabel Midtrans Sandbox.

## 4. Realtime Synchronization

- Customer: `supabase.channel('user-orders').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'user_id=eq.' + uid }, refresh).subscribe()`.
- Unsubscribe saat `onUnmounted`.

## 5. Status Machine Transisi

```
pending → paid → shipped → completed
pending → cancelled
paid → cancelled (refund/restock)
shipped → completed (tidak bisa dibatalkan)
```

## 6. Testing & Verifikasi

- Unit test: `tests/unit/order-schema.spec.ts` (validasi form checkout dan item keranjang).
- Unit test: `tests/unit/cart-store.spec.ts` (kalkulasi total belanja dan persistensi keranjang).
- Unit test: `tests/unit/midtrans-webhook.spec.ts` (verifikasi SHA-512 signature kalkulasi dan mapping status).
- Linter & Typecheck: `pnpm lint` dan `pnpm vitest run`.

## 7. Definition of Done (DoD)

- [ ] Tidak ada direct insert ke `orders` dari client; order dibuat eksklusif lewat RPC `create_order`.
- [ ] Total harga selalu dihitung di server dari `price_cents` produk di DB.
- [ ] Cart tersimpan di `localStorage ('shelfstack-cart')` dan tidak hilang saat refresh halaman.
- [ ] Midtrans Snap terbuka saat pembayaran, dan webhook memverifikasi SHA-512 sebelum mengubah status menjadi `paid`.
- [ ] Status pesanan di halaman detail terupdate otomatis (Realtime) tanpa reload saat pembayaran diselesaikan di sandbox.
