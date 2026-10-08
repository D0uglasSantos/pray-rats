-- Pray Rats — dispositivos mobile para Expo Push.
-- Aditivo: mantém push_subscriptions exclusivamente para Web Push/PWA.

create table if not exists public.mobile_push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  installation_id uuid not null unique,
  expo_push_token text not null unique,
  platform varchar(10) not null,
  project_id text not null,
  app_version varchar(30),
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobile_push_devices_platform_check check (platform in ('android', 'ios')),
  constraint mobile_push_devices_token_check
    check (
      expo_push_token like 'ExpoPushToken[%'
      or expo_push_token like 'ExponentPushToken[%'
    )
);

create index if not exists idx_mobile_push_devices_user_enabled
  on public.mobile_push_devices (user_id, enabled)
  where enabled = true;

comment on table public.mobile_push_devices is
  'Tokens Expo Push por instalação mobile. Não armazena Web Push.';

alter table public.mobile_push_devices enable row level security;

drop policy if exists "Users can view own mobile push devices"
  on public.mobile_push_devices;

create policy "Users can view own mobile push devices"
  on public.mobile_push_devices
  for select
  using (auth.uid() = user_id);

create or replace function public.register_mobile_push_device(
  p_installation_id uuid,
  p_expo_push_token text,
  p_platform varchar,
  p_project_id text,
  p_app_version varchar default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_device_id uuid;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_platform not in ('android', 'ios') then
    raise exception 'INVALID_PLATFORM';
  end if;

  if not (
    p_expo_push_token like 'ExpoPushToken[%'
    or p_expo_push_token like 'ExponentPushToken[%'
  ) then
    raise exception 'INVALID_EXPO_PUSH_TOKEN';
  end if;

  delete from public.mobile_push_devices
  where expo_push_token = p_expo_push_token
    and installation_id <> p_installation_id;

  insert into public.mobile_push_devices (
    user_id,
    installation_id,
    expo_push_token,
    platform,
    project_id,
    app_version,
    enabled,
    last_seen_at,
    updated_at
  )
  values (
    v_user_id,
    p_installation_id,
    p_expo_push_token,
    p_platform,
    p_project_id,
    p_app_version,
    true,
    now(),
    now()
  )
  on conflict (installation_id)
  do update set
    user_id = excluded.user_id,
    expo_push_token = excluded.expo_push_token,
    platform = excluded.platform,
    project_id = excluded.project_id,
    app_version = excluded.app_version,
    enabled = true,
    last_seen_at = now(),
    updated_at = now()
  returning id into v_device_id;

  return v_device_id;
end;
$$;

create or replace function public.unregister_mobile_push_device(
  p_installation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted_count integer;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  delete from public.mobile_push_devices
  where installation_id = p_installation_id
    and user_id = v_user_id;

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count > 0;
end;
$$;

revoke all on function public.register_mobile_push_device(uuid, text, varchar, text, varchar)
  from public;
revoke all on function public.unregister_mobile_push_device(uuid)
  from public;
grant execute on function public.register_mobile_push_device(uuid, text, varchar, text, varchar)
  to authenticated;
grant execute on function public.unregister_mobile_push_device(uuid)
  to authenticated;
