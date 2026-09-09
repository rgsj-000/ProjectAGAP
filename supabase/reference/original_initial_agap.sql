begin;
create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.lgu_role as enum ('admin','lgu_reviewer','lgu_encoder','field_reporter');
create type public.verification_state as enum ('UNVERIFIED','FOR_REVIEW','VERIFIED','REJECTED');
create type public.sync_state as enum ('ONLINE','OFFLINE','SYNCING','STALE','ACTION_REQUIRED','PENDING_SYNC','SYNCED');

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.lgu_role not null default 'field_reporter', assigned_barangay_id uuid,
  active_status boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.barangays (
  id uuid primary key default gen_random_uuid(), psgc_code text unique not null, city text not null default 'Lucena City', barangay_name text unique not null,
  population integer check (population >= 0), geometry geometry(MultiPolygon,4326), source text not null, reference_year integer,
  is_demo boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.user_profiles add constraint user_profiles_barangay_fk foreign key (assigned_barangay_id) references public.barangays(id);
create table public.population_profiles (
  id uuid primary key default gen_random_uuid(), barangay_id uuid not null references public.barangays on delete cascade, population integer not null check(population>=0), households integer not null check(households>=0),
  average_household_size numeric(6,2) check(average_household_size>=0), children integer check(children>=0), older_persons integer check(older_persons>=0), persons_with_disabilities integer check(persons_with_disabilities>=0),
  other_vulnerability_indicators jsonb not null default '{}', source text not null, reference_year integer not null, is_demo boolean not null default false, unique(barangay_id,reference_year)
);
create table public.hazards (id uuid primary key default gen_random_uuid(), name text not null, hazard_type text not null, source text not null, is_demo boolean not null default false);
create table public.population_exposure_estimates (
  id uuid primary key default gen_random_uuid(), barangay_id uuid not null references public.barangays, hazard_id uuid not null references public.hazards,
  estimated_exposed_population integer not null check(estimated_exposed_population>=0), estimated_households integer not null check(estimated_households>=0), vulnerable_group_estimates jsonb not null default '{}',
  estimation_method text not null, confidence_level text not null check(confidence_level in ('LOW','MEDIUM','HIGH')), source text not null, reference_date date not null, generated_at timestamptz not null default now(), limitations text[] not null default '{}', is_demo boolean not null default false
);
create table public.critical_facilities (
  id uuid primary key default gen_random_uuid(), name text not null, type text not null, barangay_id uuid references public.barangays, latitude double precision, longitude double precision,
  location geometry(Point,4326) generated always as (case when latitude is null or longitude is null then null else st_setsrid(st_makepoint(longitude,latitude),4326) end) stored,
  operational_status text not null default 'UNVERIFIED', capacity integer check(capacity>=0), last_validation_date date, source text not null, is_demo boolean not null default false
);
create table public.hazard_exposures (
  id uuid primary key default gen_random_uuid(), barangay_id uuid not null references public.barangays, hazard_type text not null, hazard_geometry geometry(MultiPolygon,4326), exposure_level text not null,
  source text not null, reference_date date not null, limitations text[] not null default '{}', is_demo boolean not null default false
);
create table public.preparedness_capacities (
  id uuid primary key default gen_random_uuid(), barangay_id uuid not null references public.barangays, evacuation_capacity integer not null default 0 check(evacuation_capacity>=0), temporary_shelter_capacity integer not null default 0 check(temporary_shelter_capacity>=0),
  responders integer not null default 0 check(responders>=0), equipment jsonb not null default '{}', backup_power text not null default 'UNVERIFIED', communication_access text[] not null default '{}', facility_status text not null default 'UNVERIFIED',
  validation_date date, source text not null, limitations text[] not null default '{}', is_demo boolean not null default false
);
create table public.methodologies (
  id uuid primary key default gen_random_uuid(), name text not null, description text not null, source text not null, version text not null,
  likelihood_scale jsonb not null, severity_scale jsonb not null, parameters jsonb not null, active_status boolean not null default true,
  created_at timestamptz not null default now(), unique(name,version)
);
create table public.advisories (
  id uuid primary key default gen_random_uuid(), source_agency text not null, advisory_type text not null, bulletin_reference text not null, warning_information text not null,
  issue_time timestamptz not null, validity_start timestamptz not null, validity_end timestamptz not null check(validity_end>validity_start), affected_areas text[] not null,
  source_link text not null, verification_status public.verification_state not null default 'UNVERIFIED', verified_by uuid references auth.users, verified_at timestamptz,
  created_by uuid references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), is_demo boolean not null default false,
  unique(source_agency,bulletin_reference)
);
create table public.household_profiles (
  id uuid primary key default gen_random_uuid(), household_code text unique not null, barangay_id uuid not null references public.barangays, optional_purok text,
  household_members integer check(household_members>0), has_children boolean not null default false, has_older_person boolean not null default false,
  has_pwd_or_mobility_limitation boolean not null default false, needs_essential_medicine boolean not null default false, has_pets boolean not null default false,
  housing_characteristics jsonb not null default '{}', communication_methods text[] not null default '{}', is_demo boolean not null default false, created_at timestamptz not null default now()
);
create table public.action_rules (
  id uuid primary key default gen_random_uuid(), rule_id text not null, disaster_phase text not null, hazard_or_condition text not null, fact_field text not null,
  operator text not null check(operator in ('EQ','NEQ','GT','GTE','LT','LTE','IN','CONTAINS','TRUTHY')), threshold jsonb not null,
  approved_action text not null, why_it_applies text not null, source_agency text not null, source_document text not null, target_audience text not null,
  responsible_unit text not null, requires_lgu_confirmation boolean not null default true, version text not null, active_status boolean not null default true,
  created_at timestamptz not null default now(), unique(rule_id,version)
);
create table public.risk_assessments (
  id uuid primary key default gen_random_uuid(), barangay_id uuid not null references public.barangays, advisory_id uuid not null references public.advisories,
  methodology_id uuid not null references public.methodologies, likelihood integer not null, severity integer not null, risk_result numeric not null, risk_category text not null,
  threat_level numeric, adaptive_capacity numeric, relative_vulnerability numeric, evidence jsonb not null, data_date date not null, assessment_date timestamptz not null default now(),
  confidence_level text not null check(confidence_level in ('LOW','MEDIUM','HIGH')), limitations text[] not null default '{}', created_by uuid references auth.users
);
create table public.damage_reports (
  id uuid primary key default gen_random_uuid(), client_id uuid unique not null, barangay_id uuid not null references public.barangays, purok text,
  reported_affected_persons integer not null default 0 check(reported_affected_persons>=0), reported_affected_households integer not null default 0 check(reported_affected_households>=0),
  vulnerable_groups jsonb not null default '{}', damage_type text not null, severity text not null, critical_facility_condition text, access_condition text,
  evidence jsonb not null default '[]', source text not null, verification_status public.verification_state not null default 'UNVERIFIED', reported_at timestamptz not null,
  device_timestamp timestamptz not null, verified_by uuid references auth.users, verified_at timestamptz, sync_status public.sync_state not null default 'PENDING_SYNC',
  version integer not null default 1, created_by uuid references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), is_demo boolean not null default false
);
create table public.needs_reports (
  id uuid primary key default gen_random_uuid(), damage_report_id uuid references public.damage_reports, barangay_id uuid not null references public.barangays,
  food_need boolean not null default false, water_need boolean not null default false, shelter_need boolean not null default false, medicine_need boolean not null default false,
  rescue_need boolean not null default false, restoration_need boolean not null default false, service_need text, urgency text not null,
  validated_quantity numeric, source text not null, verification_status public.verification_state not null default 'UNVERIFIED', created_at timestamptz not null default now(), is_demo boolean not null default false
);
create table public.post_impact_reviews (
  id uuid primary key default gen_random_uuid(), advisory_id uuid references public.advisories, event_reference text not null, barangay_id uuid not null references public.barangays,
  reported_population integer not null default 0, validated_population integer not null default 0, population_awaiting_validation integer generated always as (greatest(0,reported_population-validated_population)) stored,
  reported_households integer not null default 0, validated_households integer not null default 0, affected_households jsonb not null default '{}', vulnerable_groups jsonb not null default '{}',
  damage_summary text, facility_condition text, service_disruption text, accessibility_constraints text, urgent_unmet_needs text,
  validation_status public.verification_state not null default 'UNVERIFIED', review_state text not null default 'OPEN', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.generated_outputs (
  id uuid primary key default gen_random_uuid(), output_type text not null, reference_id uuid, content jsonb not null, language text not null default 'en',
  generated_at timestamptz not null default now(), generated_by uuid references auth.users, source_snapshot jsonb not null
);
create table public.data_sources (
  id uuid primary key default gen_random_uuid(), source_agency text not null, source_name text not null, link text, date date,
  license_or_permission text, limitations text[] not null default '{}', verification_status public.verification_state not null default 'UNVERIFIED'
);
create table public.sync_conflicts (
  id uuid primary key default gen_random_uuid(), client_id uuid not null, entity_type text not null, entity_id uuid, client_payload jsonb not null, server_payload jsonb not null,
  status text not null default 'ACTION_REQUIRED', resolution text, resolved_by uuid references auth.users, resolved_at timestamptz, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id bigint generated always as identity primary key, user_id uuid references auth.users, action text not null, entity_type text not null, entity_id uuid,
  old_value jsonb, new_value jsonb, reason text, timestamp timestamptz not null default now(), metadata jsonb not null default '{}'
);

create index barangays_geometry_gix on public.barangays using gist(geometry);
create index hazard_exposures_geometry_gix on public.hazard_exposures using gist(hazard_geometry);
create index advisories_active_idx on public.advisories(validity_end) where verification_status='VERIFIED';
create index damage_reports_barangay_idx on public.damage_reports(barangay_id,reported_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type,entity_id,timestamp desc);

create or replace function public.current_lgu_role() returns public.lgu_role language sql stable security definer set search_path=public as $$ select role from public.user_profiles where id=auth.uid() and active_status $$;
create or replace function public.is_lgu_member() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_profiles where id=auth.uid() and active_status) $$;
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger barangays_touch before update on public.barangays for each row execute function public.touch_updated_at();
create trigger advisories_touch before update on public.advisories for each row execute function public.touch_updated_at();
create trigger damage_reports_touch before update on public.damage_reports for each row execute function public.touch_updated_at();
create trigger reviews_touch before update on public.post_impact_reviews for each row execute function public.touch_updated_at();

