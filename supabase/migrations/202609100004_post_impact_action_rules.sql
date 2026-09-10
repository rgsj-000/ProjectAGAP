begin;

insert into public.action_rules(
  rule_id, disaster_phase, hazard_or_condition, fact_field, operator, threshold,
  approved_action, why_it_applies, source_agency, source_document,
  target_audience, responsible_unit, requires_lgu_confirmation, version, active_status
) values
  (
    'DEMO-POST-010','POST_IMMEDIATE','Validated affected households','hasValidatedAffectedHouseholds','TRUTHY','true',
    'Assess immediate household support requirements and confirm which needs require LGU action.',
    'Validated affected households are present in the consolidated post-impact review.',
    'Project AGAP','Demonstration post-impact action-rule register','LGU','CDRRMO / Barangay DRRM',true,'demo-2.0',true
  ),
  (
    'DEMO-POST-011','POST_IMMEDIATE','Validated potable-water need','waterNeedValidated','TRUTHY','true',
    'Confirm potable-water requirements before augmentation or distribution planning.',
    'A potable-water need has been reported and validated.',
    'Project AGAP','Demonstration post-impact action-rule register','LGU','Health and WASH Unit',true,'demo-2.0',true
  ),
  (
    'DEMO-POST-012','POST_IMMEDIATE','Validated shelter need','shelterNeedValidated','TRUTHY','true',
    'Assess temporary-shelter requirements and available capacity for affected households.',
    'A shelter need has been reported and validated.',
    'Project AGAP','Demonstration post-impact action-rule register','LGU','CDRRMO / Social Welfare',true,'demo-2.0',true
  ),
  (
    'DEMO-POST-013','POST_IMMEDIATE','Validated medicine need with vulnerable groups','medicineNeedValidated','TRUTHY','true',
    'Verify medicine requirements and continuity of care for affected vulnerable groups.',
    'A medicine need has been reported and validated; vulnerable-group information remains visible for LGU review.',
    'Project AGAP','Demonstration post-impact action-rule register','LGU','City Health Office',true,'demo-2.0',true
  ),
  (
    'DEMO-POST-014','POST_IMMEDIATE','Access constraint','hasAccessibilityConstraints','TRUTHY','true',
    'Validate current road and access conditions and coordinate appropriate access support.',
    'The consolidated report records an accessibility constraint.',
    'Project AGAP','Demonstration post-impact action-rule register','LGU','Engineering / Barangay DRRM',true,'demo-2.0',true
  ),
  (
    'DEMO-POST-015','POST_STABILIZATION','Essential-service disruption','hasServiceDisruption','TRUTHY','true',
    'Monitor restoration of affected electricity, water, and other essential services.',
    'The consolidated post-impact review records a lifeline or service disruption.',
    'Project AGAP','Demonstration post-impact action-rule register','LGU','Utilities Coordination Unit',true,'demo-2.0',true
  ),
  (
    'DEMO-POST-016','POST_STABILIZATION','Validated affected population','hasValidatedAffectedPopulation','TRUTHY','true',
    'Continue monitoring affected households and vulnerable populations while consolidating validated field reports.',
    'Validated affected persons are recorded in the post-impact review.',
    'Project AGAP','Demonstration post-impact action-rule register','LGU','Assessment and Validation Team',true,'demo-2.0',true
  ),
  (
    'DEMO-POST-017','POST_MITIGATION','Recurring access or flood constraint','hasAccessibilityConstraints','TRUTHY','true',
    'Review recurring flood and access constraints for engineering, drainage, land-use, or contingency-planning follow-up.',
    'Validated access constraints should inform mitigation and preparedness review after immediate response.',
    'Project AGAP','Demonstration post-impact action-rule register','LGU','Planning and Engineering Review',true,'demo-2.0',true
  ),
  (
    'DEMO-POST-018','POST_MITIGATION','Post-event lessons available','hasValidatedAffectedPopulation','TRUTHY','true',
    'Update barangay risk, exposure, facility, capacity, and contingency-planning records using validated lessons from the event.',
    'Validated post-event information can be carried forward into future preparedness review.',
    'Project AGAP','Demonstration post-impact action-rule register','LGU','CDRRMO Planning and Records',true,'demo-2.0',true
  )
on conflict(rule_id,version) do update set
  disaster_phase = excluded.disaster_phase,
  hazard_or_condition = excluded.hazard_or_condition,
  fact_field = excluded.fact_field,
  operator = excluded.operator,
  threshold = excluded.threshold,
  approved_action = excluded.approved_action,
  why_it_applies = excluded.why_it_applies,
  source_agency = excluded.source_agency,
  source_document = excluded.source_document,
  target_audience = excluded.target_audience,
  responsible_unit = excluded.responsible_unit,
  requires_lgu_confirmation = excluded.requires_lgu_confirmation,
  active_status = excluded.active_status;

commit;
