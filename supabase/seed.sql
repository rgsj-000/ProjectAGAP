-- SYNTHETIC DEMONSTRATION DATA ONLY. Not official or operational Lucena City data.
insert into public.barangays(id,psgc_code,name,barangay_name,population,source,reference_year,reference_date,verification_status,data_classification,is_demo) values
('10000000-0000-4000-8000-000000000001','9999900001','Dalahican','Dalahican',12000,'Project AGAP synthetic demonstration dataset',2026,current_date,'Needs Confirmation','SYNTHETIC',true),
('10000000-0000-4000-8000-000000000002','9999900002','Cotta','Cotta',9000,'Project AGAP synthetic demonstration dataset',2026,current_date,'Needs Confirmation','SYNTHETIC',true),
('10000000-0000-4000-8000-000000000003','9999900003','Barra','Barra',7000,'Project AGAP synthetic demonstration dataset',2026,current_date,'Needs Confirmation','SYNTHETIC',true),
('10000000-0000-4000-8000-000000000004','9999900004','Gulang-gulang','Gulang-gulang',15000,'Project AGAP synthetic demonstration dataset',2026,current_date,'Needs Confirmation','SYNTHETIC',true),
('10000000-0000-4000-8000-000000000005','9999900005','Ibabang Dupay','Ibabang Dupay',11000,'Project AGAP synthetic demonstration dataset',2026,current_date,'Needs Confirmation','SYNTHETIC',true)
on conflict(barangay_name) do update set population=excluded.population,source=excluded.source,reference_year=excluded.reference_year,data_classification='MIXED_OFFICIAL_SYNTHETIC',is_demo=true;
insert into public.population_profiles(barangay_id,population,households,children_under5,older_persons_60plus,pwd_count,average_household_size,children,older_persons,persons_with_disabilities,source,reference_year,reference_date,verification_status,data_classification,is_demo)
select id,population,round(population/4.2),round(population*.10),round(population*.08),round(population*.04),4.2,round(population*.28),round(population*.08),round(population*.04),'Project AGAP synthetic demonstration dataset',2026,current_date,'Needs Confirmation','SYNTHETIC',true
from public.barangays b where barangay_name in ('Dalahican','Cotta','Barra','Gulang-gulang','Ibabang Dupay')
and not exists(select 1 from public.population_profiles p where p.barangay_id=b.id and p.reference_year=2026 and p.is_demo);
insert into public.hazards(id,name,hazard_type,source,is_demo) values ('20000000-0000-4000-8000-000000000001','Synthetic Severe Rainfall Scenario','FLOOD','Project AGAP synthetic demonstration dataset',true) on conflict do nothing;
insert into public.methodologies(id,name,description,source,version,likelihood_scale,severity_scale,parameters,active_status) values
('30000000-0000-4000-8000-000000000001','AGAP 5x5 Demonstration Matrix','Risk equals likelihood multiplied by severity. Replace with an LGU-approved methodology before operational use.','Project AGAP synthetic demonstration methodology','demo-1.0','{"min":1,"max":5}','{"min":1,"max":5}','{"categories":[{"min":1,"max":4,"label":"LOW"},{"min":5,"max":9,"label":"MODERATE"},{"min":10,"max":16,"label":"HIGH"},{"min":17,"max":25,"label":"VERY_HIGH"}]}',true)
on conflict(name,version) do nothing;
insert into public.advisories(id,advisory_code,source_agency,advisory_type,bulletin_reference,warning_information,issued_at,issue_time,validity_start,validity_end,affected_areas,source_link,verification_status,data_classification,is_demo)
values ('40000000-0000-4000-8000-000000000001','DEMO-BULLETIN-001','SYNTHETIC — Project AGAP Demo','Severe Rainfall Demonstration','DEMO-BULLETIN-001','Synthetic heavy-rainfall scenario for software demonstration only.',now(),now(),now()-interval '1 hour',now()+interval '365 days',array['Dalahican','Cotta','Barra'],'https://example.invalid/agap-demo','VERIFIED','SYNTHETIC',true)
on conflict(source_agency,bulletin_reference) do update set validity_end=excluded.validity_end;
insert into public.preparedness_capacities(barangay_id,evacuation_capacity,temporary_shelter_capacity,responders,equipment,backup_power,communication_access,facility_status,validation_date,source,limitations,is_demo)
select id,800,200,20,'{"vehicles":2,"radios":8}','UNVERIFIED',array['SMS','Radio','Barangay Announcements'],'FOR_REVIEW',current_date,'Project AGAP synthetic demonstration dataset',array['Synthetic capacities require replacement and LGU validation.'],true
from public.barangays where barangay_name in ('Dalahican','Cotta','Barra','Gulang-gulang','Ibabang Dupay') and not exists(select 1 from public.preparedness_capacities p where p.barangay_id=barangays.id);
insert into public.population_exposure_estimates(barangay_id,hazard_id,estimated_exposed_population,estimated_households,vulnerable_group_estimates,estimation_method,confidence_level,source,reference_date,limitations,is_demo)
select b.id,'20000000-0000-4000-8000-000000000001',round(b.population*.35),round(b.population*.35/4.2),'{"children":980,"older_persons":280,"persons_with_disabilities":140}','INHABITED_AREA_PROPORTION_FALLBACK','LOW','Project AGAP synthetic demonstration estimate',current_date,array['Pre-disaster estimate only; not affected population and not household-level exposure.'],true
from public.barangays b where b.barangay_name in ('Dalahican','Cotta','Barra','Gulang-gulang','Ibabang Dupay') and not exists(select 1 from public.population_exposure_estimates e where e.barangay_id=b.id);
insert into public.critical_facilities(name,facility_type,type,barangay_id,operational_status,capacity,reference_date,verification_status,data_classification,source,is_demo)
select 'Synthetic '||barangay_name||' Evacuation Facility','Evacuation Center','EVACUATION_CENTER',id,'Needs Confirmation',500,current_date,'Needs Confirmation','SYNTHETIC','Project AGAP synthetic demonstration dataset',true
from public.barangays b where b.barangay_name in ('Dalahican','Cotta','Barra','Gulang-gulang','Ibabang Dupay') and not exists(select 1 from public.critical_facilities f where f.barangay_id=b.id and f.is_demo);
insert into public.household_profiles(household_code,barangay_id,optional_purok,household_members,has_children,has_older_person,has_pwd_or_mobility_limitation,needs_essential_medicine,has_pets,housing_characteristics,communication_methods,is_demo)
select 'DLH-P03-HH0048',id,'Purok 3',5,true,true,false,true,true,'{"type":"synthetic demo profile"}',array['SMS','Radio'],true
from public.barangays where barangay_name='Dalahican' on conflict(household_code) do nothing;
insert into public.action_rules(rule_id,disaster_phase,hazard_or_condition,fact_field,operator,threshold,approved_action,why_it_applies,source_agency,source_document,target_audience,responsible_unit,requires_lgu_confirmation,version,active_status) values
('DEMO-LGU-001','PRE_DISASTER','High risk','riskCategory','IN','["HIGH","VERY_HIGH"]','Flag the assessment for priority LGU review.','The deterministic risk category meets the review threshold.','SYNTHETIC — Project AGAP','Demonstration action-rule register','LGU','CDRRMO Review Team',true,'demo-1.0',true),
('DEMO-LGU-002','PRE_DISASTER','Capacity gap','capacityGap','GT','0','Request validation of shelter and evacuation capacity.','Estimated potential exposure exceeds recorded validated planning capacity.','SYNTHETIC — Project AGAP','Demonstration action-rule register','LGU','Evacuation and Camp Management',true,'demo-1.0',true),
('DEMO-HH-001','HOUSEHOLD','Children present','hasInfantOrChild','TRUTHY','true','Prepare child-specific food, clothing, identification, and comfort items.','The quick profile indicates an infant or child in the household.','SYNTHETIC — Project AGAP','Demonstration household-rule register','HOUSEHOLD','Household',false,'demo-1.0',true),
('DEMO-HH-002','HOUSEHOLD','Older person present','hasOlderPerson','TRUTHY','true','Prepare medicines, mobility support, and a caregiver contact plan.','The quick profile indicates an older household member.','SYNTHETIC — Project AGAP','Demonstration household-rule register','HOUSEHOLD','Household',false,'demo-1.0',true),
('DEMO-HH-003','HOUSEHOLD','Medicine need','hasEssentialMedicineNeed','TRUTHY','true','Prepare an appropriate personal medicine supply and prescription information.','The quick profile records an essential medicine need.','SYNTHETIC — Project AGAP','Demonstration household-rule register','HOUSEHOLD','Household',false,'demo-1.0',true),
('DEMO-HH-004','HOUSEHOLD','Pets present','hasPets','TRUTHY','true','Prepare pet food, water, identification, and a safe carrier or restraint.','The quick profile indicates pets.','SYNTHETIC — Project AGAP','Demonstration household-rule register','HOUSEHOLD','Household',false,'demo-1.0',true),
('DEMO-POST-001','POST_IMMEDIATE','Reports await validation','populationAwaitingValidation','GT','0','Validate reported affected households and persons.','Reported totals exceed validated totals.','SYNTHETIC — Project AGAP','Demonstration post-impact rule register','LGU','Assessment and Validation Team',true,'demo-1.0',true),
('DEMO-POST-002','POST_STABILIZATION','Service disruption','hasServiceDisruption','TRUTHY','true','Track and validate restoration of essential services.','A service disruption is recorded in field evidence.','SYNTHETIC — Project AGAP','Demonstration post-impact rule register','LGU','Public Services Coordination',true,'demo-1.0',true),
('DEMO-POST-003','POST_MITIGATION','Recurring access constraint','hasAccessibilityConstraints','TRUTHY','true','Review recurring access constraints and update preparedness records.','Validated access constraints should inform mitigation review.','SYNTHETIC — Project AGAP','Demonstration post-impact rule register','LGU','Planning and Engineering Review',true,'demo-1.0',true)
on conflict(rule_id,version) do nothing;

