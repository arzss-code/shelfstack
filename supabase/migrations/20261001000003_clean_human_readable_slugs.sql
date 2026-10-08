-- Sprint 4: Clean Human-Readable Slugs (Tanpa ID Numerik di Akhir)
-- Menghilangkan suffix ID otomatis agar slug menjadi bersih (contoh: "tambah-edit" bukan "tambah-edit-11")
-- Hanya menambahkan counter (-2, -3) jika terjadi tabrakan nama produk yang sama.

-- 1. Fungsi generator slug cerdas
create or replace function public.generate_clean_slug(p_name text, p_id bigint default null)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_base_slug text;
  v_slug text;
  v_counter int := 1;
begin
  -- Bersihkan karakter non-alphanumeric, ganti spasi dengan strip, lowercase
  v_base_slug := lower(regexp_replace(regexp_replace(trim(coalesce(p_name, 'produk')), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  -- Rapikan tanda strip ganda
  v_base_slug := regexp_replace(v_base_slug, '-+', '-', 'g');
  -- Hapus strip di awal dan akhir
  v_base_slug := trim(both '-' from v_base_slug);

  if v_base_slug = '' then
    v_base_slug := 'produk';
  end if;

  v_slug := v_base_slug;

  -- Cek collision: jika slug sudah dipakai oleh produk aktif lain, tambahkan angka -2, -3 dst
  while exists (
    select 1 from public.products
    where slug = v_slug
      and (p_id is null or id <> p_id)
      and deleted_at is null
  ) loop
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  end loop;

  return v_slug;
end;
$$;

-- 2. Perbarui trigger agar menggunakan generator slug bersih
create or replace function public.handle_product_slug()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Jika slug kosong atau null, buat dari nama
  if new.slug is null or trim(new.slug) = '' then
    new.slug := public.generate_clean_slug(new.name, new.id);
  else
    -- Jika diinput manual, rapikan formatnya dan pastikan unik
    new.slug := lower(regexp_replace(regexp_replace(trim(new.slug), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    new.slug := trim(both '-' from regexp_replace(new.slug, '-+', '-', 'g'));
  end if;

  -- Generate SKU jika kosong
  if new.sku is null or trim(new.sku) = '' then
    new.sku := 'SHLF-' || upper(substring(coalesce(new.name, 'PRD') from 1 for 3)) || '-' || floor(1000 + random() * 9000)::text;
  end if;

  return new;
end;
$$;

drop trigger if exists on_product_before_insert on public.products;
drop trigger if exists on_product_before_insert_or_update on public.products;

create trigger on_product_before_insert_or_update
before insert or update of name, slug on public.products
for each row execute function public.handle_product_slug();

-- 3. Bersihkan seluruh slug produk yang ada saat ini (hapus akhiran -id)
update public.products
set slug = public.generate_clean_slug(name, id)
where deleted_at is null;
