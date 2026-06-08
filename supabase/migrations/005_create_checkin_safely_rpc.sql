-- Cria RPC transacional para evitar race condition na criação de check-ins.
-- Nenhum dado existente é alterado ou removido.

drop function if exists public.create_checkin_safely(
  uuid,
  uuid,
  text,
  text,
  integer,
  numeric,
  checkin_visibility,
  text
);

create or replace function public.create_checkin_safely(
  group_id uuid,
  activity_type_id uuid,
  title text,
  description text default null,
  duration_minutes integer default null,
  distance_km numeric default null,
  visibility checkin_visibility default 'public',
  image_url text default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_activity activity_types%rowtype;
  v_daily_count integer := 0;
  v_weekly_count integer := 0;
  v_checkin_id uuid;
begin
  if v_user_id is null then
    raise exception using message = 'NOT_AUTHENTICATED', errcode = 'P0001';
  end if;

  if title is null or length(trim(title)) = 0 then
    raise exception using message = 'CHECKIN_TITLE_REQUIRED', errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.group_members gm
    where gm.group_id = create_checkin_safely.group_id
      and gm.user_id = v_user_id
  ) then
    raise exception using message = 'GROUP_MEMBERSHIP_REQUIRED', errcode = 'P0001';
  end if;

  select at.*
  into v_activity
  from public.activity_types at
  where at.id = create_checkin_safely.activity_type_id
    and at.group_id = create_checkin_safely.group_id
    and at.is_active = true;

  if v_activity.id is null then
    raise exception using message = 'ACTIVITY_NOT_FOUND_OR_INACTIVE', errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(v_user_id::text),
    hashtext(v_activity.id::text)
  );

  if v_activity.daily_limit is not null then
    select count(*)
    into v_daily_count
    from public.checkins c
    where c.user_id = v_user_id
      and c.activity_type_id = v_activity.id
      and c.status = 'valid'
      and c.checked_in_at >= date_trunc('day', now())
      and c.checked_in_at < date_trunc('day', now()) + interval '1 day';

    if v_daily_count >= v_activity.daily_limit then
      raise exception using message = 'DAILY_LIMIT_REACHED', errcode = 'P0001';
    end if;
  end if;

  if v_activity.weekly_limit is not null then
    select count(*)
    into v_weekly_count
    from public.checkins c
    where c.user_id = v_user_id
      and c.activity_type_id = v_activity.id
      and c.status = 'valid'
      and c.checked_in_at >= date_trunc('week', now())
      and c.checked_in_at < date_trunc('week', now()) + interval '1 week';

    if v_weekly_count >= v_activity.weekly_limit then
      raise exception using message = 'WEEKLY_LIMIT_REACHED', errcode = 'P0001';
    end if;
  end if;

  insert into public.checkins (
    group_id,
    user_id,
    activity_type_id,
    title,
    description,
    duration_minutes,
    distance_km,
    image_url,
    visibility,
    points,
    status
  )
  values (
    create_checkin_safely.group_id,
    v_user_id,
    v_activity.id,
    trim(create_checkin_safely.title),
    nullif(trim(create_checkin_safely.description), ''),
    create_checkin_safely.duration_minutes,
    create_checkin_safely.distance_km,
    nullif(trim(create_checkin_safely.image_url), ''),
    create_checkin_safely.visibility,
    v_activity.points,
    'valid'
  )
  returning id into v_checkin_id;

  return v_checkin_id;
end;
$$;

revoke all on function public.create_checkin_safely(uuid, uuid, text, text, integer, numeric, checkin_visibility, text) from public;
grant execute on function public.create_checkin_safely(uuid, uuid, text, text, integer, numeric, checkin_visibility, text) to authenticated;
