-- Check-in engagement (reactions + comments) and default "Outro" activity backfill.

-- ---------------------------------------------------------------------------
-- Reactions: unlock table, one reaction per user per check-in
-- ---------------------------------------------------------------------------
comment on table public.checkin_reactions is
  'Reações com emoji em check-ins públicos do feed.';

alter table public.checkin_reactions
  drop constraint if exists unique_checkin_reaction;

alter table public.checkin_reactions
  drop constraint if exists unique_checkin_user_reaction;

alter table public.checkin_reactions
  add constraint unique_checkin_user_reaction unique (checkin_id, user_id);

alter table public.checkin_reactions
  drop constraint if exists checkin_reaction_length;

alter table public.checkin_reactions
  add constraint checkin_reaction_length
  check (char_length(reaction) between 1 and 16);

create index if not exists idx_checkin_reactions_checkin_id
  on public.checkin_reactions (checkin_id);

drop policy if exists "Block checkin_reactions until feature ships" on public.checkin_reactions;

create policy "Members can view checkin reactions"
  on public.checkin_reactions
  for select
  using (
    exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can insert own checkin reactions"
  on public.checkin_reactions
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can update own checkin reactions"
  on public.checkin_reactions
  for update
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can delete own checkin reactions"
  on public.checkin_reactions
  for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
create table public.checkin_comments (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint checkin_comment_body_length check (char_length(body) between 1 and 500)
);

create index idx_checkin_comments_checkin_created
  on public.checkin_comments (checkin_id, created_at);

comment on table public.checkin_comments is
  'Comentários flat em check-ins do feed.';

alter table public.checkin_comments enable row level security;

create policy "Members can view checkin comments"
  on public.checkin_comments
  for select
  using (
    exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can insert own checkin comments"
  on public.checkin_comments
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

create policy "Members can delete own checkin comments"
  on public.checkin_comments
  for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = checkin_id
        and public.is_group_member(c.group_id, auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Default activity "Outro" for existing groups
-- ---------------------------------------------------------------------------
insert into public.activity_types (
  group_id,
  name,
  description,
  points,
  daily_limit,
  weekly_limit,
  is_active,
  is_private_default
)
select
  g.id,
  'Outro',
  'Prática ou ato espiritual descrito pelo participante.',
  5,
  1,
  null,
  true,
  false
from public.groups g
where not exists (
  select 1
  from public.activity_types a
  where a.group_id = g.id
    and lower(a.name) = 'outro'
);
