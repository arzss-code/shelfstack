-- Sprint 8 / Fase 3: Dompet "Voucher Saya" & Klaim Kupon Pelanggan (SHF-VOUCHER-WALLET)
-- 1. Tabel public.user_coupons (Penyimpanan voucher yang diklaim pelanggan)
-- 2. Index performa untuk dompet dan relasi user
-- 3. Row Level Security (RLS) terisolasi per user_id
-- 4. RPC claim_coupon_to_wallet() transaksional dan aman

-- 1. TABEL PUBLIC.USER_COUPONS
create table if not exists public.user_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  status text not null default 'claimed' check (status in ('claimed', 'used', 'expired')),
  used_at timestamptz,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_user_coupon unique (user_id, coupon_id)
);

-- 2. INDEXING EFISIEN
create index if not exists idx_user_coupons_user_status 
on public.user_coupons (user_id, status);

create index if not exists idx_user_coupons_user_claimed 
on public.user_coupons (user_id, claimed_at desc);

create index if not exists idx_user_coupons_coupon_id 
on public.user_coupons (coupon_id);

-- 3. ROW LEVEL SECURITY (RLS)
alter table public.user_coupons enable row level security;

-- Pengguna terautentikasi hanya dapat membaca voucher di dompet mereka sendiri
drop policy if exists "allow user read own vouchers" on public.user_coupons;
create policy "allow user read own vouchers"
on public.user_coupons for select
to authenticated
using ((select auth.uid()) = user_id);

-- Pengguna terautentikasi dapat memperbarui status voucher mereka sendiri
drop policy if exists "allow user update own vouchers" on public.user_coupons;
create policy "allow user update own vouchers"
on public.user_coupons for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Pengguna terautentikasi dapat menyisipkan voucher mereka sendiri
drop policy if exists "allow user insert own vouchers" on public.user_coupons;
create policy "allow user insert own vouchers"
on public.user_coupons for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Admin dapat membaca semua voucher pengguna
drop policy if exists "admin read all user vouchers" on public.user_coupons;
create policy "admin read all user vouchers"
on public.user_coupons for select
to authenticated
using (public.is_admin());

-- 4. RPC FUNCTION: CLAIM_COUPON_TO_WALLET
create or replace function public.claim_coupon_to_wallet(
  p_coupon_id uuid default null,
  p_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_coupon record;
  v_existing_claim uuid;
  v_usage_count int;
  v_new_id uuid;
  v_result jsonb;
begin
  -- 1. Validasi sesi user terautentikasi
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Harap login terlebih dahulu untuk mengklaim voucher.';
  end if;

  -- 2. Cari kupon berdasarkan ID atau Kode Promo
  if p_coupon_id is not null then
    select * into v_coupon
    from public.coupons
    where id = p_coupon_id
      and is_active = true
      and deleted_at is null;
  elsif p_code is not null and trim(p_code) <> '' then
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(trim(p_code))
      and is_active = true
      and deleted_at is null;
  else
    raise exception 'ID kupon atau kode promo harus diberikan.';
  end if;

  if v_coupon.id is null then
    raise exception 'Kupon promo tidak ditemukan atau sudah tidak aktif.';
  end if;

  -- 3. Validasi masa berlaku (starts_at & expires_at)
  if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
    raise exception 'Kupon promo ini belum dapat digunakan.';
  end if;

  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    raise exception 'Kupon promo ini telah kedaluwarsa.';
  end if;

  -- 4. Validasi kuota global (usage_limit)
  if v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit then
    raise exception 'Kuota kupon promo ini telah habis.';
  end if;

  -- 5. Cek apakah user sudah mengklaim kupon ini
  select id into v_existing_claim
  from public.user_coupons
  where user_id = v_user_id
    and coupon_id = v_coupon.id;

  if v_existing_claim is not null then
    raise exception 'Voucher ini sudah tersimpan di dompet Anda.';
  end if;

  -- 6. Cek batas penggunaan per-user (user_limit)
  select count(*) into v_usage_count
  from public.coupon_usages
  where user_id = v_user_id
    and coupon_id = v_coupon.id;

  if v_coupon.user_limit is not null and v_usage_count >= v_coupon.user_limit then
    raise exception 'Anda telah mencapai batas maksimal pemakaian kupon ini.';
  end if;

  -- 7. Insert ke dompet user_coupons
  insert into public.user_coupons (
    user_id,
    coupon_id,
    status
  ) values (
    v_user_id,
    v_coupon.id,
    'claimed'
  )
  returning id into v_new_id;

  -- 8. Return response sukses
  select jsonb_build_object(
    'user_coupon_id', v_new_id,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'name', v_coupon.name,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'min_purchase_cents', v_coupon.min_purchase_cents,
    'max_discount_cents', v_coupon.max_discount_cents,
    'expires_at', v_coupon.expires_at,
    'claimed_at', now()
  ) into v_result;

  return v_result;
end;
$$;
