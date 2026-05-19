# Schema DB — Santos Hábitos

Schema inicial para Supabase/PostgreSQL.

## 1. Extensões

```sql
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
```

---

## 2. Enums

```sql
create type member_role as enum ('admin', 'member');

create type checkin_visibility as enum ('public', 'private');

create type checkin_status as enum ('valid', 'pending', 'rejected');

create type period_type as enum ('weekly', 'monthly', 'general');
```

---

## 3. Tabela: profiles

Complementa os dados do usuário autenticado no Supabase Auth.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(120) not null,
  email varchar(180) not null unique,
  avatar_url text,
  bio varchar(240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 4. Tabela: groups

Representa os grupos/desafios.

```sql
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
```

---

## 5. Tabela: group_members

Relaciona usuários com grupos.

```sql
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz not null default now(),

  constraint unique_group_member unique (group_id, user_id)
);
```

---

## 6. Tabela: activity_types

Define as atividades disponíveis em cada grupo.

```sql
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
```

---

## 7. Tabela: checkins

Armazena os check-ins dos usuários.

```sql
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
```

---

## 8. Tabela opcional: checkin_reactions

Pós-MVP para reações no feed.

```sql
create table public.checkin_reactions (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction varchar(40) not null,
  created_at timestamptz not null default now(),

  constraint unique_checkin_reaction unique (checkin_id, user_id, reaction)
);
```

---

## 9. Tabela opcional: user_daily_goals

Pós-MVP para metas pessoais.

```sql
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
```

---

## 10. Índices recomendados

```sql
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
```

---

## 11. Função updated_at

```sql
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

Triggers:

```sql
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create trigger set_activity_types_updated_at
before update on public.activity_types
for each row execute function public.set_updated_at();

create trigger set_checkins_updated_at
before update on public.checkins
for each row execute function public.set_updated_at();

create trigger set_user_daily_goals_updated_at
before update on public.user_daily_goals
for each row execute function public.set_updated_at();
```

---

## 12. Criar profile automaticamente

```sql
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
$$ language plpgsql security definer;
```

Trigger:

```sql
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

---

## 13. Verificar membro do grupo

```sql
create or replace function public.is_group_member(target_group_id uuid, target_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = target_user_id
  );
end;
$$ language plpgsql security definer;
```

---

## 14. Verificar admin do grupo

```sql
create or replace function public.is_group_admin(target_group_id uuid, target_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = target_user_id
      and gm.role = 'admin'
  );
end;
$$ language plpgsql security definer;
```

---

## 15. View: ranking geral

```sql
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
```

---

## 16. View: ranking semanal

```sql
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
```

---

## 17. View: ranking mensal

```sql
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
```

---

## 18. Seed de atividades padrão

Usar ao criar um novo grupo.

```sql
insert into public.activity_types
(group_id, name, description, points, daily_limit, weekly_limit, is_private_default)
values
(:group_id, 'Oração pessoal', 'Momento pessoal de oração diária.', 5, 1, null, false),
(:group_id, 'Leitura bíblica', 'Leitura da Bíblia ou Evangelho do dia.', 5, 1, null, false),
(:group_id, 'Terço', 'Oração do Santo Terço.', 10, 1, null, false),
(:group_id, 'Santa Missa', 'Participação na Santa Missa.', 20, 1, null, false),
(:group_id, 'Adoração', 'Momento de adoração ao Santíssimo.', 15, 1, null, false),
(:group_id, 'Pregação/Formação', 'Participação em formação, palestra ou pregação.', 10, null, 2, false),
(:group_id, 'Vigília', 'Participação em vigília ou momento prolongado de oração.', 25, null, 1, false),
(:group_id, 'Ato de caridade', 'Ação concreta de caridade.', 15, 1, null, false),
(:group_id, 'Jejum/Penitência', 'Prática pessoal de jejum ou penitência.', 10, 1, null, true);
```

---

## 19. RLS

Ativar RLS:

```sql
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.activity_types enable row level security;
alter table public.checkins enable row level security;
alter table public.checkin_reactions enable row level security;
alter table public.user_daily_goals enable row level security;
```

---

## 20. Policies: profiles

```sql
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Users can view profiles from same groups"
on public.profiles
for select
using (
  exists (
    select 1
    from public.group_members gm1
    join public.group_members gm2 on gm2.group_id = gm1.group_id
    where gm1.user_id = auth.uid()
      and gm2.user_id = profiles.id
  )
);
```

---

## 21. Policies: groups

```sql
create policy "Members can view their groups"
on public.groups
for select
using (public.is_group_member(id, auth.uid()));

create policy "Authenticated users can create groups"
on public.groups
for insert
with check (auth.uid() = created_by);

create policy "Admins can update groups"
on public.groups
for update
using (public.is_group_admin(id, auth.uid()));

create policy "Admins can delete groups"
on public.groups
for delete
using (public.is_group_admin(id, auth.uid()));
```

---

## 22. Policies: group_members

```sql
create policy "Members can view group members"
on public.group_members
for select
using (public.is_group_member(group_id, auth.uid()));

create policy "Users can join groups"
on public.group_members
for insert
with check (auth.uid() = user_id);

create policy "Admins can update group members"
on public.group_members
for update
using (public.is_group_admin(group_id, auth.uid()));

create policy "Admins can remove group members"
on public.group_members
for delete
using (public.is_group_admin(group_id, auth.uid()) or auth.uid() = user_id);
```

---

## 23. Policies: activity_types

```sql
create policy "Members can view activity types"
on public.activity_types
for select
using (public.is_group_member(group_id, auth.uid()));

create policy "Admins can create activity types"
on public.activity_types
for insert
with check (public.is_group_admin(group_id, auth.uid()));

create policy "Admins can update activity types"
on public.activity_types
for update
using (public.is_group_admin(group_id, auth.uid()));

create policy "Admins can delete activity types"
on public.activity_types
for delete
using (public.is_group_admin(group_id, auth.uid()));
```

---

## 24. Policies: checkins

```sql
create policy "Members can view public checkins from their groups"
on public.checkins
for select
using (
  public.is_group_member(group_id, auth.uid())
  and (
    visibility = 'public'
    or user_id = auth.uid()
    or public.is_group_admin(group_id, auth.uid())
  )
);

create policy "Members can create their own checkins"
on public.checkins
for insert
with check (
  auth.uid() = user_id
  and public.is_group_member(group_id, auth.uid())
);

create policy "Users can update their own checkins"
on public.checkins
for update
using (
  auth.uid() = user_id
  or public.is_group_admin(group_id, auth.uid())
);

create policy "Users can delete their own checkins or admins can delete"
on public.checkins
for delete
using (
  auth.uid() = user_id
  or public.is_group_admin(group_id, auth.uid())
);
```

---

## 25. Observações

- O ranking pode ser calculado por views.
- `checkins.points` salva a pontuação no momento do check-in.
- Alterações futuras na pontuação da atividade não devem alterar check-ins antigos.
- Validações de limite diário/semanal podem ficar em Server Actions ou RPC.
- Usar RLS desde o início.
- Dados de grupo devem ser privados para membros.
