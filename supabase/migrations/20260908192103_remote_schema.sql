SET local check_function_bodies = off;

REVOKE ALL ON TABLE "public"."audit_logs" FROM "anon";

REVOKE ALL ON TABLE "public"."damage_reports" FROM "anon";

REVOKE ALL ON TABLE "public"."generated_outputs" FROM "anon";

REVOKE ALL ON TABLE "public"."household_profiles" FROM "anon";

REVOKE ALL ON TABLE "public"."needs_reports" FROM "anon";

REVOKE ALL ON TABLE "public"."preparedness_gaps" FROM "anon";

REVOKE ALL ON TABLE "public"."user_profiles" FROM "anon";

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