insert into public.action_rules(rule_id,disaster_phase,hazard_or_condition,fact_field,operator,threshold,approved_action,why_it_applies,source_agency,source_document,target_audience,responsible_unit,requires_lgu_confirmation,version,active_status) values
('DEMO-HH-005','HOUSEHOLD','Generic barangay guidance','genericBarangay','TRUTHY','true','Monitor verified official advisories and prepare household essentials appropriate to your needs.','A generic barangay card provides only approved general preparedness guidance.','SYNTHETIC — Project AGAP','Demonstration household-rule register','HOUSEHOLD','Household',false,'demo-1.0',true),
('DEMO-POST-001','POST_IMMEDIATE','Incomplete validation','validationIncomplete','TRUTHY','true','Validate reported affected households and persons.','Reported figures remain distinct from validated figures.','SYNTHETIC — Project AGAP','Demonstration post-impact rule register','LGU','Validation Team',true,'demo-1.0',true),
('DEMO-POST-002','POST_STABILIZATION','Service disruption','serviceDisruption','TRUTHY','true','Validate and track restoration of essential services.','A service disruption was reported and requires confirmation and monitoring.','SYNTHETIC — Project AGAP','Demonstration post-impact rule register','LGU','Utilities Coordination Unit',true,'demo-1.0',true),
('DEMO-POST-003','POST_IMMEDIATE','Water need awaiting validation','waterNeedValidated','TRUTHY','true','Confirm potable water requirements before augmentation planning.','A water need was recorded and must be validated before quantities or allocation decisions.','SYNTHETIC — Project AGAP','Demonstration post-impact rule register','LGU','Health and WASH Unit',true,'demo-1.0',true)
on conflict(rule_id,version) do nothing;

