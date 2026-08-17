-- Channel sessions for USSD and WhatsApp care.

create table if not exists channel_sessions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  channel text not null check (channel in ('ussd', 'whatsapp', 'sms')),
  external_session_id text,
  phone text not null,
  state text not null default 'open',
  last_input text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_channel_sessions_phone on channel_sessions(phone);
create index if not exists idx_channel_sessions_external on channel_sessions(external_session_id);

alter table channel_sessions enable row level security;

create policy channel_sessions_staff on channel_sessions
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());
