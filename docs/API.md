# API reference

Responses use `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code", "message", "details" } }`.

## Advisories

- `GET /api/advisories?active=true&barangay=Dalahican`
- `POST /api/advisories` — encoder/reviewer/admin; always starts unverified.
- `PATCH /api/advisories/:id` — changes reset verification.
- `POST /api/advisories/:id/verify` — reviewer/admin.

## Assessment and cards

- `POST /api/risk-assessments` — server calculates risk.
- `POST /api/exposure` — population-grid, building-footprint, or fallback estimate.
- `POST /api/preparedness` — potential capacity gap; never an order.
- `GET /api/action-rules`
- `POST /api/action-cards/lgu`
- `POST /api/households/action-card` — code, quick-profile, or generic; public and minimal.
- `POST /api/post-impact`

## Reports and operations

- `GET|POST /api/damage-reports`; `POST /api/needs-reports`
- `POST /api/sync` — up to 100 records; idempotent by client UUID.
- `GET /api/conflicts`; `POST /api/conflicts/:id/resolve`
- `GET /api/offline-data/:barangayId` — excludes household data.
- `PATCH /api/actions/:id` — defer/override requires a reason.
- `GET /api/audit?limit=50`; `POST /api/ai`; `GET /api/health`

The Zod schemas in `src/lib/server/validation.ts` are canonical request definitions.

## Connected workflow additions

- `GET /api/operations` — authenticated workspace/reference records and actual LGU role.
- `POST /api/reference-data` — reviewer/admin registration of adopted methodology, validated capacity, or a source-approved bilingual action rule.
- `POST /api/evidence` — authenticated multipart private evidence upload (`file`, `kind`).
- Risk creation now requires `hazardId` and `dataDate` as well as barangay, advisory and methodology.
- LGU card creation accepts `advisoryId`; assessment lookup is constrained to barangay, event and hazard.
- Field report input now includes `advisoryId`, `damageSummary`, optional service disruption and `needs`. `/api/damage-reports` and `/api/sync` use the same transactional submission function.
- `POST /api/damage-reports/:id/verify` — reviewer/admin; requires an evidence reason and verifies linked needs.
- `POST /api/post-impact/consolidate` — reviewer/admin; selected report IDs, barangay, advisory, reason, and explicit `nonOverlapping: true` acknowledgment.
- `GET /api/actions?outputId=UUID` — persisted operational actions. Action changes include `responsibleUnit` and a reason.
- `GET /api/public/preparedness` — public barangay names; add `?barangay=NAME` for current verified advisory and household-approved rules only.
- `POST /api/ai` accepts `outputId`, `language`, and optional `mode` (`explain` or `brief`); arbitrary client `verifiedInput` is never accepted. Brief mode retrieves the persisted generated output and provenance itself, and may only narrate supplied values, data gaps, and approved recommendations. It returns a deterministic fallback if wording is unavailable.
- Conflict resolution currently accepts `KEEP_SERVER` with a reason. Client acceptance/merge must not be recorded without actually validating and applying a merge.

These routes depend on migration `202609090004_complete_workflows.sql`; see [deployment and verification status](WORKFLOW-IMPLEMENTATION.md).
