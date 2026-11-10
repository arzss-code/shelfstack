-- =========================================================================
-- Migration: 20261130000002_sync_google_profile_metadata.sql
-- Description: Synchronize Google OAuth metadata (avatar_url and full_name) to public.profiles
-- Author: Developer [AA]
-- Date: 2026-11-10
-- =========================================================================

-- 1. Perbarui fungsi trigger handle_new_user() agar otomatis menyertakan avatar_url
--    dan nama lengkap dari metadata OIDC / Google OAuth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_avatar_url text;
begin
  -- Ekstrak nama dari metadata OAuth (mendukung field full_name dan name standar OIDC)
  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Ekstrak foto profil dari metadata OAuth (Google mengirimkan avatar_url atau picture)
  v_avatar_url := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
  );

  insert into public.profiles (user_id, full_name, role, avatar_url)
  values (
    new.id,
    v_full_name,
    'customer',
    v_avatar_url
  )
  on conflict (user_id) do update set
    -- Hanya isi avatar jika pengguna belum memiliki foto kustom
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    -- Hanya isi nama jika nama profil di database masih kosong
    full_name = coalesce(nullif(trim(public.profiles.full_name), ''), excluded.full_name);

  return new;
end;
$$;

-- 2. Pastikan trigger terpasang pada auth.users saat registrasi
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3. Fungsi sinkronisasi saat metadata auth.users diperbarui (misal saat menghubungkan OAuth)
create or replace function public.sync_profile_oauth_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_avatar text;
  v_new_name text;
begin
  v_new_avatar := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
  );

  v_new_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), '')
  );

  -- Update baris profiles jika avatar atau nama masih kosong di database
  update public.profiles
  set
    avatar_url = coalesce(public.profiles.avatar_url, v_new_avatar),
    full_name = coalesce(nullif(trim(public.profiles.full_name), ''), v_new_name)
  where user_id = new.id
    and (
      (public.profiles.avatar_url is null and v_new_avatar is not null) or
      ((public.profiles.full_name is null or trim(public.profiles.full_name) = '') and v_new_name is not null)
    );

  return new;
end;
$$;

-- 4. Pasang trigger sinkronisasi metadata saat profil auth.users diperbarui
drop trigger if exists on_auth_user_updated_sync_profile on auth.users;
create trigger on_auth_user_updated_sync_profile
after update of raw_user_meta_data on auth.users
for each row execute function public.sync_profile_oauth_metadata();
