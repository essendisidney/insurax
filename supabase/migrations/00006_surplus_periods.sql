-- Surplus periods with Shariah approval workflow.

create table if not exists surplus_periods (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  code text not null,
  label text not null,
  year int not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_shariah', 'approved', 'rejected', 'distributed')),
  tabarru_pool numeric(14,2) not null default 0,
  claims_cost numeric(14,2) not null default 0,
  expenses numeric(14,2) not null default 0,
  investment_income numeric(14,2) not null default 0,
  net_surplus numeric(14,2) not null default 0,
  participant_pool numeric(14,2) not null default 0,
  contingency_reserve numeric(14,2) not null default 0,
  charity_pool numeric(14,2) not null default 0,
  participant_share_rate numeric(6,4) not null default 0.7,
  contingency_rate numeric(6,4) not null default 0.2,
  charity_rate numeric(6,4) not null default 0.1,
  shariah_notes text,
  declared_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (operator_id, code)
);

create index if not exists idx_surplus_periods_status on surplus_periods(status);

-- Link participant_surplus rows to a declared period when present.
alter table participant_surplus
  add column if not exists surplus_period_id uuid references surplus_periods(id) on delete set null;

alter table surplus_periods enable row level security;

create policy surplus_periods_staff on surplus_periods
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());
