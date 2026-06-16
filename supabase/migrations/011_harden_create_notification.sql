-- Endurece create_notification: apenas service_role pode executar.
-- Nenhum dado existente é alterado ou removido.

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

revoke all on function public.create_notification(uuid, varchar, varchar, text, varchar) from public;
revoke all on function public.create_notification(uuid, varchar, varchar, text, varchar) from authenticated;
grant execute on function public.create_notification(uuid, varchar, varchar, text, varchar) to service_role;
