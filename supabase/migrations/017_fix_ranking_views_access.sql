-- Corrige views de ranking: security_invoker impedia leitura das MVs por authenticated.

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
