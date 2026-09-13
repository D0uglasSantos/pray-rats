-- =============================================================================
-- APLICAR MANUALMENTE NO SUPABASE (sem CLI, sem senha do Postgres)
-- =============================================================================
--
-- 1. Abra https://supabase.com/dashboard → seu projeto
-- 2. Menu lateral: SQL Editor → New query
-- 3. Cole TODO este arquivo (ou uma seção por vez, na ordem)
-- 4. Clique Run — deve aparecer "Success"
--
-- Seguro para produção: nenhum DELETE/DROP de dados de usuários.
-- Pode rodar seção por seção; se uma já foi aplicada, a próxima ainda funciona.
-- =============================================================================

-- ─── 011: Segurança create_notification ─────────────────────────────────────

create or replace function public.create_notification(
  p_user_id uuid,
  p_type varchar,
  p_title varchar,
  p_body text default null,
  p_link varchar default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_notification(uuid, varchar, varchar, text, varchar) from public;
revoke all on function public.create_notification(uuid, varchar, varchar, text, varchar) from authenticated;
grant execute on function public.create_notification(uuid, varchar, varchar, text, varchar) to service_role;

-- ─── 012: RLS user_follows ──────────────────────────────────────────────────

create or replace function public.shares_group(user_a uuid, user_b uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.group_members gm_a
    inner join public.group_members gm_b on gm_b.group_id = gm_a.group_id
    where gm_a.user_id = user_a
      and gm_b.user_id = user_b
  );
end;
$$;

drop policy if exists "Authenticated users can view follows" on public.user_follows;

create policy "Users can view relevant follows"
  on public.user_follows
  for select
  using (
    auth.uid() = follower_id
    or auth.uid() = following_id
    or public.is_following(auth.uid(), follower_id)
    or public.is_following(follower_id, auth.uid())
    or public.is_following(auth.uid(), following_id)
    or public.is_following(following_id, auth.uid())
    or public.shares_group(auth.uid(), follower_id)
    or public.shares_group(auth.uid(), following_id)
  );

-- ─── 013: Rate limiting auth (opcional até deploy do código #4) ───────────────

create table if not exists public.auth_rate_limits (
  rate_key text primary key,
  attempt_count integer not null default 1,
  window_start timestamptz not null default now()
);

alter table public.auth_rate_limits enable row level security;

revoke all on public.auth_rate_limits from public;
revoke all on public.auth_rate_limits from authenticated;
grant all on public.auth_rate_limits to service_role;

create or replace function public.check_auth_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.auth_rate_limits%rowtype;
  v_now timestamptz := now();
begin
  select * into v_row
  from public.auth_rate_limits
  where rate_key = p_key
  for update;

  if not found then
    insert into public.auth_rate_limits (rate_key, attempt_count, window_start)
    values (p_key, 1, v_now);
    return true;
  end if;

  if v_row.window_start + make_interval(secs => p_window_seconds) < v_now then
    update public.auth_rate_limits
    set attempt_count = 1, window_start = v_now
    where rate_key = p_key;
    return true;
  end if;

  if v_row.attempt_count >= p_max_attempts then
    return false;
  end if;

  update public.auth_rate_limits
  set attempt_count = v_row.attempt_count + 1
  where rate_key = p_key;

  return true;
end;
$$;

revoke all on function public.check_auth_rate_limit(text, integer, integer) from public;
revoke all on function public.check_auth_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.check_auth_rate_limit(text, integer, integer) to service_role;

-- ─── 014: Documentar tabelas não usadas (opcional) ──────────────────────────

comment on table public.checkin_reactions is
  'Reservado para reações em check-ins (feature futura). Não usado pelo app.';

comment on table public.user_daily_goals is
  'Reservado para metas diárias por grupo (feature futura). Não usado pelo app.';

drop policy if exists "Block checkin_reactions until feature ships" on public.checkin_reactions;
create policy "Block checkin_reactions until feature ships"
  on public.checkin_reactions
  for all
  using (false)
  with check (false);

drop policy if exists "Block user_daily_goals until feature ships" on public.user_daily_goals;
create policy "Block user_daily_goals until feature ships"
  on public.user_daily_goals
  for all
  using (false)
  with check (false);

-- ─── 015: Rankings pré-calculados (materialized views) ──────────────────────
-- Cole também o conteúdo de supabase/migrations/015_materialized_rankings.sql
-- ou execute esse arquivo inteiro abaixo:

create materialized view if not exists public.group_rankings_mv as
select
  c.group_id,
  c.user_id,
  p.name,
  p.avatar_url,
  count(c.id)::bigint as total_checkins,
  coalesce(sum(c.points), 0)::bigint as total_points,
  max(c.checked_in_at) as last_checkin_at
from public.checkins c
join public.profiles p on p.id = c.user_id
where c.status = 'valid'
group by c.group_id, c.user_id, p.name, p.avatar_url;

create unique index if not exists idx_group_rankings_mv_group_user
  on public.group_rankings_mv (group_id, user_id);

create materialized view if not exists public.weekly_group_rankings_mv as
select
  c.group_id,
  c.user_id,
  p.name,
  p.avatar_url,
  count(c.id)::bigint as total_checkins,
  coalesce(sum(c.points), 0)::bigint as total_points,
  date_trunc('week', c.checked_in_at) as week_start
from public.checkins c
join public.profiles p on p.id = c.user_id
where c.status = 'valid'
group by c.group_id, c.user_id, p.name, p.avatar_url, date_trunc('week', c.checked_in_at);

create unique index if not exists idx_weekly_group_rankings_mv_unique
  on public.weekly_group_rankings_mv (group_id, user_id, week_start);

create materialized view if not exists public.monthly_group_rankings_mv as
select
  c.group_id,
  c.user_id,
  p.name,
  p.avatar_url,
  count(c.id)::bigint as total_checkins,
  coalesce(sum(c.points), 0)::bigint as total_points,
  date_trunc('month', c.checked_in_at) as month_start
from public.checkins c
join public.profiles p on p.id = c.user_id
where c.status = 'valid'
group by c.group_id, c.user_id, p.name, p.avatar_url, date_trunc('month', c.checked_in_at);

create unique index if not exists idx_monthly_group_rankings_mv_unique
  on public.monthly_group_rankings_mv (group_id, user_id, month_start);

drop view if exists public.group_rankings;
drop view if exists public.weekly_group_rankings;
drop view if exists public.monthly_group_rankings;

create view public.group_rankings as
select
  r.group_id,
  r.user_id,
  r.name,
  r.avatar_url,
  r.total_checkins,
  r.total_points,
  r.last_checkin_at
from public.group_rankings_mv r
where public.is_group_member(r.group_id, auth.uid());

create view public.weekly_group_rankings as
select
  r.group_id,
  r.user_id,
  r.name,
  r.avatar_url,
  r.total_checkins,
  r.total_points,
  r.week_start
from public.weekly_group_rankings_mv r
where public.is_group_member(r.group_id, auth.uid());

create view public.monthly_group_rankings as
select
  r.group_id,
  r.user_id,
  r.name,
  r.avatar_url,
  r.total_checkins,
  r.total_points,
  r.month_start
from public.monthly_group_rankings_mv r
where public.is_group_member(r.group_id, auth.uid());

revoke all on public.group_rankings_mv from public, anon, authenticated;
revoke all on public.weekly_group_rankings_mv from public, anon, authenticated;
revoke all on public.monthly_group_rankings_mv from public, anon, authenticated;

grant select on public.group_rankings_mv to service_role;
grant select on public.weekly_group_rankings_mv to service_role;
grant select on public.monthly_group_rankings_mv to service_role;

create or replace function public.refresh_ranking_views()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.group_rankings_mv;
  refresh materialized view concurrently public.weekly_group_rankings_mv;
  refresh materialized view concurrently public.monthly_group_rankings_mv;
end;
$$;

revoke all on function public.refresh_ranking_views() from public;
revoke all on function public.refresh_ranking_views() from authenticated;
grant execute on function public.refresh_ranking_views() to service_role;

refresh materialized view public.group_rankings_mv;
refresh materialized view public.weekly_group_rankings_mv;
refresh materialized view public.monthly_group_rankings_mv;

-- ─── 016: Profile com metadados OAuth (Google / Apple) ──────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(
      trim(both from concat_ws(
        ' ',
        nullif(new.raw_user_meta_data->>'given_name', ''),
        nullif(new.raw_user_meta_data->>'family_name', '')
      )),
      ''
    ),
    'Novo usuário'
  );

  v_avatar := coalesce(
    nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data->>'picture'), '')
  );

  insert into public.profiles (id, name, email, avatar_url)
  values (new.id, v_name, new.email, v_avatar);

  return new;
