begin;

-- Public Household Action Cards need only three read-only datasets:
-- barangay names, current verified advisories, and approved HOUSEHOLD rules.
-- Household profiles remain private and are never exposed to anon.

grant usage on schema public to anon;
grant select on public.barangays to anon;
grant select on public.advisories to anon;
grant select on public.action_rules to anon;

drop policy if exists "public reads active household action rules" on public.action_rules;
create policy "public reads active household action rules"
on public.action_rules
for select
to anon
using (
  active_status = true
  and target_audience = 'HOUSEHOLD'
);

-- Keep barangay/advisory public reads compatible with the imported baseline.
-- These policies are read-only. The application still filters advisories to
-- VERIFIED + currently valid + affected barangay before generating a card.
drop policy if exists "public reads barangays for preparedness" on public.barangays;
create policy "public reads barangays for preparedness"
on public.barangays
for select
to anon
using (true);

drop policy if exists "public reads verified advisories for preparedness" on public.advisories;
create policy "public reads verified advisories for preparedness"
on public.advisories
for select
to anon
using (verification_status = 'VERIFIED');

notify pgrst, 'reload schema';
commit;
