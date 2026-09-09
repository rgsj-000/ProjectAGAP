begin;

-- Project AGAP synthetic Household Action Card scenarios for the hackathon demo.
-- These records contain no names or exact addresses and are explicitly marked
-- SYNTHETIC. They exercise different household preparedness conditions across
-- the seven barangays covered by the current synthetic advisory.

with scenarios(
  household_code, barangay_name, purok, members,
  has_children, has_older_person, has_pwd, needs_medicine, has_pets,
  housing_note, communication_methods
) as (
  values
    ('DLH-P01-HH0101','Dalahican','Purok 1',4, true,false,false,false,true,
      'Single-storey concrete dwelling; synthetic demo profile.', array['SMS','Mobile Internet']::text[]),
    ('DLH-P02-HH0102','Dalahican','Purok 2',2, false,true,false,true,false,
      'Lightweight single-storey dwelling; synthetic demo profile.', array['Radio','Barangay Announcements']::text[]),
    ('DLH-P04-HH0103','Dalahican','Purok 4',6, true,true,true,true,false,
      'Mixed-material dwelling with a household member needing mobility support; synthetic demo profile.', array['SMS','Radio']::text[]),

    ('COT-P01-HH0201','Cotta','Purok 1',3, false,false,true,false,false,
      'Concrete dwelling with accessibility considerations; synthetic demo profile.', array['SMS','Mobile Internet']::text[]),
    ('COT-P02-HH0202','Cotta','Purok 2',5, true,false,false,false,true,
      'Single-storey family dwelling with children and pets; synthetic demo profile.', array['SMS','Barangay Announcements']::text[]),
    ('COT-P03-HH0203','Cotta','Purok 3',1, false,true,false,true,false,
      'Older adult living alone; synthetic demo profile.', array['Radio','Barangay Announcements']::text[]),

    ('BAR-P01-HH0301','Barra','Purok 1',4, true,false,false,true,false,
      'Family dwelling with a child and essential medicine requirement; synthetic demo profile.', array['Radio','Barangay Announcements']::text[]),
    ('BAR-P02-HH0302','Barra','Purok 2',7, true,true,true,false,true,
      'Large multi-generational household with mobility support needs and pets; synthetic demo profile.', array['SMS','Radio']::text[]),
    ('BAR-P03-HH0303','Barra','Purok 3',2, false,false,false,false,true,
      'Two-person household with pets; synthetic demo profile.', array['Mobile Internet','SMS']::text[]),

    ('GUL-P01-HH0401','Gulang-gulang','Purok 1',5, true,true,false,false,false,
      'Multi-generational household with children and an older person; synthetic demo profile.', array['SMS','Mobile Internet']::text[]),
    ('GUL-P02-HH0402','Gulang-gulang','Purok 2',3, false,false,true,true,false,
      'Household with mobility limitation and an essential medicine requirement; synthetic demo profile.', array['Radio','Barangay Announcements']::text[]),
    ('GUL-P03-HH0403','Gulang-gulang','Purok 3',6, true,false,false,true,true,
      'Larger household with children, medicines, and pets; synthetic demo profile.', array['SMS','Radio','Mobile Internet']::text[]),

    ('IBD-P01-HH0501','Ibabang Dupay','Purok 1',4, true,false,false,false,false,
      'Family household with children; synthetic demo profile.', array['SMS','Barangay Announcements']::text[]),
    ('IBD-P02-HH0502','Ibabang Dupay','Purok 2',2, false,true,false,true,false,
      'Older-person household with essential medicine requirement; synthetic demo profile.', array['Radio']::text[]),
    ('IBD-P03-HH0503','Ibabang Dupay','Purok 3',5, false,false,true,false,true,
      'Household with mobility support needs and pets; synthetic demo profile.', array['SMS','Barangay Announcements']::text[]),

    ('MYC-P01-HH0601','Mayao Crossing','Purok 1',6, true,true,false,true,false,
      'Multi-generational household with children, older person, and medicines; synthetic demo profile.', array['SMS','Radio']::text[]),
    ('MYC-P02-HH0602','Mayao Crossing','Purok 2',3, false,false,false,false,true,
      'Small household with pets; synthetic demo profile.', array['Mobile Internet','SMS']::text[]),
    ('MYC-P03-HH0603','Mayao Crossing','Purok 3',1, false,false,true,false,false,
      'Single-person household with mobility limitation; synthetic demo profile.', array['Barangay Announcements','Radio']::text[]),

    ('RAN-P01-HH0701','Ransohan','Purok 1',4, true,false,false,false,true,
      'Family household with children and pets; synthetic demo profile.', array['Radio','Barangay Announcements']::text[]),
    ('RAN-P02-HH0702','Ransohan','Purok 2',2, false,true,true,true,false,
      'Two-person household with an older person, mobility limitation, and essential medicine requirement; synthetic demo profile.', array['Radio','SMS']::text[])
)
insert into public.household_profiles(
  household_code,
  barangay_id,
  purok,
  optional_purok,
  member_count,
  household_members,
  special_needs,
  has_children,
  has_older_person,
  has_pwd_or_mobility_limitation,
  needs_essential_medicine,
  has_pets,
  housing_characteristics,
  communication_methods,
  reference_date,
  verification_status,
  data_classification,
  is_demo
)
select
  s.household_code,
  b.id,
  s.purok,
  s.purok,
  s.members,
  s.members,
  jsonb_build_object(
    'has_children', s.has_children,
    'has_older_person', s.has_older_person,
    'has_pwd_or_mobility_limitation', s.has_pwd,
    'needs_essential_medicine', s.needs_medicine,
    'has_pets', s.has_pets
  ),
  s.has_children,
  s.has_older_person,
  s.has_pwd,
  s.needs_medicine,
  s.has_pets,
  jsonb_build_object(
    'description', s.housing_note,
    'data_classification', 'SYNTHETIC'
  ),
  s.communication_methods,
  current_date,
  'Unverified',
  'SYNTHETIC',
  true
