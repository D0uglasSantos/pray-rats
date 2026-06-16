-- Profile a partir de metadados de providers OAuth (Google, Apple, etc.)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(
      trim(both from concat_ws(
        ' ',
        nullif(new.raw_user_meta_data->>'given_name', ''),
        nullif(new.raw_user_meta_data->>'family_name', '')
      )),
      ''
    ),
    'Novo usuário'
  );

  v_avatar := coalesce(
    nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data->>'picture'), '')
  );

  insert into public.profiles (id, name, email, avatar_url)
  values (new.id, v_name, new.email, v_avatar);

  return new;
end;
$$;
