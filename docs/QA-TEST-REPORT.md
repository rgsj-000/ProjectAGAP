# Project AGAP QA Test Report

**Test date:** September 10, 2026  
**Environment:** Vercel deployment at `https://project-agap.vercel.app/` and local development environment  
**Test account:** Authorized LGU admin account supplied for QA  
**Report status:** Regression testing complete; authenticated write-workflow acceptance remains partial

## 1. Objective

Validate the main public and LGU workflows, record failures encountered during testing, verify the production fix for the public preparedness API, and document the remaining acceptance-test limitations.

## 2. Scope

- Public landing page and household preparedness page
- Public preparedness API, including barangay-specific lookup
- LGU authentication and protected-route behavior
- Operations dashboard navigation
- Preparedness assessment screen
- Damage and Needs reporting screen
- Post-impact review screen
- Automated domain and integration checks for persistence, authorization, synchronization, and post-impact calculations

## 3. Test results

| ID     | Test case                                                                  | Environment              | Result             | Notes                                                                                                                                                                         |
| ------ | -------------------------------------------------------------------------- | ------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-001 | Open public landing page                                                   | Production               | PASS               | Page loaded successfully.                                                                                                                                                     |
| QA-002 | Open household preparedness page                                           | Production               | PASS               | Public household flow loaded successfully.                                                                                                                                    |
| QA-003 | Request public preparedness data                                           | Production               | PASS after fix     | Route previously returned HTTP 500; it now returns HTTP 200 with fallback-safe behavior.                                                                                      |
| QA-004 | Request preparedness data for `Dalahican`                                  | Production               | PASS after fix     | Barangay-aware request returned successfully.                                                                                                                                 |
| QA-005 | Access protected barangay API without authentication                       | Production               | PASS               | Request was rejected with HTTP 401, confirming the auth boundary.                                                                                                             |
| QA-006 | Log in as LGU admin and open dashboard                                     | Production browser       | PASS               | Dashboard displayed `Lucena City · admin`.                                                                                                                                    |
| QA-007 | Open Preparedness module                                                   | Production browser       | PASS               | Assessment form rendered, including hazard, methodology, evidence, confidence, and save controls.                                                                             |
| QA-008 | Open Damage & Needs module                                                 | Production browser       | PASS               | Field-report form rendered with severity, affected-person counts, service conditions, needs, source, and evidence fields.                                                     |
| QA-009 | Open Post Impact module                                                    | Production browser       | PASS               | Consolidation screen rendered with report loading, rationale, non-overlap confirmation, and card-generation controls.                                                         |
| QA-010 | Run unit/domain test suite                                                 | Local                    | PASS               | Latest recorded run: 31 tests across 9 files. Earlier baseline run: 32 tests across 10 files.                                                                                 |
| QA-011 | Validate production build and TypeScript                                   | Local                    | PASS               | Build and type checks passed during implementation verification.                                                                                                              |
| QA-012 | Validate workflow persistence and authorization                            | Database rollback checks | PASS               | Idempotent retry, changed-payload conflict, reviewer verification, action persistence, audit creation, and anonymous-write denial passed; fixtures were rolled back.          |
| QA-013 | Submit a complete report and generate an action card from the live browser | Production browser       | NOT FULLY VERIFIED | Screens loaded, but a complete authenticated write-and-readback workflow was not conclusively demonstrated in the recorded session.                                           |
| QA-014 | Create advisory with attachment and all fields populated                   | Production browser       | PARTIAL PASS       | PNG attachment, metadata, message, and two directives were accepted; the form remained on `Saving...` without feedback, although the advisory appeared later as `UNVERIFIED`. |
| QA-015 | Generate post-impact card with no selected reports                         | Production browser       | FAIL               | The request returned HTTP 422 and only the generic alert `Request validation failed.`; the empty-report state did not prevent submission.                                     |
| QA-016 | Submit complete Damage & Needs report and load it for consolidation        | Production browser       | PASS               | All text, numeric, needs, evidence, and synthetic-report inputs were populated; one pending report synchronized and appeared as `UNVERIFIED`.                                 |
| QA-017 | Generate post-impact card from selected report                             | Production browser       | PASS               | Card generated with reported/validated separation, pending-validation totals, all reported needs, and a recommended validation action.                                        |
| QA-018 | Generate LGU Action Card from saved preparedness assessment                | Production browser       | FAIL               | Request returned HTTP 404 with `Cannot coerce the result to a single JSON object`; no LGU card was displayed.                                                                 |
| QA-019 | Record assigned-action decision with reason                                | Production browser       | PASS with delay    | Decision saved successfully, but the UI showed `Working...` and disabled controls until navigation/refetch completed.                                                         |