from scenarios s
join public.barangays b on b.barangay_name = s.barangay_name
on conflict (household_code) do update set
  barangay_id = excluded.barangay_id,
  purok = excluded.purok,
  optional_purok = excluded.optional_purok,
  member_count = excluded.member_count,
  household_members = excluded.household_members,
  special_needs = excluded.special_needs,
  has_children = excluded.has_children,
  has_older_person = excluded.has_older_person,
  has_pwd_or_mobility_limitation = excluded.has_pwd_or_mobility_limitation,
  needs_essential_medicine = excluded.needs_essential_medicine,
  has_pets = excluded.has_pets,
  housing_characteristics = excluded.housing_characteristics,
  communication_methods = excluded.communication_methods,
  reference_date = excluded.reference_date,
  data_classification = 'SYNTHETIC',
  is_demo = true;

-- Complete two preparedness dimensions already present in the Household form.
insert into public.action_rules(
  rule_id, disaster_phase, hazard_or_condition, fact_field, operator, threshold,
  approved_action, why_it_applies, source_agency, source_document,
  target_audience, responsible_unit, requires_lgu_confirmation, version, active_status
)
values
  (
    'DEMO-HH-006','HOUSEHOLD','PWD or mobility limitation',
    'hasPwdOrMobilityLimitation','TRUTHY','true'::jsonb,
    'Prepare required assistive devices, mobility aids, essential personal items, and caregiver or support contact information.',
    'The household profile indicates a person with a disability or mobility limitation.',
    'SYNTHETIC — Project AGAP','Demonstration household-rule register',
    'HOUSEHOLD','Household',false,'demo-1.0',true
  ),
  (
    'DEMO-HH-007','HOUSEHOLD','Radio communication available',
    'communicationMethods','CONTAINS','"Radio"'::jsonb,
    'Keep a working radio and spare power source available and monitor verified LGU or barangay broadcasts.',
    'The household profile identifies radio as an available communication method.',
    'SYNTHETIC — Project AGAP','Demonstration household-rule register',
    'HOUSEHOLD','Household',false,'demo-1.0',true
  ),
  (
    'DEMO-HH-008','HOUSEHOLD','Barangay announcements available',
    'communicationMethods','CONTAINS','"Barangay Announcements"'::jsonb,
    'Monitor verified barangay announcements and make sure confirmed updates are shared with household members.',
    'The household profile identifies barangay announcements as an available communication method.',
    'SYNTHETIC — Project AGAP','Demonstration household-rule register',
    'HOUSEHOLD','Household',false,'demo-1.0',true
  )
on conflict (rule_id, version) do update set
  disaster_phase = excluded.disaster_phase,
  hazard_or_condition = excluded.hazard_or_condition,
  fact_field = excluded.fact_field,
  operator = excluded.operator,
  threshold = excluded.threshold,
  approved_action = excluded.approved_action,
  why_it_applies = excluded.why_it_applies,
  source_agency = excluded.source_agency,
  source_document = excluded.source_document,
  target_audience = excluded.target_audience,
  responsible_unit = excluded.responsible_unit,
  requires_lgu_confirmation = excluded.requires_lgu_confirmation,
  active_status = true;

-- Exact-code, minimal-field lookup for the public Household Action Card.
-- The table itself remains inaccessible to anon. Only an exact code can return
-- the non-identifying preparedness fields required to generate a card.
create or replace function public.lookup_household_profile(p_household_code text)
returns table(
  household_code text,
  barangay_name text,
  household_members integer,
  has_children boolean,
  has_older_person boolean,
  has_pwd_or_mobility_limitation boolean,
  needs_essential_medicine boolean,
  has_pets boolean,
  housing_characteristics jsonb,
  communication_methods text[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    hp.household_code,
    b.barangay_name,
    hp.household_members,
    hp.has_children,
    hp.has_older_person,
    hp.has_pwd_or_mobility_limitation,
    hp.needs_essential_medicine,
    hp.has_pets,
    hp.housing_characteristics,
    hp.communication_methods
  from public.household_profiles hp
  join public.barangays b on b.id = hp.barangay_id
  where hp.household_code = upper(trim(p_household_code))
    and upper(trim(p_household_code)) ~ '^[A-Z0-9-]{6,40}$'
  limit 1
$$;

revoke all on function public.lookup_household_profile(text) from public;
grant execute on function public.lookup_household_profile(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
commit;
