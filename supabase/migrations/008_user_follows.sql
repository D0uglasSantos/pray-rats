-- Sistema de seguir usuários (estilo Instagram)
-- Amizade = follow mútuo (não há tabela separada)

create table public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_user_follow unique (follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

create index idx_user_follows_follower_id on public.user_follows(follower_id);
create index idx_user_follows_following_id on public.user_follows(following_id);

-- Helpers
create or replace function public.is_following(follower uuid, target uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_follows uf
    where uf.follower_id = follower and uf.following_id = target
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_mutual_follow(user_a uuid, user_b uuid)
returns boolean as $$
begin
  return public.is_following(user_a, user_b) and public.is_following(user_b, user_a);
end;
$$ language plpgsql security definer set search_path = public;

alter table public.user_follows enable row level security;

-- Qualquer autenticado pode ver relações de follow (para contagens e listas)
create policy "Authenticated users can view follows" on public.user_follows
  for select using (auth.uid() is not null);

create policy "Users can follow others" on public.user_follows
  for insert with check (auth.uid() = follower_id and follower_id != following_id);

create policy "Users can unfollow" on public.user_follows
  for delete using (auth.uid() = follower_id);

-- Perfis visíveis para quem segue ou é seguido
create policy "Users can view profiles they follow or who follow them" on public.profiles
  for select using (
    exists (
      select 1 from public.user_follows uf
      where (uf.follower_id = auth.uid() and uf.following_id = profiles.id)
         or (uf.following_id = auth.uid() and uf.follower_id = profiles.id)
    )
  );
