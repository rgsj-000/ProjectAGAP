-- Run within a transaction and roll back: these fixtures must never persist.
insert into auth.users(id) values ('a5ab0000-0000-4000-8000-000000000001'),('a5ab0000-0000-4000-8000-000000000002');
insert into public.user_profiles(id,role) values
 ('a5ab0000-0000-4000-8000-000000000001','field_reporter'),
 ('a5ab0000-0000-4000-8000-000000000002','lgu_reviewer');
select set_config('request.jwt.claim.sub','a5ab0000-0000-4000-8000-000000000001',true);
set local role authenticated;
insert into public.damage_reports(client_id,barangay_id,damage_type,severity,reported_at,device_timestamp,source,created_by)
 select 'a5ab0000-0000-4000-8000-000000000003',id,'Migration rollback test','MINOR',now(),now(),'Rollback-only test',auth.uid()
 from public.barangays limit 1;
insert into public.needs_reports(barangay_id,water_need,urgency,source)
 select id,true,'LOW','Rollback-only test' from public.barangays limit 1;
insert into public.generated_outputs(output_type,content,generated_by,source_snapshot)
 values ('LGU_ACTION_CARD','{}',auth.uid(),'{}');
insert into public.audit_logs(user_id,action,entity_type) values(auth.uid(),'MIGRATION_TEST','rollback_test');
insert into public.sync_conflicts(id,client_id,entity_type,client_payload,server_payload)
 values('a5ab0000-0000-4000-8000-000000000004','a5ab0000-0000-4000-8000-000000000003','damage_report','{}','{}') returning id;
do $$ begin
 if (select count(*) from public.sync_conflicts where id='a5ab0000-0000-4000-8000-000000000004')<>1 then
  raise exception 'Reporter cannot read newly inserted conflict';
 end if;
 begin
  insert into public.audit_logs(user_id,action) values('a5ab0000-0000-4000-8000-000000000002','FORGED');
  raise exception 'Forged audit identity was accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.generated_outputs(output_type,content,generated_by,source_snapshot)
   values('LGU_ACTION_CARD','{}','a5ab0000-0000-4000-8000-000000000002','{}');
  raise exception 'Forged output identity was accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','a5ab0000-0000-4000-8000-000000000002',true);
set local role authenticated;
update public.sync_conflicts set status='RESOLVED',resolution='KEEP_SERVER',resolved_by=auth.uid(),resolved_at=now()
 where id='a5ab0000-0000-4000-8000-000000000004';
do $$ begin
 if not exists(select 1 from public.sync_conflicts where id='a5ab0000-0000-4000-8000-000000000004' and status='RESOLVED') then
  raise exception 'Reviewer cannot resolve conflicts';
 end if;
end $$;
insert into public.advisories(source_agency,advisory_type,bulletin_reference,warning_information,issue_time,validity_start,validity_end,affected_areas,source_link,created_by)
 values('Rollback-only test','Test','ROLLBACK-TEST','Test only',now(),now(),now()+interval '1 hour',array['Test'],'https://example.invalid',auth.uid());
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
 begin
  insert into public.audit_logs(action) values('ANONYMOUS');
  raise exception 'Anonymous audit write was accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'operational writes, conflict resolution, and identity restrictions passed' as validation;
