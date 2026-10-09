-- Evita que a rota autenticada do app mobile dispare o mesmo check-in mais de uma vez.

create table if not exists public.mobile_checkin_notification_dispatches (
  checkin_id uuid primary key references public.checkins(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_mobile_checkin_notification_dispatches_author_created
  on public.mobile_checkin_notification_dispatches (author_id, created_at desc);

alter table public.mobile_checkin_notification_dispatches enable row level security;
revoke all on table public.mobile_checkin_notification_dispatches from anon;
revoke all on table public.mobile_checkin_notification_dispatches from authenticated;
grant all on table public.mobile_checkin_notification_dispatches to service_role;

comment on table public.mobile_checkin_notification_dispatches is
  'Registro idempotente dos fan-outs solicitados por clientes mobile.';
