# Operational workflow implementation

Implemented September 9, 2026 against the local working tree. This follows the [alignment review](HACK4APROGRESS-ALIGNMENT-REVIEW.md).

## User flows implemented

1. **LGU entry:** the workspace loads through an authenticated operations endpoint. Public residents use `/household`. UI demo selectors do not grant server permissions; actual roles come from Supabase.
2. **Reference records:** reviewers can record an adopted methodology, validated capacity and source-approved bilingual action rules. Methodology category bands must cover each possible result exactly once.
3. **Advisory intake:** the existing form creates an unverified record, retains source metadata and optional private bulletin evidence, and allows reviewer verification.
4. **Assessment:** a reviewer selects barangay, event, hazard and methodology, records evidence and its source date, calculates deterministic risk, and records an exposure estimate. Exposure inputs are prepared spatial results, not an automated raster-processing pipeline.
5. **LGU card:** generation uses the selected advisory, a matching barangay/event/hazard assessment, exposure and validated capacity. It retains methodology/source metadata, persists the output and registers the recommended operational actions atomically.
6. **Public household:** code, quick-profile and generic modes call the server rule library. Approved Filipino wording is used where recorded; missing translations are disclosed instead of invented. Generic approved rules apply across modes. Household-code output can be cached without retaining a full household profile.
7. **Field reporting:** a report is saved to an owner-scoped IndexedDB queue before synchronization. The server transaction saves damage, linked needs and audit together. Identical retries are idempotent; changed payloads create conflicts instead of overwriting data.
8. **Post-impact review:** reviewers verify report figures and linked needs with evidence, select distinct reports for one barangay/event, confirm that populations do not overlap, and generate a review/card. Reported and validated population totals remain separate. Validated water need is derived from explicit needs verification, not a text substring.
9. **Actions:** persisted actions can receive a responsible unit, status and recorded reason. Deferment and override require a reason. Existing server records can be retained through an authorized conflict-resolution decision; accepting or merging a conflicting client payload is deliberately not offered until that mutation has a dedicated validation flow.
10. **Continuity:** a service worker caches the public application shell/static assets, IndexedDB retains data/cards and pending reports, reconnect retries pending uploads, and expired advisory snapshots are visibly stale. Offline risk recalculation is labeled as a local draft. Printable cards, sourced brief content, and a Barangay Offline Operations Pack include blank damage/needs/validation sheets and reconciliation instructions. An unconnected emergency contact list stays explicitly blank for authorized completion.

## Deployment status

**Code is local; migration `202609090004_complete_workflows.sql` has not been applied.** Automatic approval review rejected the remote migration because it changes schema and access policies without approval for that exact remote change.

The additive migration introduces event-linked report payloads, hazard-linked risk assessments, review report IDs, bilingual rule fields, decision reasons, reference-record policies, and transaction functions for report submission, verification and operational output/action creation. Existing records are preserved; legacy assessments require reassessment for a selected hazard before they can feed the new card flow.

Local `.env.local` contains only a Vercel OIDC token. The linked Vercel project lists Supabase credentials for production, but automatic approval review rejected copying them into a local file. No production secrets were retrieved. `.env.example` documents the required keys without values.

No government data, approved methodology thresholds, official actions, LGU account identities, or emergency contacts were fabricated. The historical `supabase/seed.sql` is incompatible with parts of the imported database and must not be applied to this project. Complete operational acceptance needs authorized reference records and an LGU test account.

## Verification

- Unit/domain suite: 31 tests passed across 9 files, including locality/validity checks, 10/4/6 post-impact totals, explicit water-need validation, and approved Filipino wording.
- TypeScript and production build checked successfully during implementation; final checks are recorded in the handoff.
- The proposed migration and workflow role tests were executed against the connected database in transactions ending in **ROLLBACK**. Tests passed for idempotent retries, linked-needs deduplication, changed-count conflicts, no silent overwrite, reporter verification denial, reviewer verification, action persistence, audit creation and anonymous submission denial.
- Browser verification reached the public page and switched household modes. Live generation stopped at missing local Supabase configuration. No claim of authenticated browser end-to-end completion is made.

To regenerate the rollback-only migration check:

```powershell
node supabase/checks/build-workflow-check.cjs
npx supabase@2.117.0 db query --linked --file supabase/checks/workflows-rollback.sql
```

After approval, apply the migration, configure local credentials, use an authorized account and approved or explicitly synthetic reference records, and verify the complete three-card story plus offline reload/reconnect. Interactive hazard mapping, automatic spatial preprocessing and live government integrations remain separate P1/P2 work.
