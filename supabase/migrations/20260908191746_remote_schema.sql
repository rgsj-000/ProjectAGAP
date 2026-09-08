SET local check_function_bodies = off;

CREATE EXTENSION "postgis" SCHEMA "public";

CREATE TABLE "public"."advisories" (
  "id"                    uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "advisory_code"         text,
  "source_agency"         text                     NOT NULL,
  "advisory_type"         text                     NOT NULL,
  "warning_level"         integer,
  "issued_at"             timestamp with time zone NOT NULL,
  "affected_barangay_ids" text[]                   NOT NULL DEFAULT '{}'::text[],
  "raw_content"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "source_id"             uuid,
  "reference_date"        date,
  "verification_status"   text                     NOT NULL DEFAULT 'Verified'::text,
  "data_classification"   text                     NOT NULL DEFAULT 'OFFICIAL'::text,
  "created_by"            uuid,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "advisories_advisory_code_key" UNIQUE (advisory_code),
  CONSTRAINT "advisories_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "advisories_pkey" PRIMARY KEY (id),
  CONSTRAINT "advisories_raw_content_object_check" CHECK ((jsonb_typeof(raw_content) = 'object'::text)),
  CONSTRAINT "advisories_source_agency_not_blank" CHECK ((length(TRIM(BOTH FROM source_agency)) > 0)),
  CONSTRAINT "advisories_type_not_blank" CHECK ((length(TRIM(BOTH FROM advisory_type)) > 0)),
  CONSTRAINT "advisories_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text]))),
  CONSTRAINT "advisories_warning_level_check" CHECK (((warning_level IS NULL) OR ((warning_level >= 1) AND (warning_level <= 5))))
);

