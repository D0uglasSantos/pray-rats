-- Rate limiting para auth (signup, login, reset). Nenhum dado existente é alterado.

create table if not exists public.auth_rate_limits (
  rate_key text primary key,
  attempt_count integer not null default 1,
  window_start timestamptz not null default now()
);

alter table public.auth_rate_limits enable row level security;

-- Apenas service_role acessa (via admin client no servidor)
revoke all on public.auth_rate_limits from public;
revoke all on public.auth_rate_limits from authenticated;
grant all on public.auth_rate_limits to service_role;

create or replace function public.check_auth_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.auth_rate_limits%rowtype;
  v_now timestamptz := now();
begin
  select * into v_row
  from public.auth_rate_limits
  where rate_key = p_key
  for update;

  if not found then
    insert into public.auth_rate_limits (rate_key, attempt_count, window_start)
    values (p_key, 1, v_now);
    return true;
  end if;

  if v_row.window_start + make_interval(secs => p_window_seconds) < v_now then
    update public.auth_rate_limits
    set attempt_count = 1, window_start = v_now
    where rate_key = p_key;
    return true;
  end if;

  if v_row.attempt_count >= p_max_attempts then
    return false;
  end if;

  update public.auth_rate_limits
  set attempt_count = v_row.attempt_count + 1
  where rate_key = p_key;

  return true;
end;
$$;

revoke all on function public.check_auth_rate_limit(text, integer, integer) from public;
revoke all on function public.check_auth_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.check_auth_rate_limit(text, integer, integer) to service_role;
