-- Optional payment provider columns for Daraja STK reconciliation.

alter table payments
  add column if not exists checkout_request_id text,
  add column if not exists merchant_request_id text,
  add column if not exists phone text,
  add column if not exists reconciled_at timestamptz;

create index if not exists idx_payments_checkout_request
  on payments(checkout_request_id);

create table if not exists payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mpesa',
  event_type text not null,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table payment_provider_events enable row level security;

create policy payment_events_staff on payment_provider_events
  for select to authenticated
  using (public.is_staff());
