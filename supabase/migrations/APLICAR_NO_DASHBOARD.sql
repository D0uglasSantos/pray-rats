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