end;
$$;

-- ─── 017: Corrigir acesso às views de ranking (se já rodou 015 com security_invoker) ──

drop view if exists public.group_rankings;
drop view if exists public.weekly_group_rankings;
drop view if exists public.monthly_group_rankings;

create view public.group_rankings as
select
  r.group_id,
  r.user_id,
  r.name,
  r.avatar_url,
  r.total_checkins,
  r.total_points,
  r.last_checkin_at
from public.group_rankings_mv r
where public.is_group_member(r.group_id, auth.uid());

create view public.weekly_group_rankings as
select
  r.group_id,
  r.user_id,
  r.name,
  r.avatar_url,
  r.total_checkins,
  r.total_points,
  r.week_start
from public.weekly_group_rankings_mv r
where public.is_group_member(r.group_id, auth.uid());

create view public.monthly_group_rankings as
select
  r.group_id,
  r.user_id,
  r.name,
  r.avatar_url,
  r.total_checkins,
  r.total_points,
  r.month_start
from public.monthly_group_rankings_mv r
where public.is_group_member(r.group_id, auth.uid());

-- ─── 018: Buckets avatars e checkins ─────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('checkins', 'checkins', true)
on conflict (id) do nothing;

-- ─── 019: App tour (tutorial interativo no perfil) ───────────────────────────

