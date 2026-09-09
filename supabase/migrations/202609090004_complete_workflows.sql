begin;
alter table public.damage_reports add column advisory_id uuid references public.advisories,
  add column submitted_payload jsonb, add column damage_summary text, add column service_disruption text;
alter table public.post_impact_reviews add column report_ids uuid[] not null default '{}';
alter table public.risk_assessments add column hazard_id uuid references public.hazards;
alter table public.action_rules add column approved_action_fil text, add column why_it_applies_fil text;
alter table public.operational_actions add column decision_reason text;
grant select,insert,update on public.operational_actions,public.post_impact_reviews to authenticated;
grant update on public.needs_reports to authenticated;
grant select,insert on public.methodologies,public.action_rules,public.preparedness_capacities to authenticated;
create policy "reviewers register methodologies" on public.methodologies for insert to authenticated with check(public.current_lgu_role() in ('admin','lgu_reviewer'));
create policy "reviewers register rules" on public.action_rules for insert to authenticated with check(public.current_lgu_role() in ('admin','lgu_reviewer'));
create policy "reviewers register capacity" on public.preparedness_capacities for insert to authenticated with check(public.current_lgu_role() in ('admin','lgu_reviewer'));
create policy "reviewers create reviews" on public.post_impact_reviews for insert to authenticated
  with check(public.current_lgu_role() in ('admin','lgu_reviewer'));
create policy "reviewers validate needs" on public.needs_reports for update to authenticated
  using(public.current_lgu_role() in ('admin','lgu_reviewer')) with check(public.current_lgu_role() in ('admin','lgu_reviewer'));

