# Phase 1 — Auth & Security (Sprint 2, Minggu 3–5)

> Goal: login 2 role + RLS strict. Sprint penentu kredibilitas Fullstack.
> Backlog: A-01, A-03, A-04, A-06 (+ A-02 OAuth jika sempat).

## 1. Skema SQL (migrasi berurutan)

### 1.1 `2026XXXXXX_profiles_categories_base.sql`

```sql
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

alter table public.products
  add column if not exists stock int not null default 0,
  add column if not exists category_id uuid references public.categories(id),
  add column if not exists price_cents int;

-- backfill sekali, lalu jadikan NOT NULL di migrasi berikut setelah verifikasi
update public.products set price_cents = round((price::numeric)*100)::int where price_cents is null;

-- trigger auto profiles
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), 'customer')
  on conflict (user_id) do nothing;
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
```

### 1.2 `2026XXXXXX_rls_strict.sql`

```sql
-- PRODUCTS: cabut policy true lama, ganti strict
drop policy if exists "Izinkan semua orang membaca data" on public.products;
drop policy if exists "Izinkan semua orang menambah data" on public.products;
drop policy if exists "Izinkan semua orang mengedit data" on public.products;
drop policy if exists "Izinkan semua orang menghapus data" on public.products;

create policy "public read active products"
on public.products for select to anon, authenticated
using (deleted_at is null);

create policy "admin write products"
on public.products for all to authenticated
using (exists (select 1 from public.profiles where user_id = auth.uid() and role='admin'))
with check (exists (select 1 from public.profiles where user_id = auth.uid() and role='admin'));

-- PROFILES
alter table public.profiles enable row level security;
create policy "owner or admin read profiles"
on public.profiles for select to authenticated
using (user_id = auth.uid() or public.is_admin());
-- TIDAK ada policy owner-update: kolom role satu baris dengan data user,
-- jadi update milik-sendiri = self-promote. Hanya admin boleh update profiles.

-- ACTIVITY: kunci tulis anon
drop policy if exists "Allow anyone to insert activity logs" on public.activity_logs;
drop policy if exists "Allow anyone to read activity logs" on public.activity_logs;
create policy "authenticated insert logs" on public.activity_logs for insert to authenticated with check (true);
create policy "admin read logs" on public.activity_logs for select to authenticated
using (exists (select 1 from public.profiles where user_id=auth.uid() and role='admin'));
```

### 1.3 Storage `product-images`

- `SELECT`: public.
- `INSERT/UPDATE/DELETE`: `authenticated` + `profiles.role='admin'`.
- Batas: `5MB`, mime `image/jpeg,image/png,image/webp`. Buat via dashboard + catat sebagai SQL di migrasi agar reproducible.

## 2. Nuxt Auth

**Baru:**

- `app/features/auth/composables/useAuth.ts` — `signUp, signIn, signInWithGoogle, signOut, session, profile, isAdmin`. Error mapping ID: "Email sudah terdaftar", "Password minimal 8 karakter".
- `app/middleware/auth.ts` — jika tidak ada session → `/auth/login?redirect=<path>`.
- `app/middleware/admin.ts` — fetch `profiles.role`; jika bukan admin → `/` + toast 403.
- `app/pages/auth/login.vue`, `register.vue` — PrimeVue `InputText/Password/Button`, Zod client, link silang login/register.
- `app/layouts/admin.vue` — sidebar kosong (diisi penuh Fase 4), guard `admin` di `definePageMeta`.
- `server/api/auth/me.get.ts` — return `{user, profile}` dari `serverSupabaseUser + client from profiles`. Dipakai untuk sinkron role server.

**Edit:**

- `app/components/AppNavbar.vue` — tampilkan Login/Daftar saat anon; avatar + dropdown (Profil, Orders, Admin jika admin, Logout) saat login. Badge cart disiapkan (diisi Fase 3).
- `supabase/config.toml:159-163` — `site_url` + `additional_redirect_urls` tambah URL Vercel preview + prod.

## 3. API Contract Auth

| Endpoint                          | Akses         | Body/Return                                                    |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `POST /auth/v1/signup` (Supabase) | anon          | `{email, password, full_name}` → session                       |
| `GET /api/auth/me` (Nuxt)         | authenticated | `{user, profile:{role}}`                                       |
| `GET /api/products`               | public        | tetap, tapi RLS yang batasi                                    |
| `POST /api/products`              | admin only    | Zod + cek `me.role==='admin'` sebelum query, RLS tetap enforce |

## 4. Test Plan

- E2E `tests/e2e/auth.spec.ts`: register random email → login → `/admin` sebagai customer 403 → login admin 200.
- Negatif: POST anon ke `/api/products` → 401/403; customer POST → 403; buktikan screenshot Network.
- Storage: customer upload → 403; admin upload 6MB → ditolak ramah.

## 5. DoD Phase 1 (status 2026-09-18)

- [x] Kode + migrasi selesai: `useAuth`, middleware, halaman auth, layout admin shell, guard server, `auth.spec.ts` 6/6 hijau (2 run).
- [x] `version.json 0.10.0-s2` + CHANGELOG.
- [ ] Migrasi **belum di-push ke Cloud** (butuh `supabase link` + `db push` — aksi manusia, lihat Note CHANGELOG).
- [ ] Trigger `handle_new_user` + RLS diverifikasi di Cloud setelah push (matriks §4).
- [ ] Akun admin pertama dibuat + role diupdate via SQL Editor.

### Pelajaran E2E Sprint 2 (dicatat agar tidak terulang)

1. Hidrasi dev lambat (~4.4s): test UI wajib `waitForHydration` (`tests/e2e/helpers.ts`), jangan klik buta setelah `goto`.
2. Locator salah sasaran: header PrimeVue Dialog = span (bukan heading); tombol navbar vs form bisa kembar nama → scope ke `main`.
3. Klik pertama kadang tertelan pre-hydration: pola `expect.poll` + klik-ulang untuk aksi kritis.
4. Temuan sampingan: `tests/e2e` lama (modal heading, `input#price` currency) diperbaiki dengan pola yang sama.