insert into public.risk_assessments(id,barangay_id,advisory_id,methodology_id,likelihood,severity,risk_result,risk_category,threat_level,adaptive_capacity,relative_vulnerability,evidence,data_date,confidence_level,limitations)
select gen_random_uuid(),b.id,'40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',3,4,12,'HIGH',3,2,1.5,'["Synthetic demonstration input only"]',current_date,'LOW',array['Replace all values with verified operational evidence.']
from public.barangays b where b.barangay_name in ('Dalahican','Cotta','Barra','Gulang-gulang','Ibabang Dupay') and not exists(select 1 from public.risk_assessments r where r.barangay_id=b.id);
insert into public.damage_reports(client_id,barangay_id,reported_affected_persons,reported_affected_households,vulnerable_groups,damage_type,severity,critical_facility_condition,access_condition,evidence,source,reported_at,device_timestamp,verification_status,sync_status,is_demo)
select gen_random_uuid(),id,25,6,'{"older_persons":2}','Synthetic flood damage report','UNDETERMINED','UNVERIFIED','UNVERIFIED','[{"type":"note","reference":"Synthetic demo evidence"}]','Project AGAP synthetic demonstration dataset',now(),now(),'UNVERIFIED','SYNCED',true from public.barangays where barangay_name='Dalahican' and not exists(select 1 from public.damage_reports where is_demo);
insert into public.needs_reports(barangay_id,water_need,shelter_need,medicine_need,urgency,source,verification_status,is_demo)
select id,true,true,true,'HIGH','Project AGAP synthetic demonstration dataset','UNVERIFIED',true from public.barangays where barangay_name='Dalahican' and not exists(select 1 from public.needs_reports where is_demo);
insert into public.post_impact_reviews(advisory_id,event_reference,barangay_id,reported_population,validated_population,reported_households,validated_households,vulnerable_groups,damage_summary,facility_condition,service_disruption,accessibility_constraints,urgent_unmet_needs,validation_status,review_state)
select '40000000-0000-4000-8000-000000000001','DEMO-EVENT-001',id,25,0,6,0,'{"reported":"Synthetic demo only"}','Synthetic report awaiting validation','UNVERIFIED','UNVERIFIED','UNVERIFIED','Water, shelter, and medicine reports awaiting validation','UNVERIFIED','OPEN' from public.barangays where barangay_name='Dalahican' and not exists(select 1 from public.post_impact_reviews where event_reference='DEMO-EVENT-001');

