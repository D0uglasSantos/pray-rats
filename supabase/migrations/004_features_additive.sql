-- Pray Rats — Features aditivas (notificações, push, distância)
-- Nenhum dado existente é alterado ou removido.

-- Distância opcional em check-ins (nullable para registros existentes)
alter table public.checkins
  add column if not exists distance_km numeric(8, 2) null;

alter table public.checkins
  add constraint positive_distance
  check (distance_km is null or distance_km > 0);

-- Notificações in-app
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type varchar(50) not null,
  title varchar(200) not null,
  body text,
  link varchar(500),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read_at)
  where read_at is null;

-- Push subscriptions (Web Push PWA)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  constraint unique_push_endpoint unique (endpoint)
);

create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

-- RLS
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

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

revoke all on function public.create_notification from public;
grant execute on function public.create_notification to authenticated;
