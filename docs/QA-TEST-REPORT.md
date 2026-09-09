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

| ID     | Test case                                                                  | Environment              | Result             | Notes                                                                                                                                                                |
| ------ | -------------------------------------------------------------------------- | ------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-001 | Open public landing page                                                   | Production               | PASS               | Page loaded successfully.                                                                                                                                            |
| QA-002 | Open household preparedness page                                           | Production               | PASS               | Public household flow loaded successfully.                                                                                                                           |
| QA-003 | Request public preparedness data                                           | Production               | PASS after fix     | Route previously returned HTTP 500; it now returns HTTP 200 with fallback-safe behavior.                                                                             |
| QA-004 | Request preparedness data for `Dalahican`                                  | Production               | PASS after fix     | Barangay-aware request returned successfully.                                                                                                                        |
| QA-005 | Access protected barangay API without authentication                       | Production               | PASS               | Request was rejected with HTTP 401, confirming the auth boundary.                                                                                                    |
| QA-006 | Log in as LGU admin and open dashboard                                     | Production browser       | PASS               | Dashboard displayed `Lucena City · admin`.                                                                                                                           |
| QA-007 | Open Preparedness module                                                   | Production browser       | PASS               | Assessment form rendered, including hazard, methodology, evidence, confidence, and save controls.                                                                    |
| QA-008 | Open Damage & Needs module                                                 | Production browser       | PASS               | Field-report form rendered with severity, affected-person counts, service conditions, needs, source, and evidence fields.                                            |
| QA-009 | Open Post Impact module                                                    | Production browser       | PASS               | Consolidation screen rendered with report loading, rationale, non-overlap confirmation, and card-generation controls.                                                |
| QA-010 | Run unit/domain test suite                                                 | Local                    | PASS               | Latest recorded run: 31 tests across 9 files. Earlier baseline run: 32 tests across 10 files.                                                                        |
| QA-011 | Validate production build and TypeScript                                   | Local                    | PASS               | Build and type checks passed during implementation verification.                                                                                                     |
| QA-012 | Validate workflow persistence and authorization                            | Database rollback checks | PASS               | Idempotent retry, changed-payload conflict, reviewer verification, action persistence, audit creation, and anonymous-write denial passed; fixtures were rolled back. |
| QA-013 | Submit a complete report and generate an action card from the live browser | Production browser       | NOT FULLY VERIFIED | Screens loaded, but a complete authenticated write-and-readback workflow was not conclusively demonstrated in the recorded session.                                  |

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

## 5. Historical progression

1. Initial exploration covered the public household flow, LGU dashboard, and candidate sample inputs.
2. Production testing exposed the public preparedness HTTP 500.
3. The failure was traced to unguarded live-data assumptions in the public route.
4. Fallback handling and a regression test were implemented.
5. Production retesting confirmed successful responses for the public pages and preparedness API.
6. The authenticated dashboard was retested, and Preparedness, Damage & Needs, and Post Impact all loaded.
7. Automated and rollback-only checks confirmed the core server-side workflow invariants.

## 6. Overall assessment

**Release confidence: Conditional pass for the tested surface.**

The production public flow is healthy after the fix, protected routes enforce authentication, and the main LGU modules are reachable. Before declaring full operational acceptance, complete one controlled authenticated production workflow using synthetic data and verify the persisted report, reviewer action, generated card, audit record, and post-impact totals after reload.

## 7. Recommended follow-up acceptance test

1. Create or select an explicitly synthetic advisory and matching assessment for one barangay.
2. Generate and save an LGU action card.
3. Submit a synthetic Damage & Needs report with known values, such as 10 affected persons and 4 households.
4. Confirm the report is first marked Pending Sync and Unverified.
5. Synchronize and verify the report as an authorized reviewer.
6. Consolidate the report without double-counting.
7. Confirm post-impact output preserves reported and validated totals and calculates awaiting validation correctly.
8. Reload the dashboard and confirm the saved records and audit trail remain available.
