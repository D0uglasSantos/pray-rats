-- Pray Rats — tickets e receipts do Expo Push Service.
-- Armazena somente metadados técnicos; título/corpo da notificação não são persistidos.

create table if not exists public.expo_push_tickets (
  receipt_id text primary key,
  device_id uuid not null references public.mobile_push_devices(id) on delete cascade,
  status varchar(12) not null default 'pending',
  attempts smallint not null default 0,
  next_check_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  checked_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expo_push_tickets_status_check
    check (status in ('pending', 'ok', 'error', 'expired')),
  constraint expo_push_tickets_attempts_check check (attempts >= 0)
);

create index if not exists idx_expo_push_tickets_due
  on public.expo_push_tickets (next_check_at)
  where status = 'pending';

alter table public.expo_push_tickets enable row level security;
revoke all on table public.expo_push_tickets from anon;
revoke all on table public.expo_push_tickets from authenticated;
grant all on table public.expo_push_tickets to service_role;

comment on table public.expo_push_tickets is
  'Metadados temporários para consultar receipts Expo Push; sem conteúdo da notificação.';
