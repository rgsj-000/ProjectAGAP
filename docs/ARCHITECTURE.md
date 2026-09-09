# Backend architecture

## Trust boundaries

The browser never supplies calculated risk, verification state, authorization state, or approved recommendations. Route handlers validate inputs with Zod, retrieve the current user and role from Supabase Auth, retrieve source records, run pure deterministic domain functions, and persist results plus an audit record.

```text
Verified advisory
  -> versioned methodology + verified inputs
  -> deterministic risk / exposure / capacity engines
  -> active, approved action-rule matching
  -> LGU or household action card
  -> generated output with source snapshot

Reported field data (always unverified)
  -> IndexedDB pending queue
  -> idempotent sync by client UUID
  -> conflict record on divergent duplicate
  -> authorized validation
  -> post-impact review
  -> immediate / stabilization / mitigation rules
```

## Relationships

- `barangays` parents population, exposure, capacity, facility, household, assessment, and report records.
- `advisories` and `methodologies` are versioned inputs to `risk_assessments`.
- `population_exposure_estimates` remains explicitly an estimate.
- `action_rules` is the sole origin of recommendations; generated outputs retain a source snapshot.
- `damage_reports` are idempotent by `client_id`; divergent duplicates become `sync_conflicts`.
- `post_impact_reviews` keeps reported and validated persons/households distinct.
- `audit_logs` records validation, assignment, modification, deferment, override, correction, methodology changes, synchronization, conflict resolution, and output generation.

## Assumptions

- LGU accounts are invite-only. Household users do not need accounts.
- Public household lookup is server-mediated and returns only the generated card.
- Exact household coordinates are not stored.
- Seed values are synthetic. Operational use requires formally approved methods, rules, and data sources.
- Gemini is optional; deterministic templates and rules continue working without it.

## AI guardrail

Gemini receives already-verified JSON for explanation, simplification, translation, or summarization. Brief mode reads only a persisted generated output and its source snapshot; it may narrate supplied facts, recorded gaps, and approved recommendations, but may not invent values or actions. Its JSON is schema-validated and prohibited content is rejected. It cannot call or write the risk, exposure, capacity, verification, or rule engines.