alter table public.profiles
  add column if not exists app_tour_version integer not null default 0;

alter table public.profiles
  add column if not exists app_tour_status text not null default 'pending';

alter table public.profiles
  add column if not exists app_tour_step integer not null default 0;

alter table public.profiles
  add column if not exists app_tour_updated_at timestamptz null;

do $$
begin
  alter table public.profiles
    add constraint profiles_app_tour_status_check
    check (app_tour_status in ('pending', 'in_progress', 'completed', 'dismissed'));
exception
  when duplicate_object then null;
end $$;

-- ─── Storage: se upload de foto falhar, rode VALIDAR_PRODUCAO.sql ────────────

-- ─── 021: Engajamento no feed + categoria Outro ──────────────────────────────

comment on table public.checkin_reactions is
  'Reações com emoji em check-ins públicos do feed.';

alter table public.checkin_reactions
  drop constraint if exists unique_checkin_reaction;

alter table public.checkin_reactions
  drop constraint if exists unique_checkin_user_reaction;

alter table public.checkin_reactions
  add constraint unique_checkin_user_reaction unique (checkin_id, user_id);

alter table public.checkin_reactions
  drop constraint if exists checkin_reaction_length;

alter table public.checkin_reactions
  add constraint checkin_reaction_length
  check (char_length(reaction) between 1 and 16);

create index if not exists idx_checkin_reactions_checkin_id
  on public.checkin_reactions (checkin_id);

drop policy if exists "Block checkin_reactions until feature ships" on public.checkin_reactions;
drop policy if exists "Members can view checkin reactions" on public.checkin_reactions;
drop policy if exists "Members can insert own checkin reactions" on public.checkin_reactions;
drop policy if exists "Members can update own checkin reactions" on public.checkin_reactions;
drop policy if exists "Members can delete own checkin reactions" on public.checkin_reactions;

