-- Rankings pré-calculados (materialized views). Nenhum dado de check-in é removido.

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

-- Views públicas (mesmos nomes de antes) filtradas por membership
drop view if exists public.group_rankings;
drop view if exists public.weekly_group_rankings;
drop view if exists public.monthly_group_rankings;

create view public.group_rankings
with (security_invoker = true) as
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

create view public.weekly_group_rankings
with (security_invoker = true) as
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

create view public.monthly_group_rankings
with (security_invoker = true) as
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

-- Carga inicial (primeira vez não pode ser CONCURRENTLY antes de popular)
refresh materialized view public.group_rankings_mv;
refresh materialized view public.weekly_group_rankings_mv;
refresh materialized view public.monthly_group_rankings_mv;
