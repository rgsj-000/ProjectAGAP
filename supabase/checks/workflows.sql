-- Transactional fixtures only; run using build-workflow-check.cjs.
insert into auth.users(id) values ('a6ab0000-0000-4000-8000-000000000001'),('a6ab0000-0000-4000-8000-000000000002');
insert into public.user_profiles(id,role) values ('a6ab0000-0000-4000-8000-000000000001','field_reporter'),('a6ab0000-0000-4000-8000-000000000002','lgu_reviewer');
insert into public.advisories(id,source_agency,advisory_type,bulletin_reference,warning_information,issue_time,validity_start,validity_end,affected_areas,source_link,is_demo)
select 'a6ab0000-0000-4000-8000-000000000003','SYNTHETIC TEST','Rollback test','AGAP-WORKFLOW-ROLLBACK','Synthetic transaction only',now(),now(),now()+interval '1 hour',array[barangay_name],'https://example.invalid',true from public.barangays limit 1;
select set_config('request.jwt.claim.sub','a6ab0000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ declare p jsonb; r jsonb; d uuid; begin
 select jsonb_build_object('clientId','a6ab0000-0000-4000-8000-000000000004','barangayId',id,'advisoryId','a6ab0000-0000-4000-8000-000000000003','reportedAffectedPersons',10,'reportedAffectedHouseholds',4,'vulnerableGroups','{}'::jsonb,'damageType','Flood','damageSummary','Synthetic test flood','severity','MINOR','serviceDisruption','Water limited','needs','["water"]'::jsonb,'evidence','[]'::jsonb,'source','Rollback test','deviceTimestamp','2026-09-09T00:00:00Z','baseVersion',0,'isDemo',true) into p from public.barangays where barangay_name=any((select affected_areas from public.advisories where id='a6ab0000-0000-4000-8000-000000000003')::text[]) limit 1;
 r:=public.submit_field_report(p); d:=(r->>'id')::uuid;
 if r->>'status'<>'SYNCED' then raise exception 'Initial sync failed'; end if;
 r:=public.submit_field_report(p);
 if r->>'deduplicated'<>'true' then raise exception 'Retry was not idempotent'; end if;
 if (select count(*) from public.needs_reports where damage_report_id=d)<>1 then raise exception 'Duplicate linked needs'; end if;
 r:=public.submit_field_report(p||'{"reportedAffectedPersons":11}'::jsonb);
 if r->>'status'<>'ACTION_REQUIRED' then raise exception 'Changed count silently accepted'; end if;
 if (select reported_affected_persons from public.damage_reports where id=d)<>10 then raise exception 'Server report overwritten'; end if;
 begin
  perform public.verify_field_report(d,'Not an authorized reviewer');
  raise exception 'Reporter was allowed to verify';
 exception when raise_exception then
  if sqlerrm='Reporter was allowed to verify' then raise; end if;
 end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','a6ab0000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ declare d uuid; o uuid; b uuid; begin
 select id,barangay_id into d,b from public.damage_reports where client_id='a6ab0000-0000-4000-8000-000000000004';
 perform public.verify_field_report(d,'Source and linked water need verified in rollback test');
 if not exists(select 1 from public.damage_reports where id=d and verification_status='VERIFIED' and verified_by=auth.uid()) then raise exception 'Report validation failed'; end if;
 if not exists(select 1 from public.needs_reports where damage_report_id=d and verification_status='VERIFIED') then raise exception 'Linked needs validation failed'; end if;
 o:=public.save_operational_output(b,'{"outputType":"LGU_ACTION_CARD","recommendedActions":[{"actionRuleId":"TEST","action":"Validate report","responsibleUnit":"Test unit","requiresLguConfirmation":true}]}'::jsonb,'{"test":true}'::jsonb);
 if (select count(*) from public.operational_actions where generated_output_id=o)<>1 then raise exception 'Action was not persisted'; end if;
 if not exists(select 1 from public.audit_logs where entity_id=o and action='GENERATED_OUTPUT') then raise exception 'Output audit missing'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
 begin
  perform public.submit_field_report('{}'::jsonb);
  raise exception 'Public submission allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'workflow rollback checks passed' as result;
