-- Restringe visibilidade de user_follows (sem apagar dados).
-- Substitui policy aberta por regras baseadas em relação social e grupos em comum.

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