-- One transaction for damage, linked needs, and audit. Advisory locking plus a
-- per-client advisory lock makes concurrent retries idempotent.
create function public.submit_field_report(p_payload jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
declare existing public.damage_reports; report_id uuid; conflict_id uuid; b uuid := (p_payload->>'barangayId')::uuid;
begin
  if not public.is_lgu_member() then raise exception 'LGU authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_payload->>'clientId',0));
  select * into existing from public.damage_reports where client_id=(p_payload->>'clientId')::uuid;
  if found then
    if existing.submitted_payload = p_payload then
      return jsonb_build_object('clientId',p_payload->>'clientId','status','SYNCED','id',existing.id,'deduplicated',true);
    end if;
    insert into public.sync_conflicts(client_id,entity_type,entity_id,client_payload,server_payload,created_by)
      values(existing.client_id,'damage_report',existing.id,p_payload,to_jsonb(existing),auth.uid()) returning id into conflict_id;
    insert into public.audit_logs(user_id,action,entity_type,entity_id,new_value)
      values(auth.uid(),'CONFLICT_DETECTED','sync_conflict',conflict_id,p_payload);
    return jsonb_build_object('clientId',p_payload->>'clientId','status','ACTION_REQUIRED','conflictId',conflict_id);
  end if;
  if not exists(select 1 from public.advisories a join public.barangays br on br.id=b
    where a.id=(p_payload->>'advisoryId')::uuid and br.barangay_name=any(a.affected_areas)) then
    raise exception 'Select an event advisory that covers this barangay';
  end if;
  insert into public.damage_reports(client_id,barangay_id,advisory_id,purok,reported_affected_persons,reported_affected_households,
    vulnerable_groups,damage_type,severity,damage_summary,service_disruption,critical_facility_condition,access_condition,
    evidence,source,device_timestamp,reported_at,verification_status,sync_status,created_by,submitted_payload,is_demo,data_classification)
  values((p_payload->>'clientId')::uuid,b,(p_payload->>'advisoryId')::uuid,p_payload->>'purok',
    (p_payload->>'reportedAffectedPersons')::integer,(p_payload->>'reportedAffectedHouseholds')::integer,
    p_payload->'vulnerableGroups',p_payload->>'damageType',p_payload->>'severity',p_payload->>'damageSummary',p_payload->>'serviceDisruption',
    p_payload->>'criticalFacilityCondition',p_payload->>'accessCondition',p_payload->'evidence',p_payload->>'source',
    (p_payload->>'deviceTimestamp')::timestamptz,(p_payload->>'deviceTimestamp')::timestamptz,'UNVERIFIED','SYNCED',auth.uid(),p_payload,
    coalesce((p_payload->>'isDemo')::boolean,false),case when (p_payload->>'isDemo')::boolean then 'SYNTHETIC' else 'OFFICIAL' end)
    returning id into report_id;
  insert into public.needs_reports(damage_report_id,barangay_id,food_need,water_need,shelter_need,medicine_need,rescue_need,restoration_need,
    service_need,urgency,source,verification_status,is_demo,data_classification)
  values(report_id,b,(p_payload->'needs') ? 'food',(p_payload->'needs') ? 'water',(p_payload->'needs') ? 'shelter',
    (p_payload->'needs') ? 'medicine',(p_payload->'needs') ? 'rescue',(p_payload->'needs') ? 'restoration',
    p_payload->>'serviceDisruption','MEDIUM',p_payload->>'source','UNVERIFIED',coalesce((p_payload->>'isDemo')::boolean,false),
    case when (p_payload->>'isDemo')::boolean then 'SYNTHETIC' else 'OFFICIAL' end);
  insert into public.audit_logs(user_id,action,entity_type,entity_id,new_value)
    values(auth.uid(),'SYNCHRONIZATION','damage_report',report_id,p_payload);
  return jsonb_build_object('clientId',p_payload->>'clientId','status','SYNCED','id',report_id);
end $$;

create function public.verify_field_report(p_id uuid,p_reason text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare old_record public.damage_reports;
begin
  if public.current_lgu_role() not in ('admin','lgu_reviewer') or public.current_lgu_role() is null then raise exception 'Reviewer required'; end if;
  if length(trim(p_reason))<10 then raise exception 'Verification evidence/reason required'; end if;
  select * into strict old_record from public.damage_reports where id=p_id for update;
  update public.damage_reports set verification_status='VERIFIED',verified_by=auth.uid(),verified_at=now(),version=version+1 where id=p_id;
  update public.needs_reports set verification_status='VERIFIED' where damage_report_id=p_id;
  insert into public.audit_logs(user_id,action,entity_type,entity_id,old_value,new_value,reason)
    values(auth.uid(),'VALIDATION','damage_report',p_id,to_jsonb(old_record),jsonb_build_object('verification_status','VERIFIED'),p_reason);
  return jsonb_build_object('id',p_id,'verificationStatus','VERIFIED');
end $$;

create function public.save_operational_output(p_barangay uuid,p_card jsonb,p_snapshot jsonb) returns uuid
language plpgsql security invoker set search_path=public as $$
declare output_id uuid; item jsonb;
begin
  if public.current_lgu_role() not in ('admin','lgu_reviewer') or public.current_lgu_role() is null then raise exception 'Reviewer required'; end if;
  insert into public.generated_outputs(output_type,barangay_id,reference_id,content,generated_by,source_snapshot)
    values(p_card->>'outputType',p_barangay,p_barangay,p_card,auth.uid(),p_snapshot) returning id into output_id;
  for item in select * from jsonb_array_elements(coalesce(p_card->'recommendedActions',p_card->'actions','[]'::jsonb)) loop
    insert into public.operational_actions(generated_output_id,barangay_id,action_rule_id,action_text,responsible_unit,requires_lgu_confirmation)
      values(output_id,p_barangay,item->>'actionRuleId',item->>'action',item->>'responsibleUnit',(item->>'requiresLguConfirmation')::boolean);
  end loop;
  insert into public.audit_logs(user_id,action,entity_type,entity_id,new_value)
    values(auth.uid(),'GENERATED_OUTPUT','generated_output',output_id,p_snapshot);
  return output_id;
end $$;
revoke all on function public.submit_field_report(jsonb),public.verify_field_report(uuid,text),public.save_operational_output(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.submit_field_report(jsonb),public.verify_field_report(uuid,text),public.save_operational_output(uuid,jsonb,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
