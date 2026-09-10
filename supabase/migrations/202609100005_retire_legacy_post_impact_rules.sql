begin;

update public.action_rules
set active_status = false
where target_audience = 'LGU'
  and disaster_phase in ('POST_IMMEDIATE','POST_STABILIZATION','POST_MITIGATION')
  and version = 'demo-1.0'
  and rule_id in ('DEMO-POST-001','DEMO-POST-002','DEMO-POST-003');

commit;
