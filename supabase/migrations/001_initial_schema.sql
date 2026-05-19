-- Pray Rats — Schema inicial
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
create type member_role as enum ('admin', 'member');
create type checkin_visibility as enum ('public', 'private');
create type checkin_status as enum ('valid', 'pending', 'rejected');
create type period_type as enum ('weekly', 'monthly', 'general');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(120) not null,
  email varchar(180) not null unique,
  avatar_url text,
  bio varchar(240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  description text,
  cover_url text,
  invite_code varchar(20) not null unique,
  start_date date,
  end_date date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Group members
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz not null default now(),
  constraint unique_group_member unique (group_id, user_id)
);

-- Activity types
create table public.activity_types (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name varchar(100) not null,
  description text,
  points integer not null default 0,
  daily_limit integer,
  weekly_limit integer,
  is_active boolean not null default true,
  is_private_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint positive_points check (points >= 0),
  constraint positive_daily_limit check (daily_limit is null or daily_limit > 0),
  constraint positive_weekly_limit check (weekly_limit is null or weekly_limit > 0)
);

-- Check-ins
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type_id uuid not null references public.activity_types(id) on delete restrict,
  title varchar(140) not null,
  description text,
  image_url text,
  duration_minutes integer,
  points integer not null default 0,
  visibility checkin_visibility not null default 'public',
  status checkin_status not null default 'valid',
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint positive_checkin_points check (points >= 0),
  constraint positive_duration check (duration_minutes is null or duration_minutes > 0)
);

-- Optional post-MVP tables
create table public.checkin_reactions (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction varchar(40) not null,
  created_at timestamptz not null default now(),
  constraint unique_checkin_reaction unique (checkin_id, user_id, reaction)
);

create table public.user_daily_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  target_days_per_week integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint positive_target_days check (target_days_per_week between 1 and 7),
  constraint unique_user_group_goal unique (user_id, group_id)
);

-- Indexes
create index idx_group_members_group_id on public.group_members(group_id);
create index idx_group_members_user_id on public.group_members(user_id);
create index idx_activity_types_group_id on public.activity_types(group_id);
create index idx_activity_types_active on public.activity_types(is_active);
create index idx_checkins_group_id on public.checkins(group_id);
create index idx_checkins_user_id on public.checkins(user_id);
create index idx_checkins_activity_type_id on public.checkins(activity_type_id);
create index idx_checkins_checked_in_at on public.checkins(checked_in_at);
create index idx_checkins_status on public.checkins(status);
create index idx_checkins_visibility on public.checkins(visibility);
create index idx_groups_invite_code on public.groups(invite_code);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_groups_updated_at before update on public.groups
  for each row execute function public.set_updated_at();
create trigger set_activity_types_updated_at before update on public.activity_types
  for each row execute function public.set_updated_at();
create trigger set_checkins_updated_at before update on public.checkins
  for each row execute function public.set_updated_at();
create trigger set_user_daily_goals_updated_at before update on public.user_daily_goals
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Novo usuário'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper functions
create or replace function public.is_group_member(target_group_id uuid, target_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.group_members gm
    where gm.group_id = target_group_id and gm.user_id = target_user_id
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_group_admin(target_group_id uuid, target_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = target_user_id
      and gm.role = 'admin'
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Ranking views
create or replace view public.group_rankings as
select
  c.group_id,
  c.user_id,
  p.name,
  p.avatar_url,
  count(c.id) as total_checkins,
  coalesce(sum(c.points), 0) as total_points,
  max(c.checked_in_at) as last_checkin_at
from public.checkins c
join public.profiles p on p.id = c.user_id
where c.status = 'valid'
group by c.group_id, c.user_id, p.name, p.avatar_url;

create or replace view public.weekly_group_rankings as
select
  c.group_id,
  c.user_id,
  p.name,
  p.avatar_url,
  count(c.id) as total_checkins,
  coalesce(sum(c.points), 0) as total_points,
  date_trunc('week', c.checked_in_at) as week_start
from public.checkins c
join public.profiles p on p.id = c.user_id
where c.status = 'valid'
group by c.group_id, c.user_id, p.name, p.avatar_url, date_trunc('week', c.checked_in_at);

create or replace view public.monthly_group_rankings as
select
  c.group_id,
  c.user_id,
  p.name,
  p.avatar_url,
  count(c.id) as total_checkins,
  coalesce(sum(c.points), 0) as total_points,
  date_trunc('month', c.checked_in_at) as month_start
from public.checkins c
join public.profiles p on p.id = c.user_id
where c.status = 'valid'
group by c.group_id, c.user_id, p.name, p.avatar_url, date_trunc('month', c.checked_in_at);

-- RLS
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.activity_types enable row level security;
alter table public.checkins enable row level security;
alter table public.checkin_reactions enable row level security;
alter table public.user_daily_goals enable row level security;

-- Profiles policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can view profiles from same groups" on public.profiles
  for select using (
    exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm2.group_id = gm1.group_id
      where gm1.user_id = auth.uid() and gm2.user_id = profiles.id
    )
  );

-- Groups policies
create policy "Members can view their groups" on public.groups
  for select using (public.is_group_member(id, auth.uid()));
create policy "Creators can view their groups" on public.groups
  for select using (created_by = auth.uid());
create policy "Authenticated users can create groups" on public.groups
  for insert with check (auth.uid() = created_by);
create policy "Admins can update groups" on public.groups
  for update using (public.is_group_admin(id, auth.uid()));
create policy "Admins can delete groups" on public.groups
  for delete using (public.is_group_admin(id, auth.uid()));

-- Join group by invite code (security definer)
create or replace function public.join_group_by_invite(invite text)
returns uuid as $$
declare
  target_group_id uuid;
begin
  select id into target_group_id
  from public.groups
  where upper(trim(invite_code)) = upper(trim(invite));

  if target_group_id is null then
    raise exception 'INVALID_INVITE_CODE';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return target_group_id;
end;
$$ language plpgsql security definer set search_path = public;

-- Group members policies
create policy "Members can view group members" on public.group_members
  for select using (public.is_group_member(group_id, auth.uid()));
create policy "Users can join groups" on public.group_members
  for insert with check (auth.uid() = user_id);
create policy "Admins can update group members" on public.group_members
  for update using (public.is_group_admin(group_id, auth.uid()));
create policy "Admins can remove group members or self leave" on public.group_members
  for delete using (public.is_group_admin(group_id, auth.uid()) or auth.uid() = user_id);

-- Activity types policies
create policy "Members can view activity types" on public.activity_types
  for select using (public.is_group_member(group_id, auth.uid()));
create policy "Admins can insert activity types" on public.activity_types
  for insert with check (public.is_group_admin(group_id, auth.uid()));
create policy "Admins can update activity types" on public.activity_types
  for update using (public.is_group_admin(group_id, auth.uid()));
create policy "Admins can delete activity types" on public.activity_types
  for delete using (public.is_group_admin(group_id, auth.uid()));

-- Check-ins policies
create policy "Members can view checkins" on public.checkins
  for select using (
    public.is_group_member(group_id, auth.uid())
    and (visibility = 'public' or user_id = auth.uid() or public.is_group_admin(group_id, auth.uid()))
  );
create policy "Members can create their own checkins" on public.checkins
  for insert with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));
create policy "Users or admins can update checkins" on public.checkins
  for update using (auth.uid() = user_id or public.is_group_admin(group_id, auth.uid()));
create policy "Users or admins can delete checkins" on public.checkins
  for delete using (auth.uid() = user_id or public.is_group_admin(group_id, auth.uid()));

-- Storage buckets (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('checkins', 'checkins', true);
