begin;

-- Repair migration for the public Household Action Card.
-- The live public preparedness endpoint can read barangays/advisories but
-- currently sees zero HOUSEHOLD action rules. Re-apply the required anon
-- privileges and RLS policy under a new migration version so Supabase cannot
-- skip the fix because of stale migration history.

grant usage on schema public to anon;
grant select on public.barangays to anon;
grant select on public.advisories to anon;
grant select on public.action_rules to anon;

drop policy if exists "public reads active household action rules"
  on public.action_rules;

create policy "public reads active household action rules"
on public.action_rules
for select
to anon
using (
  active_status = true
  and target_audience = 'HOUSEHOLD'
);

drop policy if exists "public reads barangays for preparedness"
  on public.barangays;

create policy "public reads barangays for preparedness"
on public.barangays
for select
to anon
using (true);

drop policy if exists "public reads verified advisories for preparedness"
  on public.advisories;

create policy "public reads verified advisories for preparedness"
on public.advisories
for select
to anon
using (verification_status = 'VERIFIED');

notify pgrst, 'reload schema';

commit;
