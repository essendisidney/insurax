-- Auth profile bootstrap, insert policies, and Kenya seed data for InsuraX.

-- ---------------------------------------------------------------------------
-- Profile on signup (role from app_metadata only — never user_metadata)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role user_role;
  op_id uuid;
begin
  begin
    chosen_role := coalesce(nullif(new.raw_app_meta_data->>'role', ''), 'participant')::user_role;
  exception when others then
    chosen_role := 'participant';
  end;

  op_id := nullif(new.raw_app_meta_data->>'operator_id', '')::uuid;
  if op_id is null then
    select id into op_id from operators order by created_at limit 1;
  end if;

  insert into public.profiles (id, operator_id, role, full_name, email, phone)
  values (
    new.id,
    op_id,
    chosen_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.phone
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Additional RLS for writes
-- ---------------------------------------------------------------------------
create policy quotes_insert on quotes
  for insert to authenticated
  with check (public.is_staff() or participant_id in (select id from participants where profile_id = auth.uid()));

create policy policies_staff_write on policies
  for all to authenticated
  using (public.is_staff() or participant_id in (select id from participants where profile_id = auth.uid()))
  with check (public.is_staff() or participant_id in (select id from participants where profile_id = auth.uid()));

create policy claims_update on claims
  for update to authenticated
  using (
    participant_id in (select id from participants where profile_id = auth.uid())
    or public.is_staff()
  )
  with check (
    participant_id in (select id from participants where profile_id = auth.uid())
    or public.is_staff()
  );

create policy payments_insert on payments
  for insert to authenticated
  with check (public.is_staff() or participant_id in (select id from participants where profile_id = auth.uid()));

create policy operators_read on operators
  for select to authenticated
  using (true);

create policy branches_read on branches
  for select to authenticated
  using (true);

create policy agents_read on agents
  for select to authenticated
  using (true);

create policy brokers_read on brokers
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Seed: operator, branch, products, sample participants/agents
-- Fixed UUIDs so the Next.js app can reference NEXT_PUBLIC_OPERATOR_ID
-- ---------------------------------------------------------------------------
insert into operators (
  id, name, trading_name, license_number, country_code, base_currency,
  takaful_model, wakala_fee_rate, mudarib_share_rate, shariah_board_name
) values (
  '00000000-0000-4000-8000-000000000001',
  'InsuraX Kenya',
  'InsuraX',
  'IRA/INS/2024/014',
  'KE',
  'KES',
  'wakala',
  0.1500,
  0.3000,
  'InsuraX Shariah Supervisory Board'
) on conflict (id) do nothing;

insert into branches (id, operator_id, code, name, city, county) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'NBO', 'Nairobi CBD', 'Nairobi', 'Nairobi'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 'MSA', 'Mombasa', 'Mombasa', 'Mombasa'),
  ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000001', 'KSM', 'Kisumu', 'Kisumu', 'Kisumu'),
  ('00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000001', 'ELD', 'Eldoret', 'Eldoret', 'Uasin Gishu'),
  ('00000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000001', 'NKR', 'Nakuru', 'Nakuru', 'Nakuru')
on conflict do nothing;

