# Project AGAP QA Test Report

**Test date:** September 10, 2026  
**Environment:** Vercel deployment at `https://project-agap.vercel.app/` and local development environment  
**Test account:** Authorized LGU admin account supplied for QA  
**Report status:** Full regression and authenticated workflow QA executed; release remains conditional on open integration defects

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

| ID     | Test case                                                                  | Environment              | Result          | Notes                                                                                                                                                                           |
| ------ | -------------------------------------------------------------------------- | ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-001 | Open public landing page                                                   | Production               | PASS            | Page loaded successfully.                                                                                                                                                       |
| QA-002 | Open household preparedness page                                           | Production               | PASS            | Public household flow loaded successfully.                                                                                                                                      |
| QA-003 | Request public preparedness data                                           | Production               | PASS after fix  | Route previously returned HTTP 500; it now returns HTTP 200 with fallback-safe behavior.                                                                                        |
| QA-004 | Request preparedness data for `Dalahican`                                  | Production               | PASS after fix  | Barangay-aware request returned successfully.                                                                                                                                   |
| QA-005 | Access protected barangay API without authentication                       | Production               | PASS            | Request was rejected with HTTP 401, confirming the auth boundary.                                                                                                               |
| QA-006 | Log in as LGU admin and open dashboard                                     | Production browser       | PASS            | Dashboard displayed `Lucena City · admin`.                                                                                                                                      |
| QA-007 | Open Preparedness module                                                   | Production browser       | PASS            | Assessment form rendered, including hazard, methodology, evidence, confidence, and save controls.                                                                               |
| QA-008 | Open Damage & Needs module                                                 | Production browser       | PASS            | Field-report form rendered with severity, affected-person counts, service conditions, needs, source, and evidence fields.                                                       |
| QA-009 | Open Post Impact module                                                    | Production browser       | PASS            | Consolidation screen rendered with report loading, rationale, non-overlap confirmation, and card-generation controls.                                                           |
| QA-010 | Run unit/domain test suite                                                 | Local                    | PASS            | Latest recorded run: 31 tests across 9 files. Earlier baseline run: 32 tests across 10 files.                                                                                   |
| QA-011 | Validate production build and TypeScript                                   | Local                    | PASS            | Build and type checks passed during implementation verification.                                                                                                                |
| QA-012 | Validate workflow persistence and authorization                            | Database rollback checks | PASS            | Idempotent retry, changed-payload conflict, reviewer verification, action persistence, audit creation, and anonymous-write denial passed; fixtures were rolled back.            |
| QA-013 | Submit a complete report and generate an action card from the live browser | Production browser       | PARTIAL PASS    | Complete synthetic report saved and synchronized; post-impact card generated and action decision saved. Reviewer verification was blocked by the browser `prompt()` limitation. |
| QA-014 | Create advisory with attachment and all fields populated                   | Production browser       | PARTIAL PASS    | PNG attachment, metadata, message, and two directives were accepted; the form remained on `Saving...` without feedback, although the advisory appeared later as `UNVERIFIED`.   |
| QA-015 | Generate post-impact card with no selected reports                         | Production browser       | FAIL            | The request returned HTTP 422 and only the generic alert `Request validation failed.`; the empty-report state did not prevent submission.                                       |
| QA-016 | Submit complete Damage & Needs report and load it for consolidation        | Production browser       | PASS            | All text, numeric, needs, evidence, and synthetic-report inputs were populated; one pending report synchronized and appeared as `UNVERIFIED`.                                   |
| QA-017 | Generate post-impact card from selected report                             | Production browser       | PASS            | Card generated with reported/validated separation, pending-validation totals, all reported needs, and a recommended validation action.                                          |
| QA-018 | Generate LGU Action Card from saved preparedness assessment                | Production browser       | FAIL            | Dalahican assessment loaded with verified capacity, but clicking Generate LGU Action Card produced no card or useful completion/error feedback in the deployed UI.              |
| QA-019 | Record assigned-action decision with reason                                | Production browser       | PASS with delay | Decision saved successfully, but the UI showed `Working...` and disabled controls until navigation/refetch completed.                                                           |
| QA-020 | Generate LGU Action Card for seeded capacity-bearing barangays             | Production browser       | PASS            | With `DEMO-BULLETIN-001 — VERIFIED`, cards generated successfully for Dalahican, Cotta, Barra, Gulang-gulang, and Ibabang Dupay.                                                |
| QA-021 | Generate LGU Action Card for Barangay 1 without capacity                   | Production browser       | PASS            | The selected Barangay 1 assessment showed missing capacity and the Generate LGU Action Card control was disabled with an explanatory prerequisite message.                      |
| QA-022 | Sign in with authorized LGU admin credentials                              | Production browser       | PASS            | Admin session established and dashboard loaded as `Lucena City · admin`; freshness state and advisory selectors rendered.                                                       |
| QA-023 | Review advisory intake and reviewer controls                               | Production browser       | PASS            | Existing verified and unverified advisories loaded with source, geographic applicability, evidence, verify, and return-for-correction controls.                                 |
| QA-024 | Generate public general household card                                     | Production browser/API   | PARTIAL PASS    | Direct API returned HTTP 201 with verified advisory, rule ID, source, and limitation; the public UI did not render the card or show a useful error after submission.            |
| QA-025 | Save a complete Damage & Needs report with every field populated           | Production browser       | PASS            | Incident, summary, severity, all five numeric fields, facility/access/services, all six needs, source, evidence, and synthetic marker were populated; save reported success.    |
| QA-026 | Load post-impact reports and enforce empty-selection validation            | Production browser       | FAIL            | Report loaded correctly, but rationale plus non-overlap confirmation with no selected report still submitted and returned HTTP 422 with generic `Request validation failed.`    |
| QA-027 | Generate post-impact card from selected unverified report                  | Production browser       | PASS            | Card displayed 10 reported persons, 0 validated, 10 pending validation, 4 households, vulnerable-group totals, all six needs, and the validation action rule.                   |
| QA-028 | Record assigned-action decision with responsible unit and reason           | Production browser       | PASS with delay | Responsible unit, `ASSIGNED` status, and reason saved; UI showed `Working...` before confirming `Saved successfully.`                                                           |
| QA-029 | Verify report and linked needs as reviewer                                 | Production browser       | FAIL            | Reviewer button invoked `prompt()`; deployed browser reported `prompt() is not supported.` and left the report `UNVERIFIED`.                                                    |

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
**Status:** Improved locally; browser retest required