-- Complete the seven-barangay dataset currently exposed by the application.
-- Values below are deliberately plausible rather than authoritative. They are
-- internally consistent, deterministic, idempotent, and visibly marked demo.
insert into public.barangays(id,psgc_code,name,barangay_name,population,source,reference_year,reference_date,verification_status,data_classification,is_demo) values
('10000000-0000-4000-8000-000000000006','9999900006','Mayao Crossing','Mayao Crossing',8400,'Project AGAP synthetic demonstration dataset',2026,current_date,'Needs Confirmation','SYNTHETIC',true),
('10000000-0000-4000-8000-000000000007','9999900007','Ransohan','Ransohan',6100,'Project AGAP synthetic demonstration dataset',2026,current_date,'Needs Confirmation','SYNTHETIC',true)
on conflict(barangay_name) do update set population=excluded.population,source=excluded.source,reference_year=excluded.reference_year,data_classification='MIXED_OFFICIAL_SYNTHETIC',is_demo=true;

update public.advisories set
  affected_areas=array['Dalahican','Cotta','Barra','Gulang-gulang','Ibabang Dupay','Mayao Crossing','Ransohan'],
  issue_time=now(), validity_start=now()-interval '1 hour', validity_end=now()+interval '365 days',
  warning_information='Synthetic severe-rainfall and flooding scenario for Project AGAP software demonstration only. Values are not official CDRA findings.',
  verification_status='VERIFIED', is_demo=true
where id='40000000-0000-4000-8000-000000000001';

insert into public.population_profiles(barangay_id,population,households,children_under5,older_persons_60plus,pwd_count,average_household_size,children,older_persons,persons_with_disabilities,other_vulnerability_indicators,source,reference_year,reference_date,verification_status,data_classification,is_demo)
select b.id,b.population,round(b.population/4.2),round(b.population*.10),round(b.population*.08),round(b.population*.04),4.2,round(b.population*.28),round(b.population*.08),round(b.population*.04),
  jsonb_build_object('pregnant_or_lactating',round(b.population*.025),'single_parent_households',round(b.population/4.2*.07)),
  'Project AGAP synthetic demonstration dataset',2026,current_date,'Needs Confirmation','SYNTHETIC',true
from public.barangays b where b.barangay_name in ('Dalahican','Cotta','Barra','Gulang-gulang','Ibabang Dupay','Mayao Crossing','Ransohan')
and not exists(select 1 from public.population_profiles p where p.barangay_id=b.id and p.reference_year=2026 and p.is_demo);

