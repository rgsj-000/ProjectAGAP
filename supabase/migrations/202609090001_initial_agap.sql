-- Reconciles the imported September 8 baseline; this migration was never
-- applied remotely before reconciliation. See reference/original_initial_agap.sql.
begin;
create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.lgu_role as enum ('admin','lgu_reviewer','lgu_encoder','field_reporter');
create type public.verification_state as enum ('UNVERIFIED','FOR_REVIEW','VERIFIED','REJECTED');
create type public.sync_state as enum ('ONLINE','OFFLINE','SYNCING','STALE','ACTION_REQUIRED','PENDING_SYNC','SYNCED');

-- Compatibility additions for the imported September 8 schema.
-- Preserve legacy columns and records; do not manufacture operational inputs.
alter table public.user_profiles add column assigned_barangay_id uuid,
  add column active_status boolean not null default true;
update public.user_profiles set assigned_barangay_id=barangay_id, active_status=is_active;
alter table public.user_profiles drop constraint user_profiles_role_check;
alter table public.user_profiles add constraint user_profiles_role_check
  check(role in ('ADMIN','LGU','admin','lgu_reviewer','lgu_encoder','field_reporter'));
alter table public.user_profiles alter column role set default 'field_reporter';

alter table public.barangays add column barangay_name text, add column population integer,
  add column geometry geometry(MultiPolygon,4326), add column source text,
  add column reference_year integer, add column is_demo boolean not null default false,
  add column updated_at timestamptz not null default now();
update public.barangays set barangay_name=name, geometry=boundary,
  is_demo=(data_classification='SYNTHETIC');
create unique index barangays_barangay_name_key on public.barangays(barangay_name);

alter table public.population_profiles add column average_household_size numeric(6,2),
  add column children integer, add column older_persons integer, add column persons_with_disabilities integer,
  add column other_vulnerability_indicators jsonb not null default '{}', add column source text,
  add column reference_year integer, add column is_demo boolean not null default false;
-- Under-five counts are not equivalent to all children, so retain the legacy
-- age-specific field rather than inventing an all-children count.
update public.population_profiles set older_persons=older_persons_60plus,
  persons_with_disabilities=pwd_count, reference_year=extract(year from reference_date),
  is_demo=(data_classification='SYNTHETIC');

alter table public.critical_facilities add column type text, add column capacity integer,
  add column last_validation_date date, add column source text,
  add column is_demo boolean not null default false;
update public.critical_facilities set type=facility_type, is_demo=(data_classification='SYNTHETIC');

alter table public.hazard_exposures add column hazard_geometry geometry(MultiPolygon,4326),
  add column source text, add column limitations text[] not null default '{}',
  add column is_demo boolean not null default false;
update public.hazard_exposures set is_demo=(data_classification='SYNTHETIC');

alter table public.advisories add column bulletin_reference text, add column warning_information text,
  add column issue_time timestamptz, add column validity_start timestamptz,
  add column validity_end timestamptz, add column affected_areas text[] not null default '{}',
  add column source_link text, add column verified_by uuid references auth.users(id),
  add column verified_at timestamptz, add column updated_at timestamptz not null default now(),
  add column is_demo boolean not null default false;
update public.advisories set bulletin_reference=advisory_code,issue_time=issued_at,
  validity_start=issued_at,is_demo=(data_classification='SYNTHETIC');
-- Existing bulletins without a documented validity end remain unavailable to
-- active-card generation until reviewed. Never extend expired warnings.
alter table public.advisories alter column issued_at set default now();
alter table public.advisories drop constraint advisories_verification_status_check;
alter table public.advisories add constraint advisories_verification_status_check check
 (verification_status in ('Unverified','Reviewed','Validated','Verified','Mixed','Needs Confirmation',
 'UNVERIFIED','FOR_REVIEW','VERIFIED','REJECTED'));
alter table public.advisories alter column verification_status set default 'UNVERIFIED';
create unique index advisories_bulletin_reference_key on public.advisories(source_agency,bulletin_reference);

alter table public.household_profiles add column optional_purok text, add column household_members integer,
  add column has_children boolean, add column has_older_person boolean,
  add column has_pwd_or_mobility_limitation boolean, add column needs_essential_medicine boolean,
  add column has_pets boolean, add column communication_methods text[] not null default '{}',
  add column is_demo boolean not null default false;
update public.household_profiles set optional_purok=purok,household_members=member_count,
  is_demo=(data_classification='SYNTHETIC');

alter table public.damage_reports add column client_id uuid default gen_random_uuid(),
  add column purok text, add column reported_affected_persons integer,
  add column reported_affected_households integer, add column vulnerable_groups jsonb not null default '{}',
  add column critical_facility_condition text, add column access_condition text,
  add column evidence jsonb not null default '[]', add column source text,
  add column device_timestamp timestamptz, add column verified_by uuid references auth.users(id),
  add column verified_at timestamptz, add column sync_status public.sync_state not null default 'PENDING_SYNC',
  add column version integer not null default 1, add column created_by uuid references auth.users(id),
  add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now(),
  add column is_demo boolean not null default false;
