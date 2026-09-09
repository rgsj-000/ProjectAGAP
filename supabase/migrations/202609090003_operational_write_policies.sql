begin;

alter table public.audit_logs drop constraint audit_logs_action_check;
alter table public.audit_logs add constraint audit_logs_action_check check(length(trim(action))>0);

alter table public.generated_outputs drop constraint generated_outputs_output_type_check;
alter table public.generated_outputs add constraint generated_outputs_output_type_check
  check (output_type in ('brief','action-card','HOUSEHOLD_ACTION_CARD','LGU_ACTION_CARD','POST_IMPACT_ACTION_CARD'));

-- Keep legacy administrative policies usable with the current role spelling.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select coalesce(public.current_lgu_role()='admin',false)
$$;

-- Complete the write permissions used by authenticated API routes. Public
-- household generation continues to use the server-only service-role client.
grant usage on schema public to authenticated;
grant select, insert on public.generated_outputs to authenticated;
grant select, insert on public.population_exposure_estimates to authenticated;
grant select, insert on public.needs_reports to authenticated;
grant select, insert, update on public.sync_conflicts to authenticated;
grant select, insert on public.audit_logs to authenticated;
-- The imported baseline retains UUID audit IDs; no sequence grant is needed.

create policy "LGU creates own outputs" on public.generated_outputs
for insert to authenticated
with check (public.is_lgu_member() and generated_by = auth.uid());

create policy "reviewers create exposure estimates" on public.population_exposure_estimates
for insert to authenticated
with check (public.current_lgu_role() in ('admin', 'lgu_reviewer'));

create policy "LGU creates unverified needs" on public.needs_reports
for insert to authenticated
with check (
  public.is_lgu_member()
  and verification_status = 'UNVERIFIED'
  and validated_quantity is null
);

-- INSERT ... RETURNING in /api/sync needs a SELECT policy for the reporting
-- user, while other users' conflicts remain restricted to reviewers.
alter table public.sync_conflicts
  add column created_by uuid references auth.users(id) default auth.uid();

create policy "LGU creates own pending conflicts" on public.sync_conflicts
for insert to authenticated
with check (
  public.is_lgu_member() and created_by = auth.uid()
  and status = 'ACTION_REQUIRED'
  and resolution is null and resolved_by is null and resolved_at is null
);

create policy "LGU reads own conflicts" on public.sync_conflicts
for select to authenticated
using (public.is_lgu_member() and created_by = auth.uid());

create policy "reviewers resolve conflicts" on public.sync_conflicts
for update to authenticated
using (public.current_lgu_role() in ('admin', 'lgu_reviewer'))
with check (
  public.current_lgu_role() in ('admin', 'lgu_reviewer')
  and status = 'RESOLVED'
  and resolution in ('KEEP_SERVER', 'ACCEPT_CLIENT', 'MERGED')
  and resolved_by = auth.uid() and resolved_at is not null
);

-- Audit entries may be appended only under the caller's identity. No update
-- or delete policy is added, so authenticated clients cannot rewrite history.
create policy "LGU appends own audit events" on public.audit_logs
for insert to authenticated
with check (public.is_lgu_member() and user_id = auth.uid());

notify pgrst, 'reload schema';
commit;
