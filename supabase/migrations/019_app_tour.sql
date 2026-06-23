-- Pray Rats — App tour (tutorial interativo) no perfil do usuário
-- Idempotente: seguro para reexecução.

alter table public.profiles
  add column if not exists app_tour_version integer not null default 0;

alter table public.profiles
  add column if not exists app_tour_status text not null default 'pending';

alter table public.profiles
  add column if not exists app_tour_step integer not null default 0;

alter table public.profiles
  add column if not exists app_tour_updated_at timestamptz null;

do $$
begin
  alter table public.profiles
    add constraint profiles_app_tour_status_check
    check (app_tour_status in ('pending', 'in_progress', 'completed', 'dismissed'));
exception
  when duplicate_object then null;
end $$;