ALTER TABLE "public"."advisories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."audit_logs" (
  "id"          uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "user_id"     uuid,
  "action"      text                     NOT NULL,
  "entity_type" text,
  "entity_id"   uuid,
  "details"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "ip_address"  text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "audit_logs_action_check"
    CHECK
    ((action = ANY (ARRAY['ADVISORY_CREATED'::text, 'SCORING_TRIGGERED'::text, 'SCORE_COMPUTED'::text, 'BRIEF_GENERATED'::text, 'ACTION_CARD_GENERATED'::text,
    'DAMAGE_REPORTED'::text, 'NEEDS_REPORTED'::text, 'USER_LOGIN'::text, 'USER_LOGOUT'::text, 'DATA_EXPORTED'::text]))),
  CONSTRAINT "audit_logs_details_object_check" CHECK ((jsonb_typeof(details) = 'object'::text)),
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."audit_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."barangays" (
  "id"                  uuid                               NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "psgc_code"           text                               NOT NULL,
  "name"                text                               NOT NULL,
  "city"                text                               NOT NULL DEFAULT 'Lucena City'::text,
  "boundary"            public.geometry(MultiPolygon,4326),
  "metadata"            jsonb                              NOT NULL DEFAULT '{}'::jsonb,
  "source_id"           uuid,
  "reference_date"      date,
  "verification_status" text                               NOT NULL DEFAULT 'Verified'::text,
  "data_classification" text                               NOT NULL DEFAULT 'OFFICIAL'::text,
  "created_at"          timestamp with time zone           NOT NULL DEFAULT now(),
  CONSTRAINT "barangays_city_not_blank" CHECK ((length(TRIM(BOTH FROM city)) > 0)),
  CONSTRAINT "barangays_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "barangays_name_not_blank" CHECK ((length(TRIM(BOTH FROM name)) > 0)),
  CONSTRAINT "barangays_pkey" PRIMARY KEY (id),
  CONSTRAINT "barangays_psgc_code_format_check" CHECK ((psgc_code ~ '^[0-9]{10}$'::text)),
  CONSTRAINT "barangays_psgc_code_key" UNIQUE (psgc_code),
  CONSTRAINT "barangays_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."barangays"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."critical_facilities" (
  "id"                  uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "barangay_id"         uuid                     NOT NULL,
  "name"                text                     NOT NULL,
  "facility_type"       text                     NOT NULL,
  "latitude"            double precision,
  "longitude"           double precision,
  "operational_status"  text                     NOT NULL DEFAULT 'Unknown'::text,
  "source_id"           uuid,
  "reference_date"      date,
  "verification_status" text                     NOT NULL DEFAULT 'Verified'::text,
  "data_classification" text                     NOT NULL DEFAULT 'OFFICIAL'::text,
  "metadata"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "critical_facilities_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "critical_facilities_latitude_check" CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::double precision) AND (latitude <= (90)::double precision)))),
  CONSTRAINT "critical_facilities_longitude_check" CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::double precision) AND (longitude <= (180)::double precision)))),
  CONSTRAINT "critical_facilities_name_not_blank" CHECK ((length(TRIM(BOTH FROM name)) > 0)),
  CONSTRAINT "critical_facilities_operational_status_check"
    CHECK ((operational_status = ANY (ARRAY['Operational'::text, 'Partially Operational'::text, 'Non-Operational'::text, 'Unknown'::text, 'Needs Confirmation'::text]))),
  CONSTRAINT "critical_facilities_pkey" PRIMARY KEY (id),
  CONSTRAINT "critical_facilities_type_not_blank" CHECK ((length(TRIM(BOTH FROM facility_type)) > 0)),
  CONSTRAINT "critical_facilities_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."critical_facilities"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."damage_reports" (
  "id"                         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "report_code"                text,
  "barangay_id"                uuid                     NOT NULL,
  "damage_type"                text                     NOT NULL,
  "severity"                   integer,
  "affected_households"        integer,
  "evidence_urls"              text[]                   NOT NULL DEFAULT '{}'::text[],
  "damage_score_d"             integer,
  "affected_score_a"           integer,
  "service_disruption_score_s" integer,
  "urgent_needs_score_n"       integer,
  "source_id"                  uuid,
  "reference_date"             date,
  "verification_status"        text                     NOT NULL DEFAULT 'Unverified'::text,
  "data_classification"        text                     NOT NULL DEFAULT 'SYNTHETIC'::text,
  "reported_by"                uuid,
  "reported_at"                timestamp with time zone NOT NULL DEFAULT now(),
  "metadata"                   jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "damage_reports_a_check" CHECK (((affected_score_a IS NULL) OR ((affected_score_a >= 0) AND (affected_score_a <= 100)))),
  CONSTRAINT "damage_reports_affected_households_check" CHECK (((affected_households IS NULL) OR (affected_households >= 0))),
  CONSTRAINT "damage_reports_d_check" CHECK (((damage_score_d IS NULL) OR ((damage_score_d >= 0) AND (damage_score_d <= 100)))),
  CONSTRAINT "damage_reports_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "damage_reports_metadata_object_check" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "damage_reports_n_check" CHECK (((urgent_needs_score_n IS NULL) OR ((urgent_needs_score_n >= 0) AND (urgent_needs_score_n <= 100)))),
  CONSTRAINT "damage_reports_pkey" PRIMARY KEY (id),
  CONSTRAINT "damage_reports_report_code_key" UNIQUE (report_code),
  CONSTRAINT "damage_reports_s_check" CHECK (((service_disruption_score_s IS NULL) OR ((service_disruption_score_s >= 0) AND (service_disruption_score_s <= 100)))),
  CONSTRAINT "damage_reports_severity_check" CHECK (((severity IS NULL) OR ((severity >= 1) AND (severity <= 5)))),
  CONSTRAINT "damage_reports_type_not_blank" CHECK ((length(TRIM(BOTH FROM damage_type)) > 0)),
  CONSTRAINT "damage_reports_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."damage_reports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."data_sources" (
  "id"                  uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "source_code"         text                     NOT NULL,
  "name"                text                     NOT NULL,
  "agency"              text                     NOT NULL,
  "url"                 text,
  "license"             text,
  "accessed_at"         date,
  "limitations"         text,
  "verification_status" text                     NOT NULL DEFAULT 'Verified'::text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "data_sources_agency_not_blank" CHECK ((length(TRIM(BOTH FROM agency)) > 0)),
  CONSTRAINT "data_sources_name_not_blank" CHECK ((length(TRIM(BOTH FROM name)) > 0)),
  CONSTRAINT "data_sources_pkey" PRIMARY KEY (id),
  CONSTRAINT "data_sources_source_code_key" UNIQUE (source_code),
  CONSTRAINT "data_sources_source_code_not_blank" CHECK ((length(TRIM(BOTH FROM source_code)) > 0)),
  CONSTRAINT "data_sources_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."data_sources"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."generated_outputs" (
  "id"                  uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "barangay_id"         uuid                     NOT NULL,
  "advisory_id"         uuid,
  "household_id"        uuid,
  "output_type"         text                     NOT NULL,
  "content"             jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "language"            text                     NOT NULL DEFAULT 'en'::text,
  "priority_score_id"   uuid,
  "triggered_by"        uuid,
  "verification_status" text                     NOT NULL DEFAULT 'Unverified'::text,
  "generated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "generated_outputs_content_object_check" CHECK ((jsonb_typeof(content) = 'object'::text)),
  CONSTRAINT "generated_outputs_language_check" CHECK ((language = ANY (ARRAY['en'::text, 'fil'::text]))),
  CONSTRAINT "generated_outputs_output_type_check" CHECK ((output_type = ANY (ARRAY['brief'::text, 'action-card'::text]))),
  CONSTRAINT "generated_outputs_pkey" PRIMARY KEY (id),
  CONSTRAINT "generated_outputs_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."generated_outputs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."hazard_exposures" (
  "id"                  uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "barangay_id"         uuid                     NOT NULL,
  "hazard_type"         text                     NOT NULL,
  "exposure_level"      integer,
  "exposure_category"   text,
  "source_id"           uuid,
  "reference_date"      date,
  "verification_status" text                     NOT NULL DEFAULT 'Verified'::text,
  "data_classification" text                     NOT NULL DEFAULT 'OFFICIAL'::text,
  "metadata"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "hazard_exposures_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "hazard_exposures_level_check" CHECK (((exposure_level IS NULL) OR ((exposure_level >= 0) AND (exposure_level <= 100)))),
  CONSTRAINT "hazard_exposures_pkey" PRIMARY KEY (id),
  CONSTRAINT "hazard_exposures_type_not_blank" CHECK ((length(TRIM(BOTH FROM hazard_type)) > 0)),
  CONSTRAINT "hazard_exposures_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."hazard_exposures"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."household_profiles" (
  "id"                      uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "barangay_id"             uuid                     NOT NULL,
  "household_code"          text                     NOT NULL,
  "purok"                   text,
  "member_count"            integer,
  "special_needs"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "housing_characteristics" jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "source_id"               uuid,
  "reference_date"          date,
  "verification_status"     text                     NOT NULL DEFAULT 'Unverified'::text,
  "data_classification"     text                     NOT NULL DEFAULT 'SYNTHETIC'::text,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "household_profiles_code_not_blank" CHECK ((length(TRIM(BOTH FROM household_code)) > 0)),
  CONSTRAINT "household_profiles_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "household_profiles_household_code_key" UNIQUE (household_code),
  CONSTRAINT "household_profiles_member_count_check" CHECK (((member_count IS NULL) OR (member_count >= 0))),
  CONSTRAINT "household_profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "household_profiles_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."household_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."needs_reports" (
  "id"                  uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "barangay_id"         uuid                     NOT NULL,
  "needs"               jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "urgency_level"       integer,
  "source_id"           uuid,
  "reference_date"      date,
  "verification_status" text                     NOT NULL DEFAULT 'Unverified'::text,
  "data_classification" text                     NOT NULL DEFAULT 'SYNTHETIC'::text,
  "reported_by"         uuid,
  "reported_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "metadata"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "needs_reports_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "needs_reports_metadata_object_check" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "needs_reports_needs_object_check" CHECK ((jsonb_typeof(needs) = 'object'::text)),
  CONSTRAINT "needs_reports_pkey" PRIMARY KEY (id),
  CONSTRAINT "needs_reports_urgency_level_check" CHECK (((urgency_level IS NULL) OR ((urgency_level >= 1) AND (urgency_level <= 5)))),
  CONSTRAINT "needs_reports_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."needs_reports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."population_profiles" (
  "id"                   uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "barangay_id"          uuid                     NOT NULL,
  "population"           integer,
  "households"           integer,
  "children_under5"      integer,
  "older_persons_60plus" integer,
  "pwd_count"            integer,
  "source_id"            uuid,
  "reference_date"       date,
  "verification_status"  text                     NOT NULL DEFAULT 'Verified'::text,
  "data_classification"  text                     NOT NULL DEFAULT 'OFFICIAL'::text,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "population_profiles_children_check" CHECK (((children_under5 IS NULL) OR (children_under5 >= 0))),
  CONSTRAINT "population_profiles_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "population_profiles_households_check" CHECK (((households IS NULL) OR (households >= 0))),
  CONSTRAINT "population_profiles_older_persons_check" CHECK (((older_persons_60plus IS NULL) OR (older_persons_60plus >= 0))),
  CONSTRAINT "population_profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "population_profiles_population_check" CHECK (((population IS NULL) OR (population >= 0))),
  CONSTRAINT "population_profiles_pwd_check" CHECK (((pwd_count IS NULL) OR (pwd_count >= 0))),
  CONSTRAINT "population_profiles_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."population_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."preparedness_gaps" (
  "id"                     uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "barangay_id"            uuid                     NOT NULL,
  "evacuation_capacity"    integer,
  "responder_count"        integer,
  "equipment_score"        integer,
  "communication_score"    integer,
  "preparedness_gap_score" integer,
  "source_id"              uuid,
  "reference_date"         date,
  "verification_status"    text                     NOT NULL DEFAULT 'Needs Confirmation'::text,
  "data_classification"    text                     NOT NULL DEFAULT 'SYNTHETIC'::text,
  "metadata"               jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "preparedness_gaps_communication_score_check" CHECK (((communication_score IS NULL) OR ((communication_score >= 0) AND (communication_score <= 100)))),
  CONSTRAINT "preparedness_gaps_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "preparedness_gaps_equipment_score_check" CHECK (((equipment_score IS NULL) OR ((equipment_score >= 0) AND (equipment_score <= 100)))),
  CONSTRAINT "preparedness_gaps_evacuation_capacity_check" CHECK (((evacuation_capacity IS NULL) OR (evacuation_capacity >= 0))),
  CONSTRAINT "preparedness_gaps_gap_score_check" CHECK (((preparedness_gap_score IS NULL) OR ((preparedness_gap_score >= 0) AND (preparedness_gap_score <= 100)))),
  CONSTRAINT "preparedness_gaps_pkey" PRIMARY KEY (id),
  CONSTRAINT "preparedness_gaps_responder_count_check" CHECK (((responder_count IS NULL) OR (responder_count >= 0))),
  CONSTRAINT "preparedness_gaps_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."preparedness_gaps"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."priority_scores" (
  "id"                  uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "barangay_id"         uuid                     NOT NULL,
  "advisory_id"         uuid,
  "score_type"          text                     NOT NULL,
  "total_score"         double precision         NOT NULL,
  "rank"                integer,
  "priority_label"      text                     NOT NULL,
  "breakdown"           jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "formula_used"        text                     NOT NULL,
  "data_sources"        jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "verification_status" text                     NOT NULL DEFAULT 'Verified'::text,
  "data_classification" text                     NOT NULL DEFAULT 'MIXED_OFFICIAL_SYNTHETIC'::text,
  "computed_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "priority_scores_breakdown_array_check" CHECK ((jsonb_typeof(breakdown) = 'array'::text)),
  CONSTRAINT "priority_scores_data_classification_check" CHECK ((data_classification = ANY (ARRAY['OFFICIAL'::text, 'SYNTHETIC'::text, 'MIXED_OFFICIAL_SYNTHETIC'::text]))),
  CONSTRAINT "priority_scores_data_sources_array_check" CHECK ((jsonb_typeof(data_sources) = 'array'::text)),
  CONSTRAINT "priority_scores_pkey" PRIMARY KEY (id),
  CONSTRAINT "priority_scores_priority_label_check" CHECK ((priority_label = ANY (ARRAY['Low'::text, 'Moderate'::text, 'High'::text, 'Critical'::text]))),
  CONSTRAINT "priority_scores_rank_check" CHECK (((rank IS NULL) OR (rank >= 1))),
  CONSTRAINT "priority_scores_score_type_check" CHECK ((score_type = ANY (ARRAY['pre-disaster'::text, 'recovery'::text]))),
  CONSTRAINT "priority_scores_total_score_check" CHECK (((total_score >= (0)::double precision) AND (total_score <= (100)::double precision))),
  CONSTRAINT "priority_scores_verification_status_check"
    CHECK ((verification_status = ANY (ARRAY['Unverified'::text, 'Reviewed'::text, 'Validated'::text, 'Verified'::text, 'Mixed'::text, 'Needs Confirmation'::text])))
);

ALTER TABLE "public"."priority_scores"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."staging_pagasa_advisories" (
  "row_index"            text,
  "advisory_id"          text,
  "source_agency"        text,
  "product"              text,
  "issued_at"            text,
  "valid_until"          text,
  "headline_condition"   text,
  "quezon_relevance"     text,
  "source_url"           text,
  "recommended_agap_use" text,
  "verification_status"  text,
  "notes"                text
);

ALTER TABLE "public"."staging_pagasa_advisories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_profiles" (
  "id"             uuid                     NOT NULL,
  "role"           text                     NOT NULL DEFAULT 'LGU'::text,
  "barangay_id"    uuid,
  "organization"   text,
  "position_title" text,
  "is_active"      boolean                  NOT NULL DEFAULT true,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_profiles_organization_not_blank" CHECK (((organization IS NULL) OR (length(TRIM(BOTH FROM organization)) > 0))),
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_profiles_position_not_blank" CHECK (((position_title IS NULL) OR (length(TRIM(BOTH FROM position_title)) > 0))),
  CONSTRAINT "user_profiles_role_check" CHECK ((role = ANY (ARRAY['ADMIN'::text, 'LGU'::text])))
);

ALTER TABLE "public"."user_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$

    select role

    from public.user_profiles

    where id = auth.uid()
      and is_active = true

    limit 1;

$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$

    select coalesce(
        (
            select role = 'ADMIN'
            from public.user_profiles
            where id = auth.uid()
              and is_active = true
            limit 1
        ),
        false
    );

$function$;

CREATE OR REPLACE FUNCTION public.is_lgu_or_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$

    select coalesce(
        (
            select role in ('LGU', 'ADMIN')
            from public.user_profiles
            where id = auth.uid()
              and is_active = true
            limit 1
        ),
        false
    );

$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin

    new.updated_at = now();

    return new;

end;
$function$;

ALTER TABLE "public"."advisories"
  ADD CONSTRAINT "advisories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."audit_logs"
  ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."critical_facilities"
  ADD CONSTRAINT "critical_facilities_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."damage_reports"
  ADD CONSTRAINT "damage_reports_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."damage_reports"
  ADD CONSTRAINT "damage_reports_reported_by_fkey" FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."advisories"
  ADD CONSTRAINT "advisories_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."barangays"
  ADD CONSTRAINT "barangays_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."critical_facilities"
  ADD CONSTRAINT "critical_facilities_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."damage_reports"
  ADD CONSTRAINT "damage_reports_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."generated_outputs"
  ADD CONSTRAINT "generated_outputs_advisory_id_fkey" FOREIGN KEY (advisory_id) REFERENCES public.advisories(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "public"."generated_outputs"
  ADD CONSTRAINT "generated_outputs_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."generated_outputs"
  ADD CONSTRAINT "generated_outputs_triggered_by_fkey" FOREIGN KEY (triggered_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."hazard_exposures"
  ADD CONSTRAINT "hazard_exposures_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."hazard_exposures"
  ADD CONSTRAINT "hazard_exposures_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."household_profiles"
  ADD CONSTRAINT "household_profiles_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."generated_outputs"
  ADD CONSTRAINT "generated_outputs_household_id_fkey" FOREIGN KEY (household_id) REFERENCES public.household_profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "public"."household_profiles"
  ADD CONSTRAINT "household_profiles_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."needs_reports"
  ADD CONSTRAINT "needs_reports_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."needs_reports"
  ADD CONSTRAINT "needs_reports_reported_by_fkey" FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."needs_reports"
  ADD CONSTRAINT "needs_reports_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."population_profiles"
  ADD CONSTRAINT "population_profiles_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."population_profiles"
  ADD CONSTRAINT "population_profiles_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."preparedness_gaps"
  ADD CONSTRAINT "preparedness_gaps_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."preparedness_gaps"
  ADD CONSTRAINT "preparedness_gaps_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."priority_scores"
  ADD CONSTRAINT "priority_scores_advisory_id_fkey" FOREIGN KEY (advisory_id) REFERENCES public.advisories(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "public"."priority_scores"
  ADD CONSTRAINT "priority_scores_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."generated_outputs"
  ADD CONSTRAINT "generated_outputs_priority_score_id_fkey" FOREIGN KEY (priority_score_id) REFERENCES public.priority_scores(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "public"."user_profiles"
  ADD CONSTRAINT "user_profiles_barangay_id_fkey" FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "public"."user_profiles"
  ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_advisories_issued_at ON public.advisories USING btree (issued_at DESC);

CREATE INDEX idx_advisories_source_agency ON public.advisories USING btree (source_agency);

CREATE INDEX idx_advisories_source_id ON public.advisories USING btree (source_id);

CREATE INDEX idx_audit_logs_action_created ON public.audit_logs USING btree (action, created_at DESC);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_barangays_boundary_gist ON public.barangays USING gist (boundary);

CREATE INDEX idx_barangays_name ON public.barangays USING btree (name);

CREATE INDEX idx_barangays_source_id ON public.barangays USING btree (source_id);

CREATE INDEX idx_critical_facilities_barangay_id ON public.critical_facilities USING btree (barangay_id);

CREATE INDEX idx_critical_facilities_source_id ON public.critical_facilities USING btree (source_id);

CREATE INDEX idx_critical_facilities_type ON public.critical_facilities USING btree (facility_type);

CREATE INDEX idx_damage_reports_barangay_id ON public.damage_reports USING btree (barangay_id);

CREATE INDEX idx_damage_reports_reported_at ON public.damage_reports USING btree (reported_at DESC);

CREATE INDEX idx_damage_reports_source_id ON public.damage_reports USING btree (source_id);

CREATE INDEX idx_damage_reports_verification_status ON public.damage_reports USING btree (verification_status);

CREATE INDEX idx_generated_outputs_advisory_id ON public.generated_outputs USING btree (advisory_id);

CREATE INDEX idx_generated_outputs_barangay_id ON public.generated_outputs USING btree (barangay_id);

CREATE INDEX idx_generated_outputs_household_id ON public.generated_outputs USING btree (household_id);

CREATE INDEX idx_generated_outputs_priority_score_id ON public.generated_outputs USING btree (priority_score_id);

CREATE INDEX idx_generated_outputs_type_generated ON public.generated_outputs USING btree (output_type, generated_at DESC);

CREATE INDEX idx_hazard_exposures_barangay_id ON public.hazard_exposures USING btree (barangay_id);

CREATE INDEX idx_hazard_exposures_hazard_type ON public.hazard_exposures USING btree (hazard_type);

CREATE INDEX idx_hazard_exposures_source_id ON public.hazard_exposures USING btree (source_id);

CREATE INDEX idx_household_profiles_barangay_id ON public.household_profiles USING btree (barangay_id);

CREATE INDEX idx_household_profiles_source_id ON public.household_profiles USING btree (source_id);

CREATE INDEX idx_needs_reports_barangay_id ON public.needs_reports USING btree (barangay_id);

CREATE INDEX idx_needs_reports_reported_at ON public.needs_reports USING btree (reported_at DESC);

CREATE INDEX idx_needs_reports_source_id ON public.needs_reports USING btree (source_id);

CREATE INDEX idx_needs_reports_verification_status ON public.needs_reports USING btree (verification_status);

CREATE INDEX idx_population_profiles_barangay_id ON public.population_profiles USING btree (barangay_id);

CREATE INDEX idx_population_profiles_source_id ON public.population_profiles USING btree (source_id);

CREATE INDEX idx_preparedness_gaps_barangay_id ON public.preparedness_gaps USING btree (barangay_id);

CREATE INDEX idx_preparedness_gaps_source_id ON public.preparedness_gaps USING btree (source_id);

CREATE INDEX idx_priority_scores_advisory_id ON public.priority_scores USING btree (advisory_id);

CREATE INDEX idx_priority_scores_barangay_id ON public.priority_scores USING btree (barangay_id);

CREATE INDEX idx_priority_scores_barangay_type ON public.priority_scores USING btree (barangay_id, score_type);

CREATE INDEX idx_priority_scores_score_computed ON public.priority_scores USING btree (score_type, computed_at DESC);

CREATE INDEX idx_user_profiles_active ON public.user_profiles USING btree (is_active);

CREATE INDEX idx_user_profiles_barangay_id ON public.user_profiles USING btree (barangay_id);

CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (ROLE);

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "advisories_admin_delete" ON "public"."advisories"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "advisories_lgu_insert" ON "public"."advisories"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.is_lgu_or_admin() AND (created_by = auth.uid())));

CREATE POLICY "advisories_lgu_update" ON "public"."advisories"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_lgu_or_admin())
  WITH CHECK (public.is_lgu_or_admin());

CREATE POLICY "advisories_public_select" ON "public"."advisories"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "audit_logs_admin_select" ON "public"."audit_logs"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "barangays_admin_insert" ON "public"."barangays"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "barangays_admin_update" ON "public"."barangays"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "barangays_public_select" ON "public"."barangays"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "critical_facilities_admin_insert" ON "public"."critical_facilities"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "critical_facilities_admin_update" ON "public"."critical_facilities"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "critical_facilities_public_select" ON "public"."critical_facilities"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "damage_reports_admin_delete" ON "public"."damage_reports"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "damage_reports_lgu_insert" ON "public"."damage_reports"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.is_lgu_or_admin() AND (reported_by = auth.uid())));

CREATE POLICY "damage_reports_lgu_select" ON "public"."damage_reports"
  FOR SELECT
  TO "authenticated"
  USING (public.is_lgu_or_admin());

CREATE POLICY "damage_reports_reporter_update" ON "public"."damage_reports"
  FOR UPDATE
  TO "authenticated"
  USING ((public.is_admin() OR (public.is_lgu_or_admin() AND (reported_by = auth.uid()))))
  WITH CHECK ((public.is_admin() OR (public.is_lgu_or_admin() AND (reported_by = auth.uid()))));

CREATE POLICY "data_sources_admin_insert" ON "public"."data_sources"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "data_sources_admin_update" ON "public"."data_sources"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "data_sources_public_select" ON "public"."data_sources"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "generated_outputs_admin_delete" ON "public"."generated_outputs"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "generated_outputs_lgu_select" ON "public"."generated_outputs"
  FOR SELECT
  TO "authenticated"
  USING (public.is_lgu_or_admin());

CREATE POLICY "hazard_exposures_admin_insert" ON "public"."hazard_exposures"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "hazard_exposures_admin_update" ON "public"."hazard_exposures"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "hazard_exposures_public_select" ON "public"."hazard_exposures"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "household_profiles_admin_delete" ON "public"."household_profiles"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "household_profiles_lgu_insert" ON "public"."household_profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_lgu_or_admin());

CREATE POLICY "household_profiles_lgu_select" ON "public"."household_profiles"
  FOR SELECT
  TO "authenticated"
  USING (public.is_lgu_or_admin());

CREATE POLICY "household_profiles_lgu_update" ON "public"."household_profiles"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_lgu_or_admin())
  WITH CHECK (public.is_lgu_or_admin());

CREATE POLICY "needs_reports_admin_delete" ON "public"."needs_reports"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "needs_reports_lgu_insert" ON "public"."needs_reports"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.is_lgu_or_admin() AND (reported_by = auth.uid())));

