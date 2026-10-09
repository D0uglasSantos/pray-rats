-- =============================================================================
-- VALIDAR PRODUCAO — Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================
-- SOMENTE LEITURA: este arquivo nao altera schema, politicas ou dados.
-- Execute depois das migrations 001-026. Se algum item falhar, aplique a
-- migration correspondente; nao tente corrigir producao por este arquivo.
-- =============================================================================

-- 1) Buckets de storage
-- Esperado: 2 linhas e public = false para ambos.
select id, name, public, created_at
from storage.buckets
where id in ('avatars', 'checkins')
order by id;

-- 2) Politicas de storage (avatar + check-in)
-- Esperado: pelo menos 8 politicas e nenhuma leitura publica legada.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname ilike any (array['%avatar%', '%checkin%'])
order by policyname;

-- 3) RLS activity_types (CRUD admin)
-- Esperado: 4 politicas (select, insert, update e delete para admin).
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'activity_types'
order by policyname;

-- 4) Resumo final das migrations 022-026 e do storage privado
select
  (select count(*) from storage.buckets where id in ('avatars', 'checkins')) = 2
    as buckets_exist,
  (select count(*) from storage.buckets where id in ('avatars', 'checkins') and public = false) = 2
    as private_buckets_ok,
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'
     and policyname ilike any (array['%avatar%', '%checkin%'])) >= 8
    as storage_policies_ok,
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'Checkin images are publicly readable',
        'Avatars are publicly readable'
      )
  ) as legacy_public_read_policies_absent,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'activity_types') = 4
    as activity_type_policies_ok,
  to_regprocedure('public.is_group_admin(uuid,uuid)') is not null
    as is_group_admin_ok,
  to_regclass('public.mobile_push_devices') is not null
    as mobile_push_devices_ok,
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
    as private_checkin_cleanup_ok,
  not exists (
    select 1
    from public.profiles
    where avatar_url like '%/storage/v1/object/public/avatars/%'
  ) as legacy_public_avatar_urls_absent,
  not exists (
    select 1
    from public.checkins
    where image_url like '%/storage/v1/object/public/checkins/%'
  ) as legacy_public_checkin_urls_absent;

-- Esperado: todos os campos do resumo final = true.