create policy "Members can view checkin reactions"
  on public.checkin_reactions
  for select
  using (
    exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can insert own checkin reactions"
  on public.checkin_reactions
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can update own checkin reactions"
  on public.checkin_reactions
  for update
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can delete own checkin reactions"
  on public.checkin_reactions
  for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create table if not exists public.checkin_comments (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint checkin_comment_body_length check (char_length(body) between 1 and 500)
);

create index if not exists idx_checkin_comments_checkin_created
  on public.checkin_comments (checkin_id, created_at);

comment on table public.checkin_comments is
  'Comentários flat em check-ins do feed.';

alter table public.checkin_comments enable row level security;

drop policy if exists "Members can view checkin comments" on public.checkin_comments;
drop policy if exists "Members can insert own checkin comments" on public.checkin_comments;
drop policy if exists "Members can delete own checkin comments" on public.checkin_comments;

create policy "Members can view checkin comments"
  on public.checkin_comments
  for select
  using (
    exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can insert own checkin comments"
  on public.checkin_comments
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can delete own checkin comments"
  on public.checkin_comments
  for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

insert into public.activity_types (
  group_id,
  name,
  description,
  points,
  daily_limit,
  weekly_limit,
  is_active,
  is_private_default
)
select
  g.id,
  'Outro',
  'Prática ou ato espiritual descrito pelo participante.',
  5,
  1,
  null,
  true,
  false
from public.groups g
where not exists (
  select 1
  from public.activity_types a
  where a.group_id = g.id
    and lower(a.name) = 'outro'
);

-- ─── 022: Dispositivos mobile para Expo Push ───────────────────────────────

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

-- ─── 023: Preparação segura para exclusão de conta ─────────────────────────

create or replace function public.prepare_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group record;
  v_successor_id uuid;
  v_transferred integer := 0;
  v_deleted_groups integer := 0;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  for v_group in
    select g.id
    from public.groups g
    where g.created_by = p_user_id
    for update
  loop
    select gm.user_id
      into v_successor_id
    from public.group_members gm
    where gm.group_id = v_group.id
      and gm.user_id <> p_user_id
    order by (gm.role = 'admin') desc, gm.joined_at asc, gm.user_id asc
    limit 1;

    if v_successor_id is null then
      delete from public.groups where id = v_group.id;
      v_deleted_groups := v_deleted_groups + 1;
    else
      update public.group_members
      set role = 'admin'
      where group_id = v_group.id
        and user_id = v_successor_id;

      update public.groups
      set created_by = v_successor_id,
          updated_at = now()
      where id = v_group.id;

      v_transferred := v_transferred + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'transferred_groups', v_transferred,
    'deleted_empty_groups', v_deleted_groups
  );
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public;
revoke all on function public.prepare_account_deletion(uuid) from anon;
revoke all on function public.prepare_account_deletion(uuid) from authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;

-- ─── 024: Tickets e receipts do Expo Push ──────────────────────────────────

create table if not exists public.expo_push_tickets (
  receipt_id text primary key,
  device_id uuid not null references public.mobile_push_devices(id) on delete cascade,
  status varchar(12) not null default 'pending',
  attempts smallint not null default 0,
  next_check_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  checked_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expo_push_tickets_status_check
    check (status in ('pending', 'ok', 'error', 'expired')),
  constraint expo_push_tickets_attempts_check check (attempts >= 0)
);

create index if not exists idx_expo_push_tickets_due
  on public.expo_push_tickets (next_check_at)
  where status = 'pending';

alter table public.expo_push_tickets enable row level security;
revoke all on table public.expo_push_tickets from anon;
revoke all on table public.expo_push_tickets from authenticated;
grant all on table public.expo_push_tickets to service_role;

comment on table public.expo_push_tickets is
  'Metadados temporários para consultar receipts Expo Push; sem conteúdo da notificação.';