insert into products (
  id, operator_id, code, slug, name, line, description, takaful_model,
  contribution_frequencies, min_contribution, max_sum_covered, waiting_period_days,
  wakala_fee_rate, is_micro, is_active, shariah_approved, config
) values
(
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'MOT-COMP', 'motor-comprehensive', 'Motor Comprehensive Takaful', 'motor',
  'Own damage, third party, theft and windscreen for private cars.',
  'wakala', array['monthly','annually']::contribution_frequency[], 18000, 8000000, 0, 0.15, false, true, true,
  '{"summary":"Own damage, third party, theft and windscreen for private cars.","base_rate":0.045,"rating_basis":"sum_covered","covers":[{"code":"OD","name":"Own damage"},{"code":"TPPD","name":"Third party property"},{"code":"TPBI","name":"Third party injury"},{"code":"THEFT","name":"Theft"},{"code":"WS","name":"Windscreen","optional":true}]}'::jsonb
),
(
  '10000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'MIC-BODA', 'boda-micro', 'Boda Boda Micro Takaful', 'micro',
  'Embedded micro cover for riders and passengers with USSD and STK push contributions.',
  'wakala', array['daily','weekly','monthly']::contribution_frequency[], 30, 250000, 1, 0.18, true, true, true,
  '{"summary":"Daily or weekly cover for riders via M-Pesa.","base_rate":0.12,"rating_basis":"flat","covers":[{"code":"PA","name":"Personal accident"},{"code":"TP","name":"Third party"}]}'::jsonb
),
(
  '10000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  'MED-CASH', 'hospital-cash', 'Hospital Cash Micro', 'medical',
  'Affordable inpatient cash benefit with 14-day waiting period and WhatsApp claims.',
  'wakala', array['weekly','monthly']::contribution_frequency[], 150, 150000, 14, 0.12, true, true, true,
  '{"summary":"Daily hospital cash for informal workers and SACCO members.","base_rate":0,"rating_basis":"age_band","covers":[{"code":"HC","name":"Hospital cash"}]}'::jsonb
),
(
  '10000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000001',
  'FAM-PROTECT', 'family-takaful', 'Family Takaful Protect', 'family_takaful',
  'Participant risk fund cover for death and permanent disability, with optional education rider.',
  'hybrid', array['monthly','annually']::contribution_frequency[], 1200, 5000000, 30, 0.20, false, true, true,
  '{"summary":"Term family protection with surplus sharing.","base_rate":0.008,"rating_basis":"sum_covered","covers":[{"code":"DEATH","name":"Death benefit"},{"code":"PD","name":"Permanent disability"},{"code":"EDU","name":"Education rider","optional":true}]}'::jsonb
),
(
  '10000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000001',
  'FUN-JANAAZA', 'janaaza', 'Janaaza Cover', 'funeral',
  'Fast payout funeral takaful designed for chama and mosque groups.',
  'wakala', array['monthly','annually']::contribution_frequency[], 200, 200000, 21, 0.10, true, true, true,
  '{"summary":"Immediate funeral expense support for the family.","base_rate":0.015,"rating_basis":"sum_covered","covers":[{"code":"FUN","name":"Funeral expenses"}]}'::jsonb
),
(
  '10000000-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000001',
  'AGR-CROP', 'crop-index', 'Crop Index Takaful', 'agriculture',
  'Parametric payouts triggered by rainfall deviation.',
  'wakala', array['single','annually']::contribution_frequency[], 2500, 2000000, 0, 0.12, false, true, true,
  '{"summary":"Weather-index cover for maize, tea and horticulture.","base_rate":0.06,"rating_basis":"sum_covered","covers":[{"code":"DROUGHT","name":"Drought index"},{"code":"FLOOD","name":"Excess rainfall"}]}'::jsonb
),
(
  '10000000-0000-4000-8000-000000000007',
  '00000000-0000-4000-8000-000000000001',
  'AGR-LIVE', 'livestock', 'Livestock Takaful', 'livestock',
  'Agent offline enrolment, ear-tag registry and veterinary partner network.',
  'wakala', array['monthly','annually']::contribution_frequency[], 800, 500000, 14, 0.14, true, true, true,
  '{"summary":"Cattle, goats and camels with photo-based onboarding.","base_rate":0.07,"rating_basis":"sum_covered","covers":[{"code":"MORT","name":"Mortality"},{"code":"THEFT","name":"Theft","optional":true}]}'::jsonb
),
(
  '10000000-0000-4000-8000-000000000008',
  '00000000-0000-4000-8000-000000000001',
  'TRV-AFR', 'travel', 'Travel Takaful', 'travel',
  'Instant certificates for visa applications with medical emergency and baggage benefits.',
  'wakala', array['single']::contribution_frequency[], 1800, 10000000, 0, 0.20, false, true, true,
  '{"summary":"Schengen, Umrah and regional travel cover.","base_rate":0.004,"rating_basis":"sum_covered","covers":[{"code":"MED","name":"Emergency medical"},{"code":"BAG","name":"Baggage"},{"code":"CXL","name":"Trip cancellation","optional":true}]}'::jsonb
),
(
  '10000000-0000-4000-8000-000000000009',
  '00000000-0000-4000-8000-000000000001',
  'GAD-DEV', 'gadget', 'Device Shield', 'gadget',
  'Embedded at checkout with fintechs and electronics retailers.',
  'wakala', array['monthly','annually']::contribution_frequency[], 250, 250000, 7, 0.22, true, true, true,
  '{"summary":"Phones, laptops and POS devices for merchants.","base_rate":0.09,"rating_basis":"sum_covered","covers":[{"code":"SCREEN","name":"Screen damage"},{"code":"THEFT","name":"Theft"}]}'::jsonb
),
(
  '10000000-0000-4000-8000-00000000000a',
  '00000000-0000-4000-8000-000000000001',
  'AST-FIRE', 'asset', 'Asset & Fire Takaful', 'asset',
  'Fire, burglary and allied perils for MSMEs with flexible monthly contributions.',
  'wakala', array['monthly','annually']::contribution_frequency[], 1500, 20000000, 0, 0.16, false, true, true,
  '{"summary":"Shops, kiosks, SACCO offices and household contents.","base_rate":0.012,"rating_basis":"sum_covered","covers":[{"code":"FIRE","name":"Fire"},{"code":"BURG","name":"Burglary"}]}'::jsonb
)
on conflict do nothing;

