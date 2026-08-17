-- InsuraX — core insurance operating platform schema
-- Covers acquisition, product, quote, PAS, payments, claims, fraud,
-- CRM, notifications, accounting, reinsurance, compliance, documents, AI.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum (
    'participant', 'agent', 'broker', 'underwriter', 'claims_officer',
    'claims_assessor', 'finance', 'compliance', 'shariah_officer',
    'admin', 'call_center', 'branch_manager', 'api_partner'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type kyc_status as enum ('pending', 'in_review', 'verified', 'rejected', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_line as enum (
    'motor', 'medical', 'family_takaful', 'funeral', 'agriculture',
    'livestock', 'travel', 'gadget', 'micro', 'asset'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type takaful_model as enum ('wakala', 'mudarabah', 'hybrid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contribution_frequency as enum (
    'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'single'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type channel as enum (
    'mobile', 'web', 'ussd', 'whatsapp', 'agent', 'broker', 'api', 'embedded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type quote_status as enum (
    'draft', 'priced', 'referred', 'declined', 'accepted', 'expired', 'converted'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type uw_decision as enum ('auto_accept', 'refer', 'reject', 'load');
exception when duplicate_object then null; end $$;

do $$ begin
  create type policy_status as enum (
    'draft', 'pending_payment', 'pending_underwriting', 'active', 'suspended',
    'cancelled', 'expired', 'lapsed', 'reinstated'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type claim_status as enum (
    'reported', 'documents_pending', 'under_review', 'fraud_check', 'assigned',
    'assessing', 'estimated', 'pending_approval', 'approved', 'rejected',
    'paid', 'closed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'reconciled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum (
    'mpesa_stk', 'mpesa_paybill', 'mpesa_till', 'airtel_money', 'bank_transfer',
    'card', 'direct_debit', 'flutterwave', 'paystack', 'cellulant', 'stripe'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type reinsurance_type as enum ('facultative', 'treaty');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tenancy & org
-- ---------------------------------------------------------------------------
create table if not exists operators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trading_name text,
  license_number text,
  country_code text not null default 'KE',
  base_currency text not null default 'KES',
  takaful_model takaful_model not null default 'wakala',
  wakala_fee_rate numeric(8,4) not null default 0.1500,
  mudarib_share_rate numeric(8,4) not null default 0.3000,
  shariah_board_name text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  code text not null,
  name text not null,
  city text,
  county text,
  country_code text not null default 'KE',
  is_active boolean not null default true,
  unique (operator_id, code)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  operator_id uuid references operators(id),
  branch_id uuid references branches(id),
  role user_role not null default 'participant',
  full_name text,
  phone text,
  email text,
  national_id text,
  date_of_birth date,
  gender text,
  kra_pin text,
  kyc_status kyc_status not null default 'pending',
  locale text not null default 'en',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  role user_role not null,
  resource text not null,
  action text not null,
  unique (role, resource, action)
);

-- ---------------------------------------------------------------------------
-- Participants, KYC, agents, brokers
-- ---------------------------------------------------------------------------
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  profile_id uuid references profiles(id),
  full_name text not null,
  phone text not null,
  email text,
  national_id text,
  date_of_birth date,
  gender text,
  occupation text,
  county text,
  risk_score numeric(6,2),
  lifetime_value numeric(14,2) not null default 0,
  source_channel channel not null default 'web',
  created_at timestamptz not null default now()
);

create table if not exists kyc_records (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  status kyc_status not null default 'pending',
  id_type text,
  id_number text,
  id_document_url text,
  selfie_url text,
  biometric_hash text,
  provider text,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists aml_screenings (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade,
  screening_type text not null,
  provider text,
  match_status text not null default 'clear',
  details jsonb not null default '{}'::jsonb,
  screened_at timestamptz not null default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  profile_id uuid references profiles(id),
  branch_id uuid references branches(id),
  agent_code text not null unique,
  full_name text not null,
  phone text,
  email text,
  license_number text,
  status text not null default 'active',
  wallet_balance numeric(14,2) not null default 0,
  ytd_gwp numeric(14,2) not null default 0,
  sales_target numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists brokers (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  profile_id uuid references profiles(id),
  broker_code text not null unique,
  legal_name text not null,
  license_number text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  agent_id uuid references agents(id),
  broker_id uuid references brokers(id),
  full_name text not null,
  phone text,
  email text,
  product_line product_line,
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Product engine
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  code text not null,
  slug text not null,
  name text not null,
  line product_line not null,
  description text,
  takaful_model takaful_model not null default 'wakala',
  contribution_frequencies contribution_frequency[] not null default array['monthly', 'annually']::contribution_frequency[],
  min_contribution numeric(14,2),
  max_sum_covered numeric(14,2),
  waiting_period_days int not null default 0,
  wakala_fee_rate numeric(8,4),
  is_micro boolean not null default false,
  is_active boolean not null default true,
  shariah_approved boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  unique (operator_id, code),
  unique (operator_id, slug)
);

create table if not exists product_covers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_optional boolean not null default false,
  sum_covered numeric(14,2),
  unique (product_id, code)
);

create table if not exists product_riders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  code text not null,
  name text not null,
  contribution numeric(14,2) not null default 0,
  unique (product_id, code)
);

create table if not exists premium_tables (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  rating_key text not null,
  rating_from numeric(14,2),
  rating_to numeric(14,2),
  base_rate numeric(12,6) not null,
  min_contribution numeric(14,2),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  expression jsonb not null,
  on_fail uw_decision not null default 'reject',
  message text,
  sort_order int not null default 0
);

create table if not exists tax_levy_rules (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  code text not null,
  name text not null,
  rate numeric(8,4) not null,
  applies_to product_line[],
  is_active boolean not null default true
);

create table if not exists commission_rules (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  channel channel not null,
  rate numeric(8,4) not null,
  is_active boolean not null default true
);

create table if not exists underwriting_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text not null,
  condition jsonb not null,
  decision uw_decision not null,
  load_percent numeric(8,4),
  message text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Quotes, underwriting, policies
-- ---------------------------------------------------------------------------
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  quote_number text not null unique,
  participant_id uuid references participants(id),
  agent_id uuid references agents(id),
  broker_id uuid references brokers(id),
  product_id uuid not null references products(id),
  channel channel not null default 'web',
  status quote_status not null default 'draft',
  risk_payload jsonb not null default '{}'::jsonb,
  sum_covered numeric(14,2) not null default 0,
  base_contribution numeric(14,2) not null default 0,
  wakala_fee numeric(14,2) not null default 0,
  tabarru numeric(14,2) not null default 0,
  taxes numeric(14,2) not null default 0,
  levies numeric(14,2) not null default 0,
  total_contribution numeric(14,2) not null default 0,
  frequency contribution_frequency not null default 'annually',
  monthly_equivalent numeric(14,2),
  uw_decision uw_decision,
  uw_notes text,
  valid_until date,
  created_at timestamptz not null default now()
);

create table if not exists underwriting_cases (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade,
  assigned_to uuid references profiles(id),
  status text not null default 'open',
  decision uw_decision,
  load_percent numeric(8,4),
  notes text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists policies (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  policy_number text not null unique,
  quote_id uuid references quotes(id),
  participant_id uuid not null references participants(id),
  product_id uuid not null references products(id),
  agent_id uuid references agents(id),
  broker_id uuid references brokers(id),
  branch_id uuid references branches(id),
  status policy_status not null default 'pending_payment',
  channel channel not null default 'web',
  inception_date date not null,
  expiry_date date not null,
  sum_covered numeric(14,2) not null,
  contribution numeric(14,2) not null,
  frequency contribution_frequency not null,
  wakala_fee numeric(14,2) not null default 0,
  tabarru numeric(14,2) not null default 0,
  certificate_url text,
  risk_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists policy_endorsements (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  endorsement_number text not null unique,
  type text not null,
  effective_date date not null,
  contribution_delta numeric(14,2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists policy_history (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  event_type text not null,
  from_status policy_status,
  to_status policy_status,
  actor_id uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  policy_id uuid references policies(id),
  participant_id uuid references participants(id),
  reference text not null unique,
  method payment_method not null,
  status payment_status not null default 'pending',
  amount numeric(14,2) not null,
  currency text not null default 'KES',
  provider_ref text,
  receipt_number text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists payment_installments (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  due_date date not null,
  amount numeric(14,2) not null,
  status payment_status not null default 'pending',
  payment_id uuid references payments(id),
  retry_count int not null default 0
);

create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  agent_id uuid references agents(id),
  broker_id uuid references brokers(id),
  policy_id uuid references policies(id),
  payment_id uuid references payments(id),
  amount numeric(14,2) not null,
  rate numeric(8,4) not null,
  status text not null default 'accrued',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Claims & fraud
-- ---------------------------------------------------------------------------
create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  claim_number text not null unique,
  policy_id uuid not null references policies(id),
  participant_id uuid not null references participants(id),
  status claim_status not null default 'reported',
  incident_date date not null,
  reported_at timestamptz not null default now(),
  description text,
  incident_location text,
  gps_lat numeric(10,7),
  gps_lng numeric(10,7),
  claimed_amount numeric(14,2),
  approved_amount numeric(14,2),
  fraud_score numeric(6,2),
  assigned_assessor_id uuid references profiles(id),
  sla_due_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists claim_documents (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  doc_type text not null,
  file_url text not null,
  ocr_text text,
  uploaded_at timestamptz not null default now()
);

create table if not exists claim_assessments (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  assessor_id uuid references profiles(id),
  estimate_amount numeric(14,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists claim_approvals (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  approver_id uuid references profiles(id),
  decision text not null,
  amount numeric(14,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists fraud_signals (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references claims(id) on delete cascade,
  participant_id uuid references participants(id),
  signal_type text not null,
  severity text not null default 'medium',
  score numeric(6,2) not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CRM, notifications, documents
-- ---------------------------------------------------------------------------
create table if not exists crm_tickets (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  participant_id uuid references participants(id),
  channel text not null,
  subject text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  assigned_to uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists crm_interactions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references crm_tickets(id) on delete cascade,
  participant_id uuid references participants(id),
  channel text not null,
  direction text not null,
  body text,
  created_at timestamptz not null default now()
);

create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  code text not null,
  channel text not null,
  subject text,
  body text not null,
  unique (operator_id, code, channel)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  profile_id uuid references profiles(id),
  channel text not null,
  title text not null,
  body text not null,
  status text not null default 'queued',
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  owner_type text not null,
  owner_id uuid not null,
  doc_type text not null,
  file_name text not null,
  file_url text not null,
  ocr_text text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Accounting & reinsurance
-- ---------------------------------------------------------------------------
create table if not exists gl_accounts (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null,
  unique (operator_id, code)
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  entry_date date not null,
  reference text,
  memo text,
  source_type text,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references journal_entries(id) on delete cascade,
  gl_account_id uuid not null references gl_accounts(id),
  debit numeric(14,2) not null default 0,
  credit numeric(14,2) not null default 0
);

create table if not exists reinsurance_treaties (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  name text not null,
  type reinsurance_type not null,
  reinsurer_name text not null,
  cession_rate numeric(8,4),
  effective_from date not null,
  effective_to date,
  is_active boolean not null default true
);

create table if not exists reinsurance_cessions (
  id uuid primary key default gen_random_uuid(),
  treaty_id uuid not null references reinsurance_treaties(id) on delete cascade,
  policy_id uuid references policies(id),
  claim_id uuid references claims(id),
  ceded_contribution numeric(14,2) not null default 0,
  recovery_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists participant_surplus (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  participant_id uuid not null references participants(id),
  period text not null,
  surplus_amount numeric(14,2) not null,
  status text not null default 'declared',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AI, audit, API partners
-- ---------------------------------------------------------------------------
create table if not exists ai_scores (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id uuid not null,
  score_type text not null,
  score numeric(8,4) not null,
  explanation jsonb not null default '{}'::jsonb,
  model_name text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id),
  actor_id uuid references profiles(id),
  action text not null,
  resource text not null,
  resource_id uuid,
  ip inet,
  user_agent text,
  diff jsonb,
  created_at timestamptz not null default now()
);

create table if not exists api_partners (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  name text not null,
  partner_type text not null,
  api_key_hash text,
  webhook_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  code text not null,
  name text not null,
  definition jsonb not null,
  is_active boolean not null default true,
  unique (operator_id, code)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_profiles_operator_role on profiles(operator_id, role);
create index if not exists idx_participants_phone on participants(phone);
create index if not exists idx_quotes_participant on quotes(participant_id);
create index if not exists idx_policies_participant on policies(participant_id);
create index if not exists idx_policies_status on policies(status);
create index if not exists idx_claims_policy on claims(policy_id);
create index if not exists idx_claims_status on claims(status);
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_notifications_profile on notifications(profile_id);
create index if not exists idx_audit_logs_resource on audit_logs(resource, resource_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table operators enable row level security;
alter table branches enable row level security;
alter table profiles enable row level security;
alter table participants enable row level security;
alter table kyc_records enable row level security;
alter table aml_screenings enable row level security;
alter table agents enable row level security;
alter table brokers enable row level security;
alter table leads enable row level security;
alter table products enable row level security;
alter table product_covers enable row level security;
alter table product_riders enable row level security;
alter table premium_tables enable row level security;
alter table eligibility_rules enable row level security;
alter table tax_levy_rules enable row level security;
alter table commission_rules enable row level security;
alter table underwriting_rules enable row level security;
alter table quotes enable row level security;
alter table underwriting_cases enable row level security;
alter table policies enable row level security;
alter table policy_endorsements enable row level security;
alter table policy_history enable row level security;
alter table payments enable row level security;
alter table payment_installments enable row level security;
alter table commissions enable row level security;
alter table claims enable row level security;
alter table claim_documents enable row level security;
alter table claim_assessments enable row level security;
alter table claim_approvals enable row level security;
alter table fraud_signals enable row level security;
alter table crm_tickets enable row level security;
alter table crm_interactions enable row level security;
alter table notification_templates enable row level security;
alter table notifications enable row level security;
alter table documents enable row level security;
alter table gl_accounts enable row level security;
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;
alter table reinsurance_treaties enable row level security;
alter table reinsurance_cessions enable row level security;
alter table participant_surplus enable row level security;
alter table ai_scores enable row level security;
alter table audit_logs enable row level security;
alter table api_partners enable row level security;
alter table workflow_definitions enable row level security;
alter table role_permissions enable row level security;

create or replace function public.current_profile()
returns profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in (
        'agent','broker','underwriter','claims_officer','claims_assessor',
        'finance','compliance','shariah_officer','admin','call_center',
        'branch_manager','api_partner'
      )
  );
$$;

-- Authenticated users can read their own profile; staff can read operator peers.
create policy profiles_self on profiles
  for select to authenticated
  using (id = auth.uid() or (public.is_staff() and operator_id = (public.current_profile()).operator_id));

create policy profiles_self_update on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy products_read on products
  for select to authenticated
  using (is_active = true or public.is_staff());

create policy quotes_access on quotes
  for all to authenticated
  using (
    participant_id in (select id from participants where profile_id = auth.uid())
    or agent_id in (select id from agents where profile_id = auth.uid())
    or broker_id in (select id from brokers where profile_id = auth.uid())
    or public.is_staff()
  )
  with check (
    participant_id in (select id from participants where profile_id = auth.uid())
    or agent_id in (select id from agents where profile_id = auth.uid())
    or broker_id in (select id from brokers where profile_id = auth.uid())
    or public.is_staff()
  );

create policy policies_access on policies
  for select to authenticated
  using (
    participant_id in (select id from participants where profile_id = auth.uid())
    or agent_id in (select id from agents where profile_id = auth.uid())
    or broker_id in (select id from brokers where profile_id = auth.uid())
    or public.is_staff()
  );

create policy claims_access on claims
  for all to authenticated
  using (
    participant_id in (select id from participants where profile_id = auth.uid())
    or public.is_staff()
  )
  with check (
    participant_id in (select id from participants where profile_id = auth.uid())
    or public.is_staff()
  );

create policy payments_access on payments
  for select to authenticated
  using (
    participant_id in (select id from participants where profile_id = auth.uid())
    or public.is_staff()
  );

create policy notifications_self on notifications
  for select to authenticated
  using (profile_id = auth.uid() or public.is_staff());

create policy staff_operator_read_participants on participants
  for select to authenticated
  using (
    profile_id = auth.uid()
    or (public.is_staff() and operator_id = (public.current_profile()).operator_id)
  );

create policy staff_write_core on products
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());