CREATE POLICY "needs_reports_lgu_select" ON "public"."needs_reports"
  FOR SELECT
  TO "authenticated"
  USING (public.is_lgu_or_admin());

CREATE POLICY "needs_reports_reporter_update" ON "public"."needs_reports"
  FOR UPDATE
  TO "authenticated"
  USING ((public.is_admin() OR (public.is_lgu_or_admin() AND (reported_by = auth.uid()))))
  WITH CHECK ((public.is_admin() OR (public.is_lgu_or_admin() AND (reported_by = auth.uid()))));

CREATE POLICY "population_profiles_admin_insert" ON "public"."population_profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "population_profiles_admin_update" ON "public"."population_profiles"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "population_profiles_public_select" ON "public"."population_profiles"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "preparedness_gaps_admin_insert" ON "public"."preparedness_gaps"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "preparedness_gaps_admin_update" ON "public"."preparedness_gaps"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "preparedness_gaps_lgu_select" ON "public"."preparedness_gaps"
  FOR SELECT
  TO "authenticated"
  USING (public.is_lgu_or_admin());

CREATE POLICY "priority_scores_admin_delete" ON "public"."priority_scores"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "priority_scores_public_select" ON "public"."priority_scores"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "user_profiles_admin_delete" ON "public"."user_profiles"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "user_profiles_admin_insert" ON "public"."user_profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "user_profiles_admin_update" ON "public"."user_profiles"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_profiles_self_or_admin_select" ON "public"."user_profiles"
  FOR SELECT
  TO "authenticated"
  USING (((id = auth.uid()) OR public.is_admin()));

