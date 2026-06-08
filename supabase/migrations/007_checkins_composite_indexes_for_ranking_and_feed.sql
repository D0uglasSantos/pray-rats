-- Otimiza consultas de ranking/feed em grupos com alto volume de check-ins.
-- Não altera nem remove nenhum dado existente.

create index if not exists idx_checkins_group_status_checked_in_at
  on public.checkins (group_id, status, checked_in_at desc);

create index if not exists idx_checkins_group_user_status_checked_in_at
  on public.checkins (group_id, user_id, status, checked_in_at desc);

create index if not exists idx_checkins_activity_user_status_checked_in_at
  on public.checkins (activity_type_id, user_id, status, checked_in_at desc);

create index if not exists idx_checkins_group_visibility_status_checked_in_at
  on public.checkins (group_id, visibility, status, checked_in_at desc);
