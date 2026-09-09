begin;
create table public.operational_actions (
  id uuid primary key default gen_random_uuid(), generated_output_id uuid references public.generated_outputs on delete cascade,
  action_rule_id text not null, barangay_id uuid references public.barangays, action_text text not null,
  responsible_unit text not null, assigned_to uuid references auth.users, status text not null default 'RECOMMENDED'
    check(status in ('RECOMMENDED','FOR_VALIDATION','ASSIGNED','IN_PROGRESS','RESOLVED','DEFERRED','OVERRIDDEN')),
  requires_lgu_confirmation boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger operational_actions_touch before update on public.operational_actions for each row execute function public.touch_updated_at();
alter table public.operational_actions enable row level security;
create policy "LGU reads actions" on public.operational_actions for select to authenticated using(public.is_lgu_member());
create policy "reviewers manage actions" on public.operational_actions for all to authenticated using(public.current_lgu_role() in ('admin','lgu_reviewer')) with check(public.current_lgu_role() in ('admin','lgu_reviewer'));
commit;