CREATE POLICY "AGAP evidence LGU upload" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'evidence-photos'::text) AND public.is_lgu_or_admin() AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "AGAP evidence authenticated read" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'evidence-photos'::text) AND public.is_lgu_or_admin()));

CREATE POLICY "AGAP evidence owner admin delete" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'evidence-photos'::text) AND public.is_lgu_or_admin() AND ((owner_id = (auth.uid())::text) OR public.is_admin())));

COMMENT ON EXTENSION "postgis" IS 'PostGIS geometry and geography spatial types and functions';

REVOKE ALL ON FUNCTION "public"."current_user_role"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."current_user_role"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_lgu_or_admin"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."is_lgu_or_admin"() TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON TABLE "public"."advisories" FROM "anon";

GRANT SELECT ON TABLE "public"."advisories" TO "anon";

REVOKE ALL ON TABLE "public"."advisories" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."advisories" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."advisories" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."audit_logs" FROM "authenticated";

GRANT SELECT ON TABLE "public"."audit_logs" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_logs" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."barangays" FROM "anon";

GRANT SELECT ON TABLE "public"."barangays" TO "anon";

REVOKE ALL ON TABLE "public"."barangays" FROM "authenticated";

GRANT INSERT, SELECT, UPDATE ON TABLE "public"."barangays" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."barangays" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."critical_facilities" FROM "anon";

