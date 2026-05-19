-- Fix: permitir que o criador veja o grupo logo após o INSERT (antes de entrar em group_members)
create policy "Creators can view their groups"
  on public.groups
  for select
  using (created_by = auth.uid());
