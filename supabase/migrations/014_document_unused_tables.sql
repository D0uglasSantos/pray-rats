-- Tabelas reservadas para features futuras (post-MVP).
-- Nenhum dado é alterado ou removido — apenas documentação e policies explícitas.

comment on table public.checkin_reactions is
  'Reservado para reações em check-ins (feature futura). Não usado pelo app.';

comment on table public.user_daily_goals is
  'Reservado para metas diárias por grupo (feature futura). Não usado pelo app.';

-- Policies explícitas: bloqueio total via API até a feature ser implementada.
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
