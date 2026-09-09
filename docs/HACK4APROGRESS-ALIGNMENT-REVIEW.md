# Hack4AProgress documentation-to-app review

Reviewed: September 9, 2026. Scope: the current local working tree, including existing uncommitted changes. This is a source-code and requirements review, not a deployed-system acceptance test. No application code was changed.

## Conclusion

The app reflects the proposed navigation, three-card lifecycle, privacy approach, and deterministic engine architecture. It does **not yet implement the documented end-to-end demonstration**. Most operational screens still receive mock, empty, or local-only data even though corresponding server routes and client helpers exist. Backend correctness and verification gaps also need attention before connecting those routes.

## Source documents

- [Concept submission](../Hack4AProgress/ConceptSolutionSubmission_ByteMeMaybe_ProjectAGAP.docx): original scope, Track 03 alignment, six-module demo, success measures.
- [Technical Build Blueprint](../Hack4AProgress/ProjectAGAP.docx): detailed product behavior, three cards, offline continuity, P0/P1/P2 priorities, demo sequence.
- [AGAP V2 backend requirements](../Hack4AProgress/AGAP-V2.docx): schema, deterministic engines, APIs, authorization, verification, synchronization, testing.

The blueprint narrows the original Quezon Province pilot to Lucena City. These scopes are compatible. Backend route existence is counted as partial implementation, not proof that a user can complete the workflow. P1/P2 items are distinguished from missing P0 behavior.

## Requirements coverage

| Documented capability | Current evidence | Assessment |
| --- | --- | --- |
| Next.js/TypeScript, Supabase, deterministic services | Dependencies, route handlers, domain engines, migrations | Reflected in code; live deployment/database not verified |
| Verified advisory intake | Create/update/verify APIs exist; dashboard form has no save callback | Backend partial; app workflow incomplete |
| Risk = likelihood × severity; optional threat ÷ capacity | Versioned methodology lookup and pure risk engine with tests | Calculation implemented; operational screen not connected |
| Exposure estimates and capacity gaps | Engines and APIs exist; LGU screen passes null exposure/capacity values | Backend partial; output not reflected on screen |
| LGU Action Card with evidence and approved actions | Component exists; parent supplies empty recommendations and missing values | Structure reflected; functional output incomplete |
| Public household access without names/addresses | Public page and three modes exist; backend performs pseudonymous lookup | Privacy and entry modes reflected; public generators use local demo logic |
| Approved, traceable recommendations | Backend rule engine includes rule/source metadata | Implemented in backend; public demo bypasses the library |
| Filipino/English outputs | Bilingual interface and local household text | Partial; backend household language field does not translate rule text |
| Damage and needs intake | Forms and create APIs exist | Submit button only updates React state; no persisted app submission |
| Reported versus validated post-impact totals | Schema and card fields exist | Route-to-generator naming defect; screen also receives null impacts |
| Human review, assignment, defer/override with audit | Auth, RLS migrations, action-update route and audit helper | Backend partial; screen callbacks absent; validation/consolidation flow incomplete |
| Offline cards, cached rules, durable pending reports (P0) | IndexedDB helper and offline-data API exist | Helpers unused by screens; no service worker or operational cache read path found |
| Connectivity, last sync, advisory freshness (P0) | Connectivity component supports named states | Browser connectivity detected; real sync/freshness metadata not connected |
| Automatic sync and conflict UI (P1) | Sync and conflict APIs exist | No reconnect orchestration or conflict-resolution screen found |
| Preparedness brief | Dedicated screen exists | Placeholder; no generated brief workflow found |
| Printable/exportable continuity materials (P1) | Three card components use browser print | Partial; no assembled Barangay Offline Operations Pack found |
| Interactive hazard map / added spatial methods (P1) | Spatial schema and numeric exposure-method inputs | No interactive map found; no raster/building intersection pipeline found |
| Live government integration and notifications (P2) | No working integration found in app | Deferred scope; not a P0 failure |

