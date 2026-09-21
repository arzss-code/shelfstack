# Phase 4 — Admin Ops Dashboard (Sprint 5, Minggu 10–11)

> Goal: admin kerja tanpa buka Supabase dashboard.
> Backlog: D-01 … D-04 (+ K-06 cancel jika belum, D-05 export optional).

## 1. Layout & Guard

**`app/layouts/admin.vue` (isi penuh, bukan shell kosong lagi):**

- Sidebar: Dashboard, Orders (badge pending count), Products, Activities, kembali ke Toko.
- Topbar: search global kecil (cari order id / nama produk), user menu, mode gelap toggle (reuse).
- `definePageMeta({ middleware:['auth','admin'], layout:'admin' })` di semua `app/pages/admin/*.vue`.
- Mobile: sidebar jadi drawer (`Sidebar` PrimeVue), konten `max-w-[1200px]` konsisten dengan storefront.

## 2. Pages

### `app/pages/admin/index.vue` — KPI

- Cards: Revenue bulan ini (`sum total_cents where status in ('paid','shipped','completed')`), Order pending, Produk low-stock (<5), Customer baru 7 hari.
- Query via `server/api/admin/stats.get.ts` (agregasi SQL, jangan fetch semua orders ke client).
- Chart: `Chart` PrimeVue line 30 hari + bar per status. Tabel: 8 order terbaru + link ke detail.
- Refresh interval 30s + tombol refresh manual (jangan realtime tiap detik).

### `app/pages/admin/orders.vue` + `admin/orders/[id].vue`

- Filter: status multi-select, search id/nama, range tanggal. Pagination server (`from/to` seperti products).
- Aksi: ubah status via `Dropdown` + konfirmasi + catatan (disimpan ke `activity_logs.description`).
- Validasi transisi di client (disable ilegal) + server final (lihat §3).
- Timeline: `pending → paid → shipped → completed` + siapa/ kapan (dari activity_logs).

### `app/pages/admin/products.vue`

- Reuse `ProductForm.vue` + tambah field `stock` (InputNumber), `category` (Dropdown dari `/api/categories`), `price_cents` (tampilkan Rupiah, simpan cents).
- Tabel: thumbnail, nama, kategori, harga, stok (merah jika 0, kuning <5), aksi edit/hapus/restore.
- Tab Sampah reuse `fetchDeletedProducts`. Bulk soft-delete (checkbox) = Should, boleh tunda.

### `app/pages/admin/activities.vue` (pindah dari `app/pages/admin/activities.vue` lama)

- Filter entity (`product/order`), action (`CREATE/UPDATE/DELETE/RESTORE/STATUS`), search description.
- Diff viewer: `old_data vs new_data` JSON pretty + highlight field berubah (nama, harga, stok, status).
- Hanya admin (RLS sudah dikunci Fase 1).

## 3. API Admin

| Endpoint                                     | Akses | Aturan                                                                                                                                   |
| -------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/admin/stats`                       | admin | 4 KPI + series 30 hari, cache 30s                                                                                                        |
| `GET /api/admin/orders?status=&q=&from=&to=` | admin | join user email + total, order desc                                                                                                      |
| `PUT /api/orders/[id]/status`                | admin | Body Zod `{status, note?}`. Cek transisi legal, update, insert `activity_logs {entity_type:'order', action:'UPDATE'}`, return order baru |
| `POST /api/categories`, `PUT/DELETE`         | admin | Zod slug unik                                                                                                                            |

Transisi legal (server enforce):

```ts
const allowed: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
}
```

Cancel harus panggil `cancel_order()` agar stok kembali. Jangan update status manual tanpa restock.

## 4. Test Plan

- E2E `tests/e2e/admin-orders.spec.ts`: login admin → buka order pending → shipped → login customer lihat realtime completed → cek activity muncul.
- Negatif: customer PUT status → 403; transisi ilegal `pending→completed` → 422.
- Visual: sidebar collapse 375px tidak menutupi konten.

## 5. DoD

- [ ] Semua aksi admin bisa tanpa Supabase dashboard. [ ] Setiap ubah status ada jejak activity. [ ] KPI angka sama dengan query SQL manual (uji 1x).
