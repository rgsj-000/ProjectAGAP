# Real Application Entry and Operations Design

## Purpose

Project AGAP will present its real production workflow to judges without a simulated frontend. The application will retain its existing Supabase-backed records, authenticated APIs, deterministic risk/exposure/capacity engines, approved action-rule matching, persisted generated outputs, constrained Gemini wording, human decisions, and audit trail.

The end-to-end trust path remains:

```text
Supabase
  -> verified advisory
  -> deterministic risk / exposure / capacity
  -> approved action-rule engine
  -> persisted LGU Action Card
  -> Gemini explanation or operational brief
  -> human decision
  -> audit
```

Prepared demonstration records are permitted only as clearly labeled database data. The browser must not substitute mock records, simulated roles, calculated results, or invented actions for the real pipeline.

## Entry Points and Authentication

`/` becomes the public Project AGAP entry point. It presents two clear paths:

- **Authorized Personnel** links to `/login` and describes access to LGU operational decision support.
- **Household Preparedness** links to `/household` and describes public access to approved household guidance.

The public entry point must not call `/api/operations` and must not render the authenticated application shell.

`/operations` becomes the sole route for the authenticated operational shell. The client may show a loading state while it requests `/api/operations`; an unauthenticated response sends the user to `/login` instead of presenting retry controls as if authentication were a connectivity problem. After a successful Supabase password sign-in, `/login` redirects to `/operations`. The auth callback also resolves authenticated users to `/operations` unless an explicitly validated safe return path is supported.

`/household` remains public and continues to generate cards through `POST /api/households/action-card` using real approved action rules. It does not depend on the operational session.

## Authorization and Role-Derived Interface

The interface derives role and scope exclusively from the authenticated `user_profiles` record returned by `/api/operations`. Client navigation state may track the selected module, but it may not grant, simulate, or override a role.

The visible **Simulate User View** control and all public/field/barangay demo-role switching are removed from the judging experience. The profile area shows the real role and assigned barangay, when present. Navigation availability is derived from the returned role:

- `field_reporter`: assigned-barangay overview and Damage & Needs submission/synchronization.
- `lgu_encoder`: intake and data-entry workflows allowed by the server, scoped to an assigned barangay when the profile contains one.
- `lgu_reviewer`: validation, action-card generation, action assignment, post-impact consolidation, and audit review.
- `admin`: the full authorized operational interface.

The role vocabulary is the deployed schema vocabulary: `admin | lgu_reviewer | lgu_encoder | field_reporter`. `assigned_barangay_id` narrows the records and selectors shown to a user; it does not create an additional browser-only role.

These client distinctions improve usability only. Every mutation remains protected by existing server authorization and Supabase RLS.

## Operational Workspace

`OperationalWorkspace` remains the primary authenticated implementation. It will be refactored, not replaced with a parallel demo workspace.

Its home module becomes a decision dashboard backed by the records returned from `/api/operations`. The API response will include the profile information and the workflow records necessary to summarize the current situation, including pending damage/needs validation and persisted operational outputs/actions where needed. The dashboard derives and displays:

- the latest currently valid verified advisory, with source, issue time, validity, and affected scope;
- priority barangays ranked from current verified risk assessments, with deterministic risk category and score where available;
- estimated exposed persons and households from `population_exposure_estimates`, labeled as estimates with method, confidence, and reference date;
- possible capacity gaps computed from validated capacity records and exposure estimates, labeled as possible gaps rather than confirmed shortages;
- reports awaiting authorized validation, preserving their `UNVERIFIED` state;
- outstanding human decisions or assignments associated with persisted action cards.

The dashboard does not silently calculate new assessments or generate cards on load. Missing, stale, unverified, or incomparable records appear as explicit data gaps. Selection and ranking logic will be implemented as pure tested selectors so the UI cannot turn incomplete data into false certainty.

All existing implementor workflows remain reachable through role-scoped navigation:

1. advisory intake and verification;
2. methodology and approved action-rule maintenance;
3. preparedness assessment;
4. exposure estimate entry;
5. validated capacity records;
6. LGU Action Card generation;
7. Damage & Needs reporting;
8. validation and synchronization/conflict handling;
9. post-impact consolidation;
10. action assignment and decision recording;
11. audit review.

Forms may remain in `OperationalWorkspace` during this pass, but the default home module must be decision-first rather than form-first.

## LGU Action Card and Gemini

The existing `LGUActionCard` is strengthened as the central evidence artifact. Its primary view must make the following trace visible without requiring judges to infer it:

```text
Likelihood × Severity -> Risk
```

The card also shows:

- methodology name, version, source, and assessment date;
- exposure persons/households, estimation method, confidence, source, and reference date;
- validated capacity and the possible capacity gap;
- evidence supporting the assessment;
- limitations and missing information;
- matched action-rule IDs and sources;
- recommended action text and trigger;
- responsible unit or an explicit unassigned state;
- current action status;
- the requirement for authorized human confirmation.