with demo(barangay_name,evacuation_capacity,temporary_shelter_capacity,responders,vehicles,radios,backup_power,facility_status) as (values
  ('Dalahican',720,180,28,3,12,'AVAILABLE','FOR_REVIEW'),
  ('Cotta',650,160,24,2,10,'AVAILABLE','FOR_REVIEW'),
  ('Barra',520,130,20,2,8,'LIMITED','FOR_REVIEW'),
  ('Gulang-gulang',1100,260,36,4,15,'AVAILABLE','FOR_REVIEW'),
  ('Ibabang Dupay',880,220,30,3,12,'AVAILABLE','FOR_REVIEW'),
  ('Mayao Crossing',700,170,22,2,9,'LIMITED','FOR_REVIEW'),
  ('Ransohan',480,120,18,2,7,'LIMITED','FOR_REVIEW')
)
update public.preparedness_capacities p set evacuation_capacity=d.evacuation_capacity,
  temporary_shelter_capacity=d.temporary_shelter_capacity,responders=d.responders,
  equipment=jsonb_build_object('vehicles',d.vehicles,'radios',d.radios,'first_aid_kits',greatest(4,d.responders/3)),
  backup_power=d.backup_power,communication_access=array['SMS','VHF Radio','Barangay Announcements'],
  facility_status=d.facility_status,validation_date=current_date,source='Project AGAP synthetic demonstration capacity register',
  limitations=array['Synthetic values for workflow demonstration; replace with an LGU-validated inventory.'],is_demo=true
from demo d join public.barangays b on b.barangay_name=d.barangay_name
where p.barangay_id=b.id and p.is_demo;

with demo(barangay_name,evacuation_capacity,temporary_shelter_capacity,responders,vehicles,radios,backup_power,facility_status) as (values
  ('Dalahican',720,180,28,3,12,'AVAILABLE','FOR_REVIEW'),('Cotta',650,160,24,2,10,'AVAILABLE','FOR_REVIEW'),
  ('Barra',520,130,20,2,8,'LIMITED','FOR_REVIEW'),('Gulang-gulang',1100,260,36,4,15,'AVAILABLE','FOR_REVIEW'),
  ('Ibabang Dupay',880,220,30,3,12,'AVAILABLE','FOR_REVIEW'),('Mayao Crossing',700,170,22,2,9,'LIMITED','FOR_REVIEW'),
  ('Ransohan',480,120,18,2,7,'LIMITED','FOR_REVIEW')
)
insert into public.preparedness_capacities(barangay_id,evacuation_capacity,temporary_shelter_capacity,responders,equipment,backup_power,communication_access,facility_status,validation_date,source,limitations,is_demo)
select b.id,d.evacuation_capacity,d.temporary_shelter_capacity,d.responders,
  jsonb_build_object('vehicles',d.vehicles,'radios',d.radios,'first_aid_kits',greatest(4,d.responders/3)),d.backup_power,
  array['SMS','VHF Radio','Barangay Announcements'],d.facility_status,current_date,'Project AGAP synthetic demonstration capacity register',
  array['Synthetic values for workflow demonstration; replace with an LGU-validated inventory.'],true
from demo d join public.barangays b on b.barangay_name=d.barangay_name
where not exists(select 1 from public.preparedness_capacities p where p.barangay_id=b.id and p.is_demo);

with demo(barangay_name,exposed,households,children,older_persons,pwd,confidence,ratio) as (values
  ('Dalahican',7200,1714,2016,576,288,'MEDIUM',0.60::numeric),
  ('Cotta',4950,1179,1386,396,198,'MEDIUM',0.55::numeric),
  ('Barra',3500,833,980,280,140,'MEDIUM',0.50::numeric),
  ('Gulang-gulang',5250,1250,1470,420,210,'LOW',0.35::numeric),
  ('Ibabang Dupay',3300,786,924,264,132,'LOW',0.30::numeric),
  ('Mayao Crossing',2100,500,588,168,84,'LOW',0.25::numeric),
  ('Ransohan',1220,290,342,98,49,'LOW',0.20::numeric)
)
update public.population_exposure_estimates e set estimated_exposed_population=d.exposed,estimated_households=d.households,
  vulnerable_group_estimates=jsonb_build_object('children',d.children,'older_persons',d.older_persons,'persons_with_disabilities',d.pwd),
  estimation_method='INHABITED_AREA_PROPORTION_FALLBACK',confidence_level=d.confidence,
  source='Project AGAP synthetic CDRA-style demonstration scenario',reference_date=current_date,
  limitations=array['Scenario estimate only; not an official CDRA result or observed affected population.','Inhabited-area ratio used for demonstration.'],is_demo=true
