-- =========================================================================
-- Migration: Add avatar_url to public.profiles & configure avatars storage bucket
-- Date: 2026-11-02
-- Author: Developer [AA]
-- =========================================================================

-- 1. Add avatar_url column to public.profiles
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Configure 'avatars' storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Storage RLS Policies for avatars
-- Allow authenticated users to manage (insert, update, delete) their own avatar
-- Files are stored under their user ID: avatars/{user_id}/{filename}
drop policy if exists "users manage own avatar" on storage.objects;
create policy "users manage own avatar"
on storage.objects for all to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