After every advisory field was populated and a valid PNG attachment was selected, the Save advisory button stayed on `Saving...` and the form did not close or show a success/error result. Shared operation feedback and a 30-second client timeout are now implemented; production browser retesting is still required.

### DEF-005: Empty post-impact submission reaches API validation error

**Severity:** Medium
**Status:** Fixed locally; deployment and browser retest required

With no reports selected, a filled consolidation rationale, and the non-overlap confirmation checked, Generate Post Impact Action Card submitted anyway. The submit handler now blocks the request and reports that at least one report must be selected.

### DEF-006: LGU action-card generation returns backend 404

**Severity:** High
**Status:** Guard deployed and revalidated for the missing-capacity path

For Barangay 1, the dashboard had no preparedness-capacity row but still allowed generation. The API used Supabase `.single()`, so the missing row surfaced as HTTP 404 with `Cannot coerce the result to a single JSON object`. The UI now disables generation without validated capacity, and the API uses `maybeSingle()` with an explicit prerequisite error. The current production browser confirms this guard. A separate capacity-bearing Dalahican generation failure remains open.

### DEF-007: Long-running writes provide misleading `Working...` state

**Severity:** Medium
**Status:** Improved locally; deployment and browser retest required

Advisory save, exposure/assessment save, report synchronization, post-impact generation, and decision recording previously showed only generic `Working...` or `Syncing` states. Operation-specific labels and a shared 30-second timeout are now implemented.

### DEF-008: Public household card is not rendered after successful API response

**Severity:** High
**Status:** Fixed locally; deployment and browser retest required

The direct public household-card request for Dalahican returned HTTP 201 with a verified advisory, approved rule `DEMO-HH-005`, source metadata, and limitations. The household UI now validates the response, preserves the returned actions, synchronizes its initial barangay selection after loading, and displays explicit success or error feedback.

### DEF-009: Reviewer verification depends on unsupported browser prompt

**Severity:** High
**Status:** Fixed locally; deployment and browser retest required

Selecting Verify report & linked needs previously invoked `prompt()`. The workflow now uses an in-page reason dialog with minimum-length validation. Conflict resolution uses the same dialog instead of a browser prompt.

## 5. Historical progression

1. Initial exploration covered the public household flow, LGU dashboard, and candidate sample inputs.
2. Production testing exposed the public preparedness HTTP 500.
3. The failure was traced to unguarded live-data assumptions in the public route.
4. Fallback handling and a regression test were implemented.
5. Production retesting confirmed successful responses for the public pages and preparedness API.
6. The authenticated dashboard was retested, and Preparedness, Damage & Needs, and Post Impact all loaded.
7. Automated and rollback-only checks confirmed the core server-side workflow invariants.

## 6. Overall assessment

**Release confidence: Conditional pass for the tested surface; the open issues are fixed in the local workspace but still require deployment and production browser retesting.**

The production health and public preparedness APIs are healthy, protected routes enforce authentication, and the authenticated persistence path passed. Local fixes now cover household-card rendering feedback, reviewer verification, empty post-impact validation, operation-specific progress, timeout handling, and incomplete LGU card responses. Deploy and rerun the browser acceptance matrix before release.

## 7. Recommended follow-up acceptance test

1. Create or select an explicitly synthetic advisory and matching assessment for one barangay.
2. Generate and save an LGU action card.
3. Submit a synthetic Damage & Needs report with known values, such as 10 affected persons and 4 households.
4. Confirm the report is first marked Pending Sync and Unverified.
5. Synchronize and verify the report as an authorized reviewer.
6. Consolidate the report without double-counting.
7. Confirm post-impact output preserves reported and validated totals and calculates awaiting validation correctly.
8. Reload the dashboard and confirm the saved records and audit trail remain available.