from demo d join public.barangays b on b.barangay_name=d.barangay_name
where e.barangay_id=b.id and e.hazard_id='20000000-0000-4000-8000-000000000001' and e.is_demo;

with demo(barangay_name,exposed,households,children,older_persons,pwd,confidence) as (values
  ('Dalahican',7200,1714,2016,576,288,'MEDIUM'),('Cotta',4950,1179,1386,396,198,'MEDIUM'),
  ('Barra',3500,833,980,280,140,'MEDIUM'),('Gulang-gulang',5250,1250,1470,420,210,'LOW'),
  ('Ibabang Dupay',3300,786,924,264,132,'LOW'),('Mayao Crossing',2100,500,588,168,84,'LOW'),
  ('Ransohan',1220,290,342,98,49,'LOW')
)
insert into public.population_exposure_estimates(barangay_id,hazard_id,estimated_exposed_population,estimated_households,vulnerable_group_estimates,estimation_method,confidence_level,source,reference_date,limitations,is_demo)
select b.id,'20000000-0000-4000-8000-000000000001',d.exposed,d.households,
  jsonb_build_object('children',d.children,'older_persons',d.older_persons,'persons_with_disabilities',d.pwd),
  'INHABITED_AREA_PROPORTION_FALLBACK',d.confidence,'Project AGAP synthetic CDRA-style demonstration scenario',current_date,
  array['Scenario estimate only; not an official CDRA result or observed affected population.','Inhabited-area ratio used for demonstration.'],true
from demo d join public.barangays b on b.barangay_name=d.barangay_name
where not exists(select 1 from public.population_exposure_estimates e where e.barangay_id=b.id and e.hazard_id='20000000-0000-4000-8000-000000000001' and e.is_demo);

with demo(barangay_name,exposure_level,exposure_category) as (values
 ('Dalahican',90,'VERY_HIGH'),('Cotta',82,'VERY_HIGH'),('Barra',72,'HIGH'),('Gulang-gulang',65,'HIGH'),
 ('Ibabang Dupay',48,'MODERATE'),('Mayao Crossing',38,'MODERATE'),('Ransohan',22,'LOW')
)
insert into public.hazard_exposures(barangay_id,hazard_type,exposure_level,exposure_category,source,reference_date,verification_status,data_classification,limitations,is_demo)
select b.id,'FLOOD',d.exposure_level,d.exposure_category,'Project AGAP synthetic CDRA-style demonstration scenario',current_date,
 'Needs Confirmation','SYNTHETIC',array['Illustrative hazard exposure classification only; no official hazard geometry attached.'],true
from demo d join public.barangays b on b.barangay_name=d.barangay_name
where not exists(select 1 from public.hazard_exposures h where h.barangay_id=b.id and h.hazard_type='FLOOD' and h.is_demo);

with demo(barangay_name,capacity,status) as (values
 ('Dalahican',720,'FOR_REVIEW'),('Cotta',650,'FOR_REVIEW'),('Barra',520,'FOR_REVIEW'),
 ('Gulang-gulang',1100,'FOR_REVIEW'),('Ibabang Dupay',880,'FOR_REVIEW'),
 ('Mayao Crossing',700,'FOR_REVIEW'),('Ransohan',480,'FOR_REVIEW')
)
update public.critical_facilities f set name='Synthetic '||d.barangay_name||' Evacuation Center',facility_type='Evacuation Center',type='EVACUATION_CENTER',
  operational_status='Needs Confirmation',capacity=d.capacity,last_validation_date=current_date,reference_date=current_date,
  verification_status='Needs Confirmation',data_classification='SYNTHETIC',source='Project AGAP synthetic demonstration facility register',is_demo=true
from demo d join public.barangays b on b.barangay_name=d.barangay_name
where f.barangay_id=b.id and f.is_demo;

with demo(barangay_name,capacity,status) as (values
 ('Dalahican',720,'FOR_REVIEW'),('Cotta',650,'FOR_REVIEW'),('Barra',520,'FOR_REVIEW'),
 ('Gulang-gulang',1100,'FOR_REVIEW'),('Ibabang Dupay',880,'FOR_REVIEW'),
 ('Mayao Crossing',700,'FOR_REVIEW'),('Ransohan',480,'FOR_REVIEW')
)
insert into public.critical_facilities(name,facility_type,type,barangay_id,operational_status,capacity,last_validation_date,reference_date,verification_status,data_classification,source,is_demo)
select 'Synthetic '||d.barangay_name||' Evacuation Center','Evacuation Center','EVACUATION_CENTER',b.id,'Needs Confirmation',d.capacity,current_date,current_date,
 'Needs Confirmation','SYNTHETIC','Project AGAP synthetic demonstration facility register',true
