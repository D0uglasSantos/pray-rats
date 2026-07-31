-- Pray Rats — Lembretes diários de check-in (manhã, tarde e noite)
-- Aditivo e idempotente: seguro para reexecução.

-- Preferências de notificação por usuário (opt-in + timezone IANA)
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  daily_reminders_enabled boolean not null default false,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Registro de envios para deduplicar (1 push por slot por dia local).
-- Acesso exclusivo via service role (cron): nenhuma policy é criada.
create table if not exists public.daily_reminder_sends (
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot varchar(20) not null,
  local_date date not null,
  sent_at timestamptz not null default now(),
  constraint daily_reminder_sends_pkey primary key (user_id, slot, local_date)
);

do $$
begin
  alter table public.daily_reminder_sends
    add constraint daily_reminder_sends_slot_check
    check (slot in ('morning', 'afternoon', 'evening'));
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_daily_reminder_sends_sent_at
  on public.daily_reminder_sends(sent_at);

-- RLS
alter table public.notification_preferences enable row level security;
alter table public.daily_reminder_sends enable row level security;

create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
