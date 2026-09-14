-- Pray Rats — imagens privadas com referências estáveis e URLs assinadas.

-- Converte somente URLs geradas pelos buckets conhecidos; avatares externos permanecem intactos.
update public.profiles
set avatar_url = 'storage://avatars/' || split_part(
  split_part(avatar_url, '/storage/v1/object/public/avatars/', 2),
  '?',
  1
)
where avatar_url like '%/storage/v1/object/public/avatars/%';

update public.checkins
set image_url = 'storage://checkins/' || split_part(
  split_part(image_url, '/storage/v1/object/public/checkins/', 2),
  '?',
  1
)
where image_url like '%/storage/v1/object/public/checkins/%';

update storage.buckets
set public = false
where id in ('avatars', 'checkins');

drop policy if exists "Checkin images are publicly readable" on storage.objects;
drop policy if exists "Avatars are publicly readable" on storage.objects;
drop policy if exists "Authenticated users can read avatars" on storage.objects;
drop policy if exists "Authorized members can read checkin images" on storage.objects;

create or replace function public.can_read_checkin_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and split_part(object_name, '/', 1) ~ '^[0-9a-f-]{36}$'
    and exists (
      select 1
      from public.checkins c
      where c.image_url = 'storage://checkins/' || object_name
        and c.user_id::text = split_part(object_name, '/', 1)
        and (
          c.user_id = auth.uid()
          or (
            c.visibility = 'public'
            and public.is_group_member(c.group_id, auth.uid())
          )
          or public.is_group_admin(c.group_id, auth.uid())
        )
    );
$$;

revoke all on function public.can_read_checkin_image(text) from public;
revoke all on function public.can_read_checkin_image(text) from anon;
grant execute on function public.can_read_checkin_image(text) to authenticated;
grant execute on function public.can_read_checkin_image(text) to service_role;

create or replace function public.can_remove_unreferenced_checkin_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and auth.uid()::text = split_part(object_name, '/', 1)
    and not exists (
      select 1
      from public.checkins c
      where c.image_url = 'storage://checkins/' || object_name
    );
$$;

revoke all on function public.can_remove_unreferenced_checkin_image(text) from public;
revoke all on function public.can_remove_unreferenced_checkin_image(text) from anon;
grant execute on function public.can_remove_unreferenced_checkin_image(text) to authenticated;
grant execute on function public.can_remove_unreferenced_checkin_image(text) to service_role;

create policy "Authenticated users can read avatars"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars');

create policy "Authorized members can read checkin images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'checkins'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.can_read_checkin_image(name)
  )
);

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- As materialized views copiam avatar_url, atualize-as após converter as referências.
refresh materialized view public.group_rankings_mv;
refresh materialized view public.weekly_group_rankings_mv;
refresh materialized view public.monthly_group_rankings_mv;

comment on function public.can_read_checkin_image(text) is
  'Autoriza imagem privada somente ao autor, integrante para check-in público ou administrador do grupo.';

comment on function public.can_remove_unreferenced_checkin_image(text) is
  'Autoriza o proprietário a remover uma foto somente quando nenhum check-in ainda referencia o objeto.';