## 4. Defects and corrective actions

### DEF-001: Public preparedness API returned HTTP 500

**Severity:** High  
**Status:** Fixed and revalidated

The public route assumed that live barangay and advisory data would always be present and valid. A missing record or schema/data mismatch caused the handler to throw, which made the public household flow unavailable in production.

The route was hardened to use demo-safe fallback values when source queries or advisory retrieval fail. A regression test was also added to prove that the route returns a successful response instead of propagating the database failure.

### DEF-002: Local development port conflict

**Severity:** Low  
**Status:** Worked around during testing

Port 3000 was already in use during some local sessions. Testing continued on the available local development port and on the deployed Vercel environment.

### DEF-003: Authenticated browser write workflow not fully proven

**Severity:** Medium
**Status:** Open QA limitation

The dashboard and its forms rendered correctly, but the recorded QA evidence does not conclusively prove the full sequence of submitting a live report, synchronizing it, reviewing it, and reading back a generated action card from production.

This is an acceptance-test gap, not evidence that the underlying workflow is broken. The repository contains rollback-only checks for the server-side transaction and authorization behavior.

### DEF-004: Advisory save has no completion feedback

**Severity:** Medium
**Status:** Open

After every advisory field was populated and a valid PNG attachment was selected, the Save advisory button stayed on `Saving...` and the form did not close or show a success/error result. The advisory was eventually persisted and appeared as `UNVERIFIED` after leaving the form, so the defect is misleading or missing completion feedback and potentially an overly long request state.

### DEF-005: Empty post-impact submission reaches API validation error

**Severity:** Medium
**Status:** Open

With no reports selected, a filled consolidation rationale, and the non-overlap confirmation checked, Generate Post Impact Action Card submitted anyway. The server returned HTTP 422 and the UI showed only `Request validation failed.` The button should be blocked until at least one report is selected, with a field-level explanation.

### DEF-006: LGU action-card generation returns backend 404

**Severity:** High
**Status:** Open

After a complete preparedness assessment and exposure estimate were saved, Generate LGU Action Card returned HTTP 404 with `Cannot coerce the result to a single JSON object`. The user received no card and no actionable recovery guidance. The related assigned-action decision endpoint did save successfully.

### DEF-007: Long-running writes provide misleading `Working...` state

**Severity:** Medium
**Status:** Open

Advisory save, exposure/assessment save, report synchronization, post-impact generation, and decision recording all temporarily showed `Working...` or `Syncing` with disabled controls. Several later completed successfully, but the intermediate state gave no progress, timeout, or retry affordance. This makes successful writes look stalled and increases the risk of duplicate retries.

## 5. Historical progression

1. Initial exploration covered the public household flow, LGU dashboard, and candidate sample inputs.
2. Production testing exposed the public preparedness HTTP 500.
3. The failure was traced to unguarded live-data assumptions in the public route.
4. Fallback handling and a regression test were implemented.
5. Production retesting confirmed successful responses for the public pages and preparedness API.
6. The authenticated dashboard was retested, and Preparedness, Damage & Needs, and Post Impact all loaded.
7. Automated and rollback-only checks confirmed the core server-side workflow invariants.

## 6. Overall assessment

**Release confidence: Conditional pass for the tested surface; LGU action-card generation remains blocked by a production defect.**

The production public flow is healthy after the fix, protected routes enforce authentication, and the main LGU modules are reachable. The post-impact card can be generated from a complete synthetic report, but preparedness LGU action-card generation currently fails with HTTP 404. Resolve DEF-006 and the delayed-write feedback issues before declaring full operational acceptance.

## 7. Recommended follow-up acceptance test

1. Create or select an explicitly synthetic advisory and matching assessment for one barangay.
2. Generate and save an LGU action card.
3. Submit a synthetic Damage & Needs report with known values, such as 10 affected persons and 4 households.
4. Confirm the report is first marked Pending Sync and Unverified.
5. Synchronize and verify the report as an authorized reviewer.
6. Consolidate the report without double-counting.
7. Confirm post-impact output preserves reported and validated totals and calculates awaiting validation correctly.
8. Reload the dashboard and confirm the saved records and audit trail remain available.