## Priority findings

### 1. Critical integration gap: screens do not call the operational APIs

`src/components/modules/ModulePlaceholder.tsx` imports mock barangays/advisory. The advisory form receives `onCancel` but no `onSave` (around lines 106–120). The LGU card receives null exposure/capacity fields and `recommendations={[]}` (around lines 770–812). The post-impact card receives `observedImpacts={null}` and `actions={[]}` (around line 1816). `src/lib/client/api.ts` defines suitable helpers, but searches found no consumers of those helpers in the screens.

**Impact:** the documented advisory → assessment → LGU card → post-impact demo cannot currently be completed through the application.

**Acceptance:** save an advisory, verify it as an authorized reviewer, calculate an assessment, and display the persisted results and matched rules for the same barangay/event after reload.

### 2. Critical persistence gap: “Save as Pending Sync” does not save the report

The report handler in `ModulePlaceholder.tsx` around line 1736 only creates an ID/timestamp and updates component state. It does not call the damage/needs APIs or `queueFieldReport`. The UI itself acknowledges that the report can disappear on reload.

**Impact:** the blueprint's explicit requirement that an offline report survive reload is unmet; report submission also does not drive subsequent review records.

**Acceptance:** persist the full damage/needs payload, reload offline, find the report still pending and unverified, reconnect, synchronize once, then verify it through an authorized workflow.

### 3. High: post-impact population totals become zero

Both `src/app/api/post-impact/route.ts` and `src/app/api/post-impact/by-barangay/route.ts` construct `reportedPopulation` and `validatedPopulation`. `generatePostImpactActionCard` in `src/lib/domain/actionCards.ts` reads `reportedAffectedPersons` and `validatedAffectedPersons`, defaulting each to zero. It recomputes awaiting-validation population from those incorrect zeros.

The existing test named “keeps reported and validated facts distinct” supplies 10 reported and 4 validated but only asserts that there is no `recoveryScore`; it does not check population values.

**Acceptance:** a review with 10 reported and 4 validated persons returns 10, 4, and 6 awaiting validation through each API path. Also preserve the documented household and impact fields in the output.

### 4. High: an unverified mock advisory is presented as officially verified

`src/lib/mock-data.ts` marks the current advisory `UNVERIFIED`. `src/components/advisory/AdvisoryModal.tsx` around line 94 nevertheless always displays “Official advisory verified by Lucena CDRRMO Operations Center.”

**Impact:** directly contradicts the documentation's source-fidelity and verification-state requirements.

**Acceptance:** render verification claims only from the actual record and authorized verification metadata; make synthetic status consistent across the dashboard, modal, and public page.

### 5. High: household modes bypass the backend rule library

`src/components/public/PublicHouseholdView.tsx` generates local cards. Household-code mode deliberately returns a pending-lookup description rather than retrieving the profile. Quick-profile mode builds actions with `blueprint-trigger-*` IDs, and generic mode returns a confirmation action instead of database-approved general rules. It uses the mock advisory rather than the current verified record.

The backend endpoint supports the three modes, but `generateHouseholdCard` merely sets `languageLabel`; action titles and explanations are copied unchanged from stored rules. Connecting this endpoint alone will not fulfill Filipino/English output requirements.

**Acceptance:** use real or explicitly synthetic approved rule records for all modes, confirm profile lookup, preserve rule IDs/sources, and verify both language outputs. Offline generation must use previously cached approved inputs.

### 6. High: advisory and assessment records can be mixed across contexts

`src/app/api/action-cards/lgu/route.ts` selects the newest verified, unexpired advisory globally, without filtering affected barangay or validity start. It independently selects the newest barangay risk assessment without matching that assessment to the chosen advisory. The offline-data route similarly omits advisory barangay/start filtering. Risk creation checks verification and expiry but not start time or affected barangay.

**Impact:** a card can associate a locality or assessment with an unrelated or not-yet-effective advisory. The household repository already provides a more complete locality-and-validity query.

