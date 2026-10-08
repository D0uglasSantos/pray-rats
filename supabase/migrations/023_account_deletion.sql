-- Pray Rats — preparação segura para exclusão definitiva de conta.
-- Transfere grupos com outros integrantes antes do cascade do perfil.

create or replace function public.prepare_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group record;
  v_successor_id uuid;
  v_transferred integer := 0;
  v_deleted_groups integer := 0;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  for v_group in
    select g.id
    from public.groups g
    where g.created_by = p_user_id
    for update
  loop
    select gm.user_id
      into v_successor_id
    from public.group_members gm
    where gm.group_id = v_group.id
      and gm.user_id <> p_user_id
    order by (gm.role = 'admin') desc, gm.joined_at asc, gm.user_id asc
    limit 1;

    if v_successor_id is null then
      delete from public.groups where id = v_group.id;
      v_deleted_groups := v_deleted_groups + 1;
    else
      update public.group_members
      set role = 'admin'
      where group_id = v_group.id
        and user_id = v_successor_id;

      update public.groups
      set created_by = v_successor_id,
          updated_at = now()
      where id = v_group.id;

      v_transferred := v_transferred + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'transferred_groups', v_transferred,
    'deleted_empty_groups', v_deleted_groups
  );
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public;
revoke all on function public.prepare_account_deletion(uuid) from anon;
revoke all on function public.prepare_account_deletion(uuid) from authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;

comment on function public.prepare_account_deletion(uuid) is
  'Uso exclusivo do backend: transfere ou remove grupos antes de excluir auth.users.';
