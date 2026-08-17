-- Partner verification audit trail (IPRS, NTSA, OCR, CRB, etc.)

create table if not exists partner_verifications (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  partner text not null check (partner in ('iprs', 'ntsa', 'ocr', 'crb', 'ecitizen', 'other')),
  subject_type text not null default 'person',
  subject_key text not null,
  request jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  matched boolean,
  risk_flags text[] not null default '{}',
  reference text,
  mode text not null default 'sandbox_simulated',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_partner_verifications_partner on partner_verifications(partner);
create index if not exists idx_partner_verifications_subject on partner_verifications(subject_key);
create index if not exists idx_partner_verifications_created on partner_verifications(created_at desc);

alter table partner_verifications enable row level security;

create policy partner_verifications_staff on partner_verifications
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());