**Acceptance:** select one consistent barangay/event/hazard context and preserve the adopted methodology source/version, evidence dates, confidence, and limitations in the final card. Currently the LGU route drops several of these risk metadata fields.

### 7. High: AI input is labeled verified without server-side provenance checks

`src/app/api/ai/route.ts` accepts an arbitrary client `verifiedInput` object after login and forwards it to Gemini. It does not retrieve the source records or establish their verification status. Wording is schema-checked and filtered, but this is not validation that every fact or measurement came from an authoritative record. The route also has no screen consumer.

**Acceptance:** accept source/output IDs, retrieve authorized verified inputs server-side, constrain wording to their facts/actions, and provide a usable deterministic template on AI failure.

### 8. High: “validated water need” is inferred from a text substring

Both post-impact routes derive `waterNeedValidated` from whether `urgent_unmet_needs` contains “water,” without checking a validated needs record. Negated or unverified text can therefore activate a validated-need trigger.

**Acceptance:** derive validated needs from explicit authorized verification fields and corresponding evidence, keeping unverified reports separate.

### 9. High: offline and human-review flows remain disconnected

`src/lib/client/offlineQueue.ts` has an IndexedDB queue and cache-write helper, but no app consumers were found. There is no service-worker registration/application shell cache, cached-pack retrieval, or cached rule-based card generation. `ConnectivityStatus` defaults to ONLINE/OFFLINE from the browser; it does not calculate expiry from advisory validity. Screens supply empty synchronization metadata.

LGU controls are disabled when callbacks are absent, and the parent does not supply validate/assign/modify/defer/override handlers. The action update endpoint expects an existing `operational_actions` record; card generation does not create those records. Damage/needs creation routes exist, but no complete report-validation and review-consolidation route workflow was found.

**Acceptance:** implement and demonstrate durable offline continuity plus reviewer-controlled validation, action creation/assignment, status changes, reasoned overrides, and audit readback. Treat auto-reconnect and a richer conflict UI as the documented P1 work.

## What is already aligned

- The risk calculation is deterministic and separate from Gemini; methodology scales and category thresholds come from records.
- Exposure outputs use estimate terminology and method/confidence metadata; the capacity engine frames shortfalls as requiring review.
- The backend action-rule engine provides traceability, active-rule filtering, and deterministic matching.
- Public household input does not require names or exact residential addresses.
- Post-impact design avoids an arbitrary recovery score.
- Role checks, RLS migrations, override-reason enforcement, audit helpers, sync conflict logic, and synthetic seed labels provide useful foundations. Their existence is not evidence that the deployed database has been fully verified.

## Verification and limits

- `npm run test`: **8 test files, 26 tests passed**.
- `npm run typecheck`: **passed**.
- Reviewed document text, components, helpers, domain engines, relevant routes, and schema/policy files. Document visual layout was not part of this review.
- Did not start a dev server, perform browser acceptance testing, mutate remote data, verify deployed RLS, or claim live Gemini/Supabase availability.
- Existing tests concentrate on isolated functions. Passing results do not establish source-to-screen integration, report durability, authorization across live APIs, or the full three-minute demonstration.

## Recommended implementation order

1. Correct verification claims, post-impact field mapping, validated-need derivation, and advisory/context matching.
2. Connect one complete online path: advisory intake and review → assessment/exposure/capacity → LGU card → household card → persisted damage/needs → validated post-impact card.
3. Complete operational action persistence, reviewer controls, and audit readback.
4. Deliver P0 offline cache/read/reload behavior, durable pending reports, deterministic fallback, and accurate freshness metadata.
5. Finish the sourced preparedness brief and bilingual rule-based output; then add P1 printing/offline-pack and conflict/reconnect improvements.
6. Verify the documented demo end to end with explicit assertions on persisted values, source/rule traceability, permissions, reload behavior, and reported-versus-validated totals.