from demo d join public.barangays b on b.barangay_name=d.barangay_name
where not exists(select 1 from public.critical_facilities f where f.barangay_id=b.id and f.is_demo);

-- The selected hazard must be present on the assessment row; the action-card
-- API filters by barangay + advisory + hazard. The original seed omitted it.
with demo(barangay_name,likelihood,severity,risk_result,risk_category,threat,capacity,vulnerability,confidence) as (values
 ('Dalahican',5,5,25,'VERY_HIGH',5.0,2.0,2.50,'MEDIUM'),
 ('Cotta',4,5,20,'VERY_HIGH',4.5,2.1,2.14,'MEDIUM'),
 ('Barra',4,4,16,'HIGH',4.0,2.2,1.82,'MEDIUM'),
 ('Gulang-gulang',3,4,12,'HIGH',3.5,2.8,1.25,'MEDIUM'),
 ('Ibabang Dupay',3,3,9,'MODERATE',3.0,3.0,1.00,'LOW'),
 ('Mayao Crossing',2,3,6,'MODERATE',2.5,3.2,0.78,'LOW'),
 ('Ransohan',2,2,4,'LOW',2.0,3.5,0.57,'LOW')
)
update public.risk_assessments r set hazard_id='20000000-0000-4000-8000-000000000001',likelihood=d.likelihood,
 severity=d.severity,risk_result=d.risk_result,risk_category=d.risk_category,threat_level=d.threat,
 adaptive_capacity=d.capacity,relative_vulnerability=d.vulnerability,
 evidence=jsonb_build_array('Synthetic CDRA-style flood scoring for Project AGAP demonstration only',
   'Likelihood and severity use the AGAP 5x5 demonstration matrix'),
 data_date=current_date,assessment_date=now(),confidence_level=d.confidence,
 limitations=array['Not an official Lucena City CDRA assessment.','Replace with approved hazard, vulnerability, and capacity evidence before operational use.']
from demo d join public.barangays b on b.barangay_name=d.barangay_name
where r.barangay_id=b.id and r.advisory_id='40000000-0000-4000-8000-000000000001';

with demo(barangay_name,likelihood,severity,risk_result,risk_category,threat,capacity,vulnerability,confidence) as (values
 ('Dalahican',5,5,25,'VERY_HIGH',5.0,2.0,2.50,'MEDIUM'),('Cotta',4,5,20,'VERY_HIGH',4.5,2.1,2.14,'MEDIUM'),
 ('Barra',4,4,16,'HIGH',4.0,2.2,1.82,'MEDIUM'),('Gulang-gulang',3,4,12,'HIGH',3.5,2.8,1.25,'MEDIUM'),
 ('Ibabang Dupay',3,3,9,'MODERATE',3.0,3.0,1.00,'LOW'),('Mayao Crossing',2,3,6,'MODERATE',2.5,3.2,0.78,'LOW'),
 ('Ransohan',2,2,4,'LOW',2.0,3.5,0.57,'LOW')
)
insert into public.risk_assessments(barangay_id,hazard_id,advisory_id,methodology_id,likelihood,severity,risk_result,risk_category,threat_level,adaptive_capacity,relative_vulnerability,evidence,data_date,confidence_level,limitations)
select b.id,'20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',
 d.likelihood,d.severity,d.risk_result,d.risk_category,d.threat,d.capacity,d.vulnerability,
 jsonb_build_array('Synthetic CDRA-style flood scoring for Project AGAP demonstration only','Likelihood and severity use the AGAP 5x5 demonstration matrix'),
 current_date,d.confidence,array['Not an official Lucena City CDRA assessment.','Replace with approved hazard, vulnerability, and capacity evidence before operational use.']
from demo d join public.barangays b on b.barangay_name=d.barangay_name
where not exists(select 1 from public.risk_assessments r where r.barangay_id=b.id
 and r.advisory_id='40000000-0000-4000-8000-000000000001'
 and r.hazard_id='20000000-0000-4000-8000-000000000001');
