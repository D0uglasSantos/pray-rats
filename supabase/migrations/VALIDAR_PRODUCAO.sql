-- =============================================================================
-- VALIDAR E CORRIGIR PRODUÇÃO — Supabase Dashboard → SQL Editor → Run
-- =============================================================================
-- Seguro: não apaga dados de usuários, grupos ou check-ins.
-- Rode o bloco "DIAGNÓSTICO" primeiro; se algo falhar, rode "CORREÇÃO".
-- =============================================================================

-- ─── DIAGNÓSTICO (somente leitura) ───────────────────────────────────────────

-- 1) Buckets de storage
select id, name, public, created_at
from storage.buckets
where id in ('avatars', 'checkins')
order by id;

-- 2) Políticas de storage (avatar + checkin)
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname ilike any (array['%avatar%', '%checkin%'])
order by policyname;

-- 3) RLS activity_types (CRUD admin)
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'activity_types'
order by policyname;

-- 4) Função is_group_admin
select proname
from pg_proc
where proname = 'is_group_admin'
  and pronamespace = 'public'::regnamespace;

-- 5) Resumo esperado
-- Buckets: 2 linhas (avatars, checkins), public = true
-- Storage policies: pelo menos 5 (3 checkins + 2 avatars mínimo)
-- activity_types: 4 policies (select, insert, update, delete para admin)
-- is_group_admin: 1 linha

-- ─── CORREÇÃO: buckets (migration 018) ─────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('checkins', 'checkins', true)
on conflict (id) do update
set public = excluded.public;

-- ─── CORREÇÃO: políticas de storage (migration 003) ────────────────────────
-- Idempotente: recria policies se ainda não existirem com estes nomes.

drop policy if exists "Checkin images are publicly readable" on storage.objects;
drop policy if exists "Users can upload own checkin images" on storage.objects;
drop policy if exists "Users can update own checkin images" on storage.objects;
drop policy if exists "Users can delete own checkin images" on storage.objects;
drop policy if exists "Avatars are publicly readable" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;

create policy "Checkin images are publicly readable"
on storage.objects for select
using (bucket_id = 'checkins');

create policy "Users can upload own checkin images"
on storage.objects for insert
with check (
  bucket_id = 'checkins'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own checkin images"
on storage.objects for update
using (
  bucket_id = 'checkins'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own checkin images"
on storage.objects for delete
using (
  bucket_id = 'checkins'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Avatars are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- ─── VALIDAÇÃO FINAL ───────────────────────────────────────────────────────

select
  (select count(*) from storage.buckets where id in ('avatars', 'checkins')) as buckets_ok,
  (select count(*) from storage.buckets where id in ('avatars', 'checkins') and public = false)
    as private_buckets_ok,
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'
     and policyname ilike any (array['%avatar%', '%checkin%'])) as storage_policies_count,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'activity_types') as activity_type_policies_count,
  to_regclass('public.mobile_push_devices') is not null as mobile_push_devices_ok,
  to_regprocedure('public.register_mobile_push_device(uuid,text,character varying,text,character varying)') is not null
    as register_mobile_push_device_ok,
  to_regprocedure('public.unregister_mobile_push_device(uuid)') is not null
    as unregister_mobile_push_device_ok,
  to_regprocedure('public.prepare_account_deletion(uuid)') is not null
    as prepare_account_deletion_ok,
  to_regclass('public.expo_push_tickets') is not null
    as expo_push_tickets_ok,
  not exists (
    select 1
    from public.auth_rate_limits
    where rate_key !~ '^(signIn|signUp|resetPassword):[0-9a-f]{64}$'
  ) as auth_rate_limit_keys_minimized,
  to_regprocedure('public.can_read_checkin_image(text)') is not null
    as private_checkin_authorization_ok,
  to_regprocedure('public.can_remove_unreferenced_checkin_image(text)') is not null
    as private_checkin_cleanup_ok;

-- Esperado: buckets_ok = 2, private_buckets_ok = 2, storage_policies_count >= 8,
-- activity_type_policies_count = 4, os três campos mobile_* = true
-- prepare_account_deletion_ok, expo_push_tickets_ok, auth_rate_limit_keys_minimized
-- private_checkin_authorization_ok e private_checkin_cleanup_ok = true.