alter table public.user_profiles enable row level security; alter table public.barangays enable row level security; alter table public.population_profiles enable row level security;
alter table public.hazards enable row level security; alter table public.population_exposure_estimates enable row level security; alter table public.critical_facilities enable row level security;
alter table public.hazard_exposures enable row level security; alter table public.preparedness_capacities enable row level security; alter table public.methodologies enable row level security;
alter table public.advisories enable row level security; alter table public.household_profiles enable row level security; alter table public.action_rules enable row level security;
alter table public.risk_assessments enable row level security; alter table public.damage_reports enable row level security; alter table public.needs_reports enable row level security;
alter table public.post_impact_reviews enable row level security; alter table public.generated_outputs enable row level security; alter table public.data_sources enable row level security;
alter table public.sync_conflicts enable row level security; alter table public.audit_logs enable row level security;

create policy "LGU reads operational data" on public.barangays for select to authenticated using(public.is_lgu_member());
create policy "LGU reads profiles" on public.population_profiles for select to authenticated using(public.is_lgu_member());
create policy "LGU reads hazards" on public.hazards for select to authenticated using(public.is_lgu_member());
create policy "LGU reads estimates" on public.population_exposure_estimates for select to authenticated using(public.is_lgu_member());
create policy "LGU reads facilities" on public.critical_facilities for select to authenticated using(public.is_lgu_member());
create policy "LGU reads exposure" on public.hazard_exposures for select to authenticated using(public.is_lgu_member());
create policy "LGU reads capacity" on public.preparedness_capacities for select to authenticated using(public.is_lgu_member());
create policy "LGU reads methods" on public.methodologies for select to authenticated using(public.is_lgu_member());
create policy "LGU reads advisories" on public.advisories for select to authenticated using(public.is_lgu_member());
create policy "LGU reads rules" on public.action_rules for select to authenticated using(public.is_lgu_member());
create policy "LGU reads assessments" on public.risk_assessments for select to authenticated using(public.is_lgu_member());
create policy "LGU reads reports" on public.damage_reports for select to authenticated using(public.is_lgu_member());
create policy "field creates unverified reports" on public.damage_reports for insert to authenticated with check(public.is_lgu_member() and verification_status='UNVERIFIED' and created_by=auth.uid());
create policy "LGU reads needs" on public.needs_reports for select to authenticated using(public.is_lgu_member());
create policy "LGU reads reviews" on public.post_impact_reviews for select to authenticated using(public.is_lgu_member());
create policy "LGU reads outputs" on public.generated_outputs for select to authenticated using(public.is_lgu_member());
create policy "LGU reads sources" on public.data_sources for select to authenticated using(public.is_lgu_member());
create policy "reviewers read conflicts" on public.sync_conflicts for select to authenticated using(public.current_lgu_role() in ('admin','lgu_reviewer'));
create policy "users read own profile" on public.user_profiles for select to authenticated using(id=auth.uid());
create policy "admins manage profiles" on public.user_profiles for all to authenticated using(public.current_lgu_role()='admin') with check(public.current_lgu_role()='admin');
create policy "reviewers write advisories" on public.advisories for all to authenticated using(public.current_lgu_role() in ('admin','lgu_reviewer','lgu_encoder')) with check(public.current_lgu_role() in ('admin','lgu_reviewer','lgu_encoder'));
create policy "reviewers write assessments" on public.risk_assessments for all to authenticated using(public.current_lgu_role() in ('admin','lgu_reviewer')) with check(public.current_lgu_role() in ('admin','lgu_reviewer'));
create policy "reviewers update reports" on public.damage_reports for update to authenticated using(public.current_lgu_role() in ('admin','lgu_reviewer')) with check(public.current_lgu_role() in ('admin','lgu_reviewer'));
create policy "audit read reviewers" on public.audit_logs for select to authenticated using(public.current_lgu_role() in ('admin','lgu_reviewer'));
-- household_profiles intentionally has no direct public policy; public lookup is server-mediated and returns minimal fields.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('advisory-evidence','advisory-evidence',false,10485760,array['application/pdf','image/jpeg','image/png','text/plain']),
 ('damage-evidence','damage-evidence',false,15728640,array['image/jpeg','image/png','application/pdf']),
 ('generated-outputs','generated-outputs',false,10485760,array['application/pdf','application/json'])
on conflict(id) do nothing;
create policy "LGU reads evidence" on storage.objects for select to authenticated using(bucket_id in ('advisory-evidence','damage-evidence','generated-outputs') and public.is_lgu_member());
create policy "LGU uploads evidence" on storage.objects for insert to authenticated with check(bucket_id in ('advisory-evidence','damage-evidence') and public.is_lgu_member());
commit;