GRANT SELECT ON TABLE "public"."critical_facilities" TO "anon";

REVOKE ALL ON TABLE "public"."critical_facilities" FROM "authenticated";

GRANT INSERT, SELECT, UPDATE ON TABLE "public"."critical_facilities" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."critical_facilities" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."damage_reports" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."damage_reports" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."damage_reports" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."data_sources" FROM "anon";

GRANT SELECT ON TABLE "public"."data_sources" TO "anon";

REVOKE ALL ON TABLE "public"."data_sources" FROM "authenticated";

GRANT INSERT, SELECT, UPDATE ON TABLE "public"."data_sources" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."data_sources" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."generated_outputs" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."generated_outputs" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."generated_outputs" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."hazard_exposures" FROM "anon";

GRANT SELECT ON TABLE "public"."hazard_exposures" TO "anon";

REVOKE ALL ON TABLE "public"."hazard_exposures" FROM "authenticated";

GRANT INSERT, SELECT, UPDATE ON TABLE "public"."hazard_exposures" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."hazard_exposures" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."household_profiles" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."household_profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."household_profiles" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."needs_reports" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."needs_reports" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."needs_reports" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."population_profiles" FROM "anon";

GRANT SELECT ON TABLE "public"."population_profiles" TO "anon";

REVOKE ALL ON TABLE "public"."population_profiles" FROM "authenticated";

GRANT INSERT, SELECT, UPDATE ON TABLE "public"."population_profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."population_profiles" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."preparedness_gaps" FROM "authenticated";

GRANT INSERT, SELECT, UPDATE ON TABLE "public"."preparedness_gaps" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."preparedness_gaps" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."priority_scores" FROM "anon";

GRANT SELECT ON TABLE "public"."priority_scores" TO "anon";

REVOKE ALL ON TABLE "public"."priority_scores" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."priority_scores" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."priority_scores" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."staging_pagasa_advisories" TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON TABLE "public"."user_profiles" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."user_profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_profiles" TO "postgres", "service_role";