create unique index damage_reports_client_id_key on public.damage_reports(client_id);
-- Preserve the old numeric rating separately; its categories are not the same
-- as the current field-report severity vocabulary.
alter table public.damage_reports rename column severity to legacy_severity;
alter table public.damage_reports add column severity text;
update public.damage_reports set reported_affected_households=affected_households,
  device_timestamp=reported_at,created_by=reported_by,is_demo=(data_classification='SYNTHETIC');
alter table public.damage_reports drop constraint damage_reports_verification_status_check;
alter table public.damage_reports add constraint damage_reports_verification_status_check check
 (verification_status in ('Unverified','Reviewed','Validated','Verified','Mixed','Needs Confirmation',
 'UNVERIFIED','FOR_REVIEW','VERIFIED','REJECTED'));
alter table public.damage_reports alter column verification_status set default 'UNVERIFIED';

alter table public.needs_reports add column damage_report_id uuid references public.damage_reports(id),
  add column food_need boolean, add column water_need boolean, add column shelter_need boolean,
  add column medicine_need boolean, add column rescue_need boolean, add column restoration_need boolean,
  add column service_need text, add column urgency text, add column validated_quantity numeric,
  add column source text, add column created_at timestamptz not null default now(),
  add column is_demo boolean not null default false;
update public.needs_reports set is_demo=(data_classification='SYNTHETIC');
alter table public.needs_reports drop constraint needs_reports_verification_status_check;
alter table public.needs_reports add constraint needs_reports_verification_status_check check
 (verification_status in ('Unverified','Reviewed','Validated','Verified','Mixed','Needs Confirmation',
 'UNVERIFIED','FOR_REVIEW','VERIFIED','REJECTED'));
alter table public.needs_reports alter column verification_status set default 'UNVERIFIED';

alter table public.generated_outputs alter column barangay_id drop not null;
alter table public.generated_outputs add column reference_id uuid,
  add column generated_by uuid references auth.users(id), add column source_snapshot jsonb not null default '{}';
update public.generated_outputs set reference_id=barangay_id,generated_by=triggered_by;

alter table public.data_sources add column source_agency text, add column source_name text,
  add column link text, add column date date, add column license_or_permission text;
update public.data_sources set source_agency=agency,source_name=name,link=url,date=accessed_at,license_or_permission=license;

alter table public.audit_logs add column old_value jsonb, add column new_value jsonb,
  add column reason text, add column timestamp timestamptz, add column metadata jsonb not null default '{}';
update public.audit_logs set timestamp=created_at,metadata=details;
alter table public.audit_logs alter column timestamp set default now();


alter table public.user_profiles add constraint user_profiles_barangay_fk foreign key (assigned_barangay_id) references public.barangays(id);
create table public.hazards (id uuid primary key default gen_random_uuid(), name text not null, hazard_type text not null, source text not null, is_demo boolean not null default false);
create table public.population_exposure_estimates (
  id uuid primary key default gen_random_uuid(), barangay_id uuid not null references public.barangays, hazard_id uuid not null references public.hazards,
  estimated_exposed_population integer not null check(estimated_exposed_population>=0), estimated_households integer not null check(estimated_households>=0), vulnerable_group_estimates jsonb not null default '{}',
  estimation_method text not null, confidence_level text not null check(confidence_level in ('LOW','MEDIUM','HIGH')), source text not null, reference_date date not null, generated_at timestamptz not null default now(), limitations text[] not null default '{}', is_demo boolean not null default false
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
create table public.post_impact_reviews (
  id uuid primary key default gen_random_uuid(), advisory_id uuid references public.advisories, event_reference text not null, barangay_id uuid not null references public.barangays,
  reported_population integer not null default 0, validated_population integer not null default 0, population_awaiting_validation integer generated always as (greatest(0,reported_population-validated_population)) stored,
  reported_households integer not null default 0, validated_households integer not null default 0, affected_households jsonb not null default '{}', vulnerable_groups jsonb not null default '{}',
  damage_summary text, facility_condition text, service_disruption text, accessibility_constraints text, urgent_unmet_needs text,
  validation_status public.verification_state not null default 'UNVERIFIED', review_state text not null default 'OPEN', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.sync_conflicts (
  id uuid primary key default gen_random_uuid(), client_id uuid not null, entity_type text not null, entity_id uuid, client_payload jsonb not null, server_payload jsonb not null,
  status text not null default 'ACTION_REQUIRED', resolution text, resolved_by uuid references auth.users, resolved_at timestamptz, created_at timestamptz not null default now()
);

create index barangays_geometry_gix on public.barangays using gist(geometry);
create index hazard_exposures_geometry_gix on public.hazard_exposures using gist(hazard_geometry);
create index advisories_active_idx on public.advisories(validity_end) where verification_status='VERIFIED';
create index damage_reports_barangay_idx on public.damage_reports(barangay_id,reported_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type,entity_id,timestamp desc);

create or replace function public.current_lgu_role() returns public.lgu_role language sql stable security definer set search_path=public as $$ select case role when 'ADMIN' then 'admin'::public.lgu_role when 'LGU' then 'lgu_encoder'::public.lgu_role else role::public.lgu_role end from public.user_profiles where id=auth.uid() and active_status and is_active $$;
create or replace function public.is_lgu_member() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_profiles where id=auth.uid() and active_status and is_active) $$;
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