insert into participants (
  id, operator_id, full_name, phone, email, national_id, date_of_birth, occupation, county, risk_score, lifetime_value, source_channel
) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Amina Wanjiku', '+254711000111', 'amina@example.com', '32109876', '1994-03-12', 'Retailer', 'Nairobi', 22, 186400, 'mobile'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Brian Kipchoge', '+254712222333', 'brian.k@example.com', '29876543', '1988-11-02', 'Farmer', 'Uasin Gishu', 31, 54200, 'agent'),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Halima Mohamed', '+254713333444', 'halima@example.com', '27654321', '1990-07-19', 'Nurse', 'Mombasa', 18, 91000, 'whatsapp'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'Samuel Mwangi', '+254714444555', 'sam.mwangi@example.com', '25432109', '1982-01-30', 'Boda rider', 'Nakuru', 44, 12800, 'ussd'),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 'Linet Chebet', '+254715555666', 'linet@example.com', '30987654', '1997-09-08', 'Teacher', 'Kericho', 15, 240500, 'web')
on conflict do nothing;

insert into agents (
  id, operator_id, branch_id, agent_code, full_name, phone, email, license_number, wallet_balance, ytd_gwp, sales_target
) values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 'AG-KE-0142', 'Joseph Otieno', '+254722111222', 'joseph.agent@insurax.africa', 'IRA-AG-88921', 42850, 12840000, 18000000),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'AG-KE-0208', 'Mary Wambui', '+254722333444', 'mary.agent@insurax.africa', 'IRA-AG-90112', 18900, 22150000, 25000000)
on conflict do nothing;

insert into brokers (id, operator_id, broker_code, legal_name, license_number) values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'BR-KE-07', 'Zahra Insurance Brokers', 'IRA-BR-2211')
on conflict do nothing;

insert into tax_levy_rules (operator_id, code, name, rate, applies_to) values
  ('00000000-0000-4000-8000-000000000001', 'TRAINING', 'Training levy', 0.0020, array['motor','medical','family_takaful','funeral','agriculture','livestock','travel','gadget','micro','asset']::product_line[]),
  ('00000000-0000-4000-8000-000000000001', 'PHCF', 'Policyholders Compensation Fund', 0.0025, array['motor','medical','family_takaful','funeral','agriculture','livestock','travel','gadget','micro','asset']::product_line[]),
  ('00000000-0000-4000-8000-000000000001', 'STAMP', 'Stamp duty', 0.0010, array['motor','medical','family_takaful','funeral','agriculture','livestock','travel','gadget','micro','asset']::product_line[])
on conflict do nothing;