The persisted `outputId` remains the only client input identifying material for Gemini. The generated-card surface provides two separate controls:

- **Explain Assessment** requests `/api/ai` with `mode: "explain"`.
- **Generate Operational Brief** requests `/api/ai` with `mode: "brief"`.

Both responses are visually subordinate to the deterministic card and clearly labeled as AI-generated wording from a persisted verified source snapshot. AI may explain, simplify, translate, or summarize. It may not calculate risk, change exposure or capacity, match rules, invent recommendations, validate reports, or make the human decision. If Gemini is unavailable or rejects output, the deterministic card remains usable and the interface states that AI wording is unavailable.

## Damage, Needs, and Post-Impact Lifecycle

Damage & Needs and Post Impact present one continuous, explicit lifecycle:

```text
UNVERIFIED report
  -> synchronization or conflict review
  -> authorized review
  -> VALIDATED report and linked needs
  -> non-overlapping consolidation
  -> rule-derived post-impact actions
  -> assignment / confirmation / audit
```

Submission screens state that field reports are observations and remain unverified. Review screens show reported values beside validated values and require evidence for validation. Consolidation accepts only validated reports, preserves reported and validated totals separately, and requires reviewers to confirm that selected populations do not overlap. Generated post-impact actions retain rule IDs, evidence, responsible units, confirmation requirements, and status. Transitions and decision reasons remain auditable.

## Data and Error Handling

- Supabase remains the source of truth; no production component imports mock operational data.
- Current-advisory selection requires `VERIFIED` status and a validity window containing the current time.
- Dashboard selectors tolerate empty tables and nullable legacy fields and return explicit unavailable states.
- Unauthorized operational loads redirect to login; network failures and offline-cache use remain distinguishable from authentication failures.
- Offline snapshots retain their existing stale labeling and may not be presented as current verified state after expiry.
- Synthetic database records retain conspicuous demonstration labels and never appear as official disaster information.
- API and Supabase errors remain actionable and do not erase a previously available deterministic card.

## Component Boundaries

- `src/app/page.tsx`: public entry composition only.
- `src/app/operations/page.tsx`: authenticated application-shell entry.
- `src/app/login/page.tsx` and `src/app/auth/callback/route.ts`: authentication completion and redirect behavior.
- `src/components/public/*`: public gateway and household surfaces.
- `src/context/NavigationContext.tsx`: module navigation only, with no simulated identity.
- `src/components/layout/*`: role-derived navigation and real profile presentation.
- `src/app/api/operations/route.ts`: authenticated workspace payload including real profile and dashboard source records.
- `src/lib/domain/operationsDashboard.ts`: pure current-advisory, priority, exposure, gap, and pending-validation selectors.
- `src/components/modules/OperationalWorkspace.tsx`: existing workflow orchestration and module screens.
- `src/components/assessment/LGUActionCard.tsx`: deterministic evidence/action presentation.
- a focused client component adjacent to the LGU card: persisted-output Gemini controls for explanation and brief generation.
- existing report, post-impact, action, synchronization, and audit routes remain authoritative.

## Testing and Acceptance

Implementation follows test-driven development.

Automated tests must prove:

- current advisory selection excludes unverified, future, and expired records;
- priority ordering is deterministic and handles missing assessments;
- exposure and possible capacity-gap summaries preserve estimate/unknown semantics;
- pending validation counts include only the correct report state;
- role-to-navigation capabilities come from authenticated profile roles, not browser-selected identities;
- Gemini controls send only `outputId`, mode, and language;
- LGU card view models preserve methodology, evidence, limitations, rule IDs, units, and confirmation flags;
- report lifecycle presentation distinguishes reported, unverified, validated, and consolidated values.

Repository verification requires the full unit suite, TypeScript check, production build, and browser acceptance of `/`, `/login`, `/operations`, and `/household`. Authenticated browser verification requires configured Supabase credentials and an authorized test account; if unavailable, the handoff must state that limitation rather than claim end-to-end success.

Acceptance is complete when a judge can enter through `/`, authenticate as authorized personnel, see a database-backed decision overview, open the real operational workflows, generate a persisted deterministic LGU card, request either constrained Gemini explanation mode from that card, record a human decision, and trace it in audit—while a resident can independently use the real household endpoint.

## Out of Scope

- replacing Supabase or the existing server/domain pipeline;
- a fake demo workspace or browser-selected role simulation;
- Gemini calculation, recommendation generation, validation, or autonomous decisions;
- fabrication of government advisories, methodologies, approved rules, capacity, household records, or emergency contacts;
- automatic spatial preprocessing, interactive hazard mapping, or new external government integrations;
- applying unapplied remote migrations without separate authorization.
