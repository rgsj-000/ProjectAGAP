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
