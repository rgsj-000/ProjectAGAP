# Real Application Entry and Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Project AGAP's public entry, authenticated operations dashboard, LGU Action Card, Gemini wording controls, and post-impact lifecycle visibly use the existing real Supabase and deterministic decision pipeline.

**Architecture:** Keep the current API, domain engines, and `OperationalWorkspace`, but separate public and authenticated route entries. Introduce small pure modules for role capabilities, dashboard selection, AI request construction, and report lifecycle rules; server routes and React surfaces consume those tested contracts instead of mock identity state.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2, TypeScript 5.6, Supabase SSR/JS 2.x, Tailwind CSS 3.4, Zod 3.24, Vitest 4.1.

**Spec:** `docs/superpowers/specs/2026-09-10-real-application-entry-and-operations-design.md`

## Global Constraints

- Preserve `Supabase -> verified advisory -> deterministic risk/exposure/capacity -> approved action-rule engine -> persisted LGU Action Card -> constrained Gemini wording -> human decision -> audit`.
- Do not import `src/lib/mock-data.ts` into new production operational code.
- Do not add a demo workspace, role switcher, client-calculated authorization state, fabricated advisory, methodology, action, capacity, contact, or report.
- Use only the real role vocabulary: `admin | lgu_reviewer | lgu_encoder | field_reporter`.
- `assigned_barangay_id` narrows interface scope; it does not create a new role.
- Keep `/household` public and backed by `POST /api/households/action-card`.
- Gemini receives only a persisted `outputId`, `mode`, and `language`; it never receives arbitrary client facts.
- Keep missing, stale, unverified, estimated, and synthetic data visibly labeled.
- Do not apply remote Supabase migrations as part of this plan.
- Before route or authentication edits, read `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`, `03-layouts-and-pages.md`, `05-server-and-client-components.md`, `15-route-handlers.md`, and `node_modules/next/dist/docs/01-app/02-guides/authentication.md` and `redirecting.md`.
- Before visual implementation, invoke `ui-skills-root` and load at most three narrowly relevant UI skills.
- Use `apply_patch` for source-file edits and prefix shell commands with `rtk`.

---

### Task 1: Shared Operational Identity and Role Capabilities

**Files:**
- Create: `src/lib/domain/operationsAccess.ts`
- Create: `src/lib/domain/operationsAccess.test.ts`
- Modify: `src/lib/server/auth.ts`

**Interfaces:**
- Consumes: legacy database roles `ADMIN | LGU` and current roles `admin | lgu_reviewer | lgu_encoder | field_reporter`.
- Produces: `LguRole`, `OperationalProfile`, `normalizeLguRole(value)`, `modulesForRole(role)`, `canReview(role)`, and `canEnterPreparednessData(role)`.

- [ ] **Step 1: Write failing capability and normalization tests**

```ts
import { describe, expect, it } from "vitest";
import {
  canEnterPreparednessData,
  canReview,
  modulesForRole,
  normalizeLguRole,
} from "./operationsAccess";

describe("operational access", () => {
  it.each([
    ["ADMIN", "admin"],
    ["LGU", "lgu_encoder"],
    ["lgu_reviewer", "lgu_reviewer"],
    ["field_reporter", "field_reporter"],
  ] as const)("normalizes %s", (stored, expected) => {
    expect(normalizeLguRole(stored)).toBe(expected);
  });

  it("rejects browser-invented roles", () => {
    expect(() => normalizeLguRole("barangay_official")).toThrow(
      "Unsupported LGU role",
    );
  });

  it("restricts a field reporter to overview and reporting", () => {
    expect(modulesForRole("field_reporter")).toEqual([
      "home",
      "report-damage",
    ]);
    expect(canReview("field_reporter")).toBe(false);
    expect(canEnterPreparednessData("field_reporter")).toBe(false);
  });

  it.each(["admin", "lgu_reviewer"] as const)(
    "allows %s to review and consolidate",
    (role) => expect(canReview(role)).toBe(true),
  );
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `rtk npm test -- src/lib/domain/operationsAccess.test.ts`

Expected: FAIL because `operationsAccess.ts` does not exist.

- [ ] **Step 3: Implement the shared identity contract**

```ts
export type LguRole =
  | "admin"
  | "lgu_reviewer"
  | "lgu_encoder"
  | "field_reporter";

export type OperationalModule =
  | "home"
  | "prepare"
  | "report-damage"
  | "recovery";

export interface OperationalProfile {
  userId: string;
  email: string | null;
  role: LguRole;
  assignedBarangayId: string | null;
  assignedBarangayName: string | null;
  organization: string | null;
  positionTitle: string | null;
}

const ROLE_ALIASES: Record<string, LguRole> = {
  ADMIN: "admin",
  LGU: "lgu_encoder",
  admin: "admin",
  lgu_reviewer: "lgu_reviewer",
  lgu_encoder: "lgu_encoder",
  field_reporter: "field_reporter",
};

export function normalizeLguRole(value: unknown): LguRole {
  const role = typeof value === "string" ? ROLE_ALIASES[value] : undefined;
  if (!role) throw new Error("Unsupported LGU role");
  return role;
}

export function modulesForRole(role: LguRole): OperationalModule[] {
  return role === "field_reporter"
    ? ["home", "report-damage"]
    : role === "lgu_encoder"
      ? ["home", "prepare", "report-damage"]
      : ["home", "prepare", "report-damage", "recovery"];
}

export const canReview = (role: LguRole) =>
  role === "admin" || role === "lgu_reviewer";

export const canEnterPreparednessData = (role: LguRole) =>
  role !== "field_reporter";
```

Update `requireLguUser()` to select
`role,active_status,is_active,assigned_barangay_id,organization,position_title,barangays!user_profiles_barangay_fk(barangay_name)`, normalize the role with `normalizeLguRole`, and return:

```ts
return {
  supabase,
  user,
  role,
  profile: {
    userId: user.id,
    email: user.email ?? null,
    role,
    assignedBarangayId: profile.assigned_barangay_id,
    assignedBarangayName: profile.barangays?.barangay_name ?? null,
    organization: profile.organization,
    positionTitle: profile.position_title,
  } satisfies OperationalProfile,
};
```

If the generated Supabase relation value is an array, normalize it locally before constructing `OperationalProfile`; do not weaken the public interface to `any`.

- [ ] **Step 4: Run focused and existing domain tests**

Run: `rtk npm test -- src/lib/domain/operationsAccess.test.ts src/lib/domain`

Expected: PASS with no changed risk/action/exposure/capacity behavior.

- [ ] **Step 5: Commit the identity contract**

```powershell
rtk git add -- src/lib/domain/operationsAccess.ts src/lib/domain/operationsAccess.test.ts src/lib/server/auth.ts
rtk git commit -m "refactor: derive operational access from profile roles"
```

---

### Task 2: Public Entry Route and Authenticated Operations Route

**Files:**
- Create: `src/lib/domain/applicationRoutes.ts`
- Create: `src/lib/domain/applicationRoutes.test.ts`
- Create: `src/components/public/PublicEntry.tsx`
- Create: `src/components/public/PublicEntry.test.tsx`
- Create: `src/app/operations/page.tsx`
- Create: `src/lib/client/api.test.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/lib/client/api.ts`
- Modify: `src/components/public/PublicHouseholdView.tsx`
- Modify: `src/components/layout/AppShell.tsx`

**Interfaces:**
- Consumes: the existing `AppShell`, `PublicHouseholdView`, Supabase sign-in, and Next.js App Router route conventions.
- Produces: `PUBLIC_HOME`, `LOGIN_PATH`, `OPERATIONS_HOME`, `HOUSEHOLD_HOME`, `ApiClientError`, a public two-path landing page, and an authenticated `/operations` route.

- [ ] **Step 1: Read the installed Next.js route/auth documentation**

Run:

```powershell
rtk powershell -Command "Get-Content -Raw node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md; Get-Content -Raw node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md; Get-Content -Raw node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md; Get-Content -Raw node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md; Get-Content -Raw node_modules/next/dist/docs/01-app/02-guides/authentication.md; Get-Content -Raw node_modules/next/dist/docs/01-app/02-guides/redirecting.md"
```

Expected: documentation confirms nested `page.tsx` routing, `NextResponse.redirect()` in route handlers, and `useRouter().replace()` for client completion flows.

- [ ] **Step 2: Write failing route and public-entry tests**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicEntry } from "./PublicEntry";

describe("PublicEntry", () => {
  it("offers personnel and household paths without mounting operations", () => {
    const html = renderToStaticMarkup(<PublicEntry />);
    expect(html).toContain("Authorized Personnel");
    expect(html).toContain('href="/login"');
    expect(html).toContain("Household Preparedness");
    expect(html).toContain('href="/household"');
    expect(html).not.toContain("OperationalWorkspace");
  });
});
```

```ts
import { expect, it } from "vitest";
import {
  HOUSEHOLD_HOME,
  LOGIN_PATH,
  OPERATIONS_HOME,
  PUBLIC_HOME,
} from "./applicationRoutes";

it("keeps public and authenticated entry paths distinct", () => {
  expect({ PUBLIC_HOME, LOGIN_PATH, OPERATIONS_HOME, HOUSEHOLD_HOME }).toEqual({
    PUBLIC_HOME: "/",
    LOGIN_PATH: "/login",
    OPERATIONS_HOME: "/operations",
    HOUSEHOLD_HOME: "/household",
  });
});
```

Add `src/lib/client/api.test.ts`:

```ts
import { afterEach, expect, it, vi } from "vitest";
import { api, ApiClientError } from "./api";

afterEach(() => vi.unstubAllGlobals());

it("preserves the server error code and HTTP status", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
    new Response(JSON.stringify({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication is required." },
    }), { status: 401, headers: { "content-type": "application/json" } }),
  ));

  const request = api("/api/operations");
  await expect(request).rejects.toBeInstanceOf(ApiClientError);
  await expect(request).rejects.toMatchObject({
    code: "UNAUTHORIZED",
    status: 401,
  });
});
```

- [ ] **Step 3: Run both tests and confirm RED**

Run: `rtk npm test -- src/lib/domain/applicationRoutes.test.ts src/components/public/PublicEntry.test.tsx src/lib/client/api.test.ts`

Expected: FAIL because the new modules do not exist.

- [ ] **Step 4: Implement route constants and the public entry**

```ts
export const PUBLIC_HOME = "/";
export const LOGIN_PATH = "/login";
export const OPERATIONS_HOME = "/operations";
export const HOUSEHOLD_HOME = "/household";
```

`PublicEntry` must be a server-compatible component with Project AGAP branding, a short trust-pipeline explanation, and exactly two primary cards linking to `/login` and `/household`. Use calm government-service styling, visible focus states, semantic headings, and no API calls, auth hooks, simulated identity controls, or fake operational metrics.

Change the route pages to:

```tsx
// src/app/page.tsx
import { PublicEntry } from "@/components/public/PublicEntry";
export default function HomePage() {
  return <PublicEntry />;
}
```

```tsx
// src/app/operations/page.tsx
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Operations | Project AGAP",
  description: "Authorized Project AGAP disaster decision-support workspace.",
};

export default function OperationsPage() {
  return <AppShell />;
}
```

Remove `isPublicUser` branching from `AppShell`. Remove `showDemoSwitcher` and the `UserProfileArea` import from `PublicHouseholdView`; its header always links authorized users to `/login`.

- [ ] **Step 5: Redirect completed authentication to `/operations`**

In `src/app/login/page.tsx`, replace `router.replace("/")` with `router.replace(OPERATIONS_HOME)`. In `src/app/auth/callback/route.ts`, redirect to `new URL(OPERATIONS_HOME, url.origin)` only after a successful code exchange; redirect exchange failures to `/login` with a non-secret `error=callback` query marker.

In `src/lib/client/api.ts`, preserve structured server errors:

```ts
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
```

Throw `ApiClientError` when `!response.ok || !body.success`, using the returned error code, response status, message, and details. This is required so `/operations` can distinguish authentication failure from offline/network failure.

- [ ] **Step 6: Run focused tests and TypeScript**

Run: `rtk npm test -- src/lib/domain/applicationRoutes.test.ts src/components/public/PublicEntry.test.tsx src/lib/client/api.test.ts`

Run: `rtk npm run typecheck`

Expected: both commands exit 0.

- [ ] **Step 7: Commit route separation**

```powershell
rtk git add -- src/lib/domain/applicationRoutes.ts src/lib/domain/applicationRoutes.test.ts src/components/public/PublicEntry.tsx src/components/public/PublicEntry.test.tsx src/app/page.tsx src/app/operations/page.tsx src/app/login/page.tsx src/app/auth/callback/route.ts src/components/public/PublicHouseholdView.tsx src/components/layout/AppShell.tsx src/lib/client/api.ts src/lib/client/api.test.ts
rtk git commit -m "feat: separate public and operational entry routes"
```

---

### Task 3: Database-Backed Operations Payload and Dashboard Selectors

**Files:**
- Create: `src/lib/domain/operationsDashboard.ts`
- Create: `src/lib/domain/operationsDashboard.test.ts`
- Modify: `src/app/api/operations/route.ts`

**Interfaces:**
- Consumes: `OperationalProfile`, current Supabase rows from `barangays`, `advisories`, `hazards`, `methodologies`, `risk_assessments`, `population_exposure_estimates`, `preparedness_capacities`, `damage_reports`, and `operational_actions`.
- Produces: `OperationsWorkspaceData`, `OperationsDashboard`, `PreparednessEvidenceSetResult`, `scopeOperationsWorkspace(data, profile)`, `buildOperationsDashboard(data, now)`, and an expanded authenticated `/api/operations` payload.
- Also produces: `selectPreparednessEvidenceSet(data, selection)` for resolving the already-recorded assessment, exposure, and validated capacity used by card generation.

- [ ] **Step 1: Write failing selector tests with real row shapes**

Create fixtures inside the test for:

- one verified current advisory, one expired verified advisory, one future advisory, and one unverified advisory;
- three barangays with deterministic risk results `20`, `12`, and missing;
- exposures of `120/40` and `80/25` persons/households;
- validated capacity totals `90` and `100`;
- one unvalidated capacity record that must not be used;
- reports in `UNVERIFIED`, `FOR_REVIEW`, and `VERIFIED` states;
- actions in `RECOMMENDED`, `ASSIGNED`, and `RESOLVED` states.

Assert the desired public contract:

```ts
const dashboard = buildOperationsDashboard(workspace, "2026-09-10T12:00:00Z");

expect(dashboard.currentAdvisory?.id).toBe("current");
expect(dashboard.priorityBarangays.map((item) => item.barangayName)).toEqual([
  "Dalahican",
  "Cotta",
]);
expect(dashboard.priorityBarangays[0]).toMatchObject({
  riskResult: 20,
  estimatedPersons: 120,
  estimatedHouseholds: 40,
  validatedCapacity: 90,
  possibleCapacityGap: 30,
});
expect(dashboard.priorityBarangays[1].possibleCapacityGap).toBe(-20);
expect(dashboard.awaitingValidation).toEqual({
  reports: 2,
  reportedPersons: 18,
  reportedHouseholds: 6,
});
expect(dashboard.openActions).toBe(2);
```

Add separate tests proving that expired/future/unverified advisories are excluded, assigned barangay scope removes other barangays, missing exposure returns `null` rather than `0`, and unvalidated capacity returns `null` rather than a false gap.

Add a test proving that `selectPreparednessEvidenceSet()` returns the newest matching database records for an exact `{ barangayId, advisoryId, hazardId }` without requiring any form values:

```ts
expect(
  selectPreparednessEvidenceSet(workspace, {
    barangayId: "barangay-a",
    advisoryId: "current",
    hazardId: "rainfall",
  }),
).toMatchObject({
  assessment: { id: "assessment-new", likelihood: 5, severity: 4 },
  exposure: { id: "exposure-new", estimated_exposed_population: 120 },
  capacity: { id: "capacity-validated", evacuation_capacity: 60 },
  canGenerateCard: true,
  missing: [],
});
```

Add a scope test proving `scopeOperationsWorkspace()` removes other-barangay rows from `barangays`, `risk_assessments`, `population_exposure_estimates`, `preparedness_capacities`, `damage_reports`, and `operational_actions`, and removes advisories that do not name the assigned barangay in `affected_areas`.

- [ ] **Step 2: Run selector tests and confirm RED**

Run: `rtk npm test -- src/lib/domain/operationsDashboard.test.ts`

Expected: FAIL because the selector module does not exist.

- [ ] **Step 3: Implement explicit workspace/dashboard types and selectors**

The exported summary must have this stable shape:

```ts
export interface OperationsDashboard {
  currentAdvisory: null | {
    id: string;
    advisoryType: string;
    bulletinReference: string;
    sourceAgency: string;
    issueTime: string;
    validityEnd: string;
    affectedAreas: string[];
    isDemo: boolean;
  };
  priorityBarangays: Array<{
    barangayId: string;
    barangayName: string;
    hazardId: string | null;
    hazardName: string | null;
    riskResult: number;
    riskCategory: string;
    likelihood: number;
    severity: number;
    methodologyName: string | null;
    methodologyVersion: string | null;
    assessmentDate: string;
    estimatedPersons: number | null;
    estimatedHouseholds: number | null;
    exposureMethod: string | null;
    exposureConfidence: string | null;
    exposureReferenceDate: string | null;
    validatedCapacity: number | null;
    possibleCapacityGap: number | null;
    capacityValidationDate: string | null;
    limitations: string[];
  }>;
  awaitingValidation: {
    reports: number;
    reportedPersons: number;
    reportedHouseholds: number;
  };
  openActions: number;
  dataGaps: string[];
}
```

Define the workspace rows with the exact fields consumed by the selectors rather than `any`. The preparedness result must be:

```ts
export interface PreparednessEvidenceSetResult {
  advisory: OperationsWorkspaceData["advisories"][number] | null;
  assessment: OperationsWorkspaceData["risk_assessments"][number] | null;
  methodology: OperationsWorkspaceData["methodologies"][number] | null;
  exposure: OperationsWorkspaceData["population_exposure_estimates"][number] | null;
  capacity: OperationsWorkspaceData["preparedness_capacities"][number] | null;
  possibleCapacityGap: number | null;
  canGenerateCard: boolean;
  missing: string[];
}
```

`OperationsWorkspaceData` includes `userId`, `role`, `profile`, `synchronizedAt`, and typed arrays for every table returned by `/api/operations`. Each row interface must enumerate every field read by `OperationalWorkspace` and the new selectors; keep unknown JSON payloads as `unknown` or a narrow record/array type, not `any`.

Selection rules:

1. current advisory is `verification_status === "VERIFIED"`, `validity_start <= now < validity_end`, newest `issue_time` first;
2. assessments must belong to the current advisory and, when present, the assigned barangay;
3. retain the newest assessment for each barangay, breaking ties by higher `risk_result`, then barangay name;
4. join the newest same-barangay/same-hazard exposure by `generated_at`;
5. join only capacities with a non-null `validation_date`, newest first;
6. call the existing `calculateCapacityGap()` only when both exposure and validated capacity exist;
7. count `UNVERIFIED` and `FOR_REVIEW` as awaiting validation; do not count `VERIFIED` or `REJECTED`;
8. count operational actions whose status is not `RESOLVED`;
9. surface missing advisory, assessment, exposure, or validated capacity as human-readable `dataGaps`.

`selectPreparednessEvidenceSet()` uses the same currency and matching rules, returns `null` for each missing record, and sets `canGenerateCard` only when the current verified advisory, matching assessment, matching exposure, and validated capacity all exist. It must not accept likelihood, severity, evidence, confidence, exposure totals, or capacity totals from the browser.

- [ ] **Step 4: Expand the authenticated operations response**

Use `profile` from `requireLguUser()` and add `damage_reports` and `operational_actions` to the current table query list. Return:

```ts
return ok({
  userId: user.id,
  role,
  profile,
  ...Object.fromEntries(tables.map((table, index) => [table, results[index].data])),
  synchronizedAt: new Date().toISOString(),
});
```

For a non-null `profile.assignedBarangayId`, call the tested `scopeOperationsWorkspace()` before serialization. It filters barangay-keyed records and advisories by the assigned barangay's real `barangay_name`. Do not rely on a client-side dashboard selector as the only scope boundary.

- [ ] **Step 5: Run focused tests, all domain tests, and TypeScript**

Run: `rtk npm test -- src/lib/domain/operationsDashboard.test.ts src/lib/domain`

Run: `rtk npm run typecheck`

Expected: all commands exit 0.

- [ ] **Step 6: Commit the operations data layer**

```powershell
rtk git add -- src/lib/domain/operationsDashboard.ts src/lib/domain/operationsDashboard.test.ts src/app/api/operations/route.ts
rtk git commit -m "feat: derive operations dashboard from Supabase records"
```

---

### Task 4: Remove Simulated Identity and Make the Shell Role-Derived

**Files:**
- Modify: `src/context/NavigationContext.tsx`
- Modify: `src/components/layout/UserProfileArea.tsx`
- Modify: `src/components/layout/AppSidebar.tsx`
- Modify: `src/components/layout/AppHeader.tsx`
- Modify: `src/components/layout/MobileNavigation.tsx`
- Modify: `src/components/layout/HelpDialog.tsx`
- Modify: `src/components/modules/OperationalWorkspace.tsx`

**Interfaces:**
- Consumes: `OperationalProfile`, `OperationalModule`, and `modulesForRole()` from Task 1; `OperationsWorkspaceData` from Task 3.
- Produces: `setOperationalProfile(profile)`, `operationalProfile`, `visibleModules`, real assigned-barangay selection, and a non-simulated profile/sign-out menu.

- [ ] **Step 1: Add failing tests for the extracted navigation reducer**

Keep React context thin by exporting a pure transition:

```ts
import { describe, expect, it } from "vitest";
import { nextAllowedModule } from "./operationsAccess";

it("returns field reporters to home when recovery is requested", () => {
  expect(nextAllowedModule("field_reporter", "recovery")).toBe("home");
});

it("keeps reviewer access to recovery", () => {
  expect(nextAllowedModule("lgu_reviewer", "recovery")).toBe("recovery");
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `rtk npm test -- src/lib/domain/operationsAccess.test.ts`

Expected: FAIL because `nextAllowedModule` is missing.

- [ ] **Step 3: Implement the reducer and replace demo navigation state**

Add:

```ts
export function nextAllowedModule(
  role: LguRole | null,
  requested: OperationalModule,
): OperationalModule {
  return role && modulesForRole(role).includes(requested) ? requested : "home";
}
```

Refactor `NavigationContext` to remove `DemoUserView`, `userView`, `setUserView`, `isPublicUser`, `isBarangayUser`, `TOP_BARANGAYS`, `OTHER_BARANGAYS`, and hard-coded Gulang-Gulang scope. Define the real `PrepareSubView` locally, including `"source-data"`, and store only:

```ts
operationalProfile: OperationalProfile | null;
setOperationalProfile(profile: OperationalProfile | null): void;
selectedBarangay: { id: string; name: string } | null;
setSelectedBarangay(value: { id: string; name: string }): void;
visibleModules: OperationalModule[];
isFieldResponderUser: boolean;
```

Use `nextAllowedModule()` inside `setCurrentModule()`. Preserve current module and prepare-subview helpers without any identity-changing behavior.

- [ ] **Step 4: Connect the authenticated payload to the context**

When `OperationalWorkspace.load()` receives the workspace, call `setOperationalProfile(next.profile)`. Initialize or lock `barangayId` to `next.profile.assignedBarangayId` when present. Whenever the selected real barangay changes, call `setSelectedBarangay({ id, name })` for breadcrumbs.

Do not set an operational profile from `/`, `/household`, query parameters, local storage, or arbitrary component props.

- [ ] **Step 5: Replace the profile switcher and filter navigation**

`UserProfileArea` displays:

- `profile.email` as the identity fallback;
- `profile.positionTitle` or a title-cased real role;
- `profile.organization` and assigned barangay when recorded;
- a real **Sign out** action calling `supabase.auth.signOut()`, then `router.replace("/")`.

It contains no role list and no text matching `Simulate User View`, `Demo LGU User`, or `Public / Resident`.

`AppSidebar` and `MobileBottomNav` filter `PRIMARY_NAV_ITEMS` with `visibleModules`. `AppHeader` uses `selectedBarangay`/`operationalProfile.assignedBarangayName` for breadcrumbs. `HelpDialog` takes an explicit `audience` defaulting to operations instead of consulting removed public identity state.

- [ ] **Step 6: Prove no simulated identity remains in the live shell**

Run:

```powershell
rtk rg -n "Simulate User View|DemoUserView|setUserView|isPublicUser|isBarangayUser|Demo LGU User|Public / Resident" src/context src/components/layout src/components/modules/OperationalWorkspace.tsx src/components/public
```

Expected: no matches in live operational files. Do not broaden this task into deleting unrelated legacy files; report any unreferenced prototype file separately.

- [ ] **Step 7: Run tests and TypeScript**

Run: `rtk npm test -- src/lib/domain/operationsAccess.test.ts`

Run: `rtk npm run typecheck`

Expected: both commands exit 0.

- [ ] **Step 8: Commit role-derived navigation**

```powershell
rtk git add -- src/context/NavigationContext.tsx src/components/layout/UserProfileArea.tsx src/components/layout/AppSidebar.tsx src/components/layout/AppHeader.tsx src/components/layout/MobileNavigation.tsx src/components/layout/HelpDialog.tsx src/components/modules/OperationalWorkspace.tsx src/lib/domain/operationsAccess.ts src/lib/domain/operationsAccess.test.ts
rtk git commit -m "refactor: remove simulated operational identities"
```

---

### Task 5: Decision-First Operational Dashboard

**Files:**
- Create: `src/components/operations/OperationsDecisionDashboard.tsx`
- Create: `src/components/operations/OperationsDecisionDashboard.test.tsx`
- Create: `src/components/assessment/PreparednessEvidenceSet.tsx`
- Create: `src/components/assessment/PreparednessEvidenceSet.test.tsx`
- Modify: `src/components/modules/OperationalWorkspace.tsx`

**Interfaces:**
- Consumes: `OperationsDashboard` from Task 3 plus navigation callbacks supplied by `OperationalWorkspace`.
- Produces: a real current-advisory panel, priority table/cards, exposure/capacity summary, validation queue summary, data-gap states, and workflow shortcuts.
- Also produces: a read-first Preparedness screen that uses existing Supabase records and separates source-data maintenance from card use.

- [ ] **Step 1: Invoke UI selection and load narrow dashboard guidance**

Follow the `ui-skills-root` protocol at execution time: run `rtk npx ui-skills categories`, inspect the dashboard/application-shell category with `rtk npx ui-skills list --category dashboard`, and load the single most specific returned dashboard skill. If the installed registry uses a different category name, select its exact dashboard equivalent from the categories output. Load a second skill only if accessibility or responsive data tables are a distinct need. Record the selected slug in the implementation handoff.

- [ ] **Step 2: Write a failing rendered-output test**

Use `renderToStaticMarkup()` with a representative `OperationsDashboard` and assert:

```tsx
expect(html).toContain("Current verified advisory");
expect(html).toContain("PAGASA-TC-09");
expect(html).toContain("Priority barangays");
expect(html).toContain("Likelihood 5 × Severity 4 = Risk 20");
expect(html).toContain("Estimated potentially exposed");
expect(html).toContain("Possible capacity gap");
expect(html).toContain("Reports awaiting validation");
expect(html).toContain("2");
expect(html).toContain("Synthetic demonstration record");
```

Add an empty-state test that asserts `No current verified advisory` and explicit missing-assessment/exposure/capacity copy instead of fabricated zeroes.

Add `PreparednessEvidenceSet.test.tsx`. With complete records, assert that it renders the stored likelihood, severity, result, methodology/version, assessment date, evidence, limitations, exposure estimate/source/confidence, validated capacity/source/date, and an enabled `Generate LGU Action Card` action. Assert that it does not render input controls named `likelihood`, `severity`, `dataDate`, `evidence`, or `confidence`.

With an incomplete evidence set, assert that it names each missing database record, disables card generation, and offers `Record or update source data` only when `canMaintainSourceData` is true.

- [ ] **Step 3: Run the component test and confirm RED**

Run: `rtk npm test -- src/components/operations/OperationsDecisionDashboard.test.tsx src/components/assessment/PreparednessEvidenceSet.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 4: Implement the dashboard component**

Use semantic `section`, `table`/responsive cards, `time`, and status text. The component signature is:

```ts
interface OperationsDecisionDashboardProps {
  dashboard: OperationsDashboard;
  role: LguRole;
  onSelectBarangay(barangayId: string, hazardId: string | null): void;
  onOpenAssessment(): void;
  onOpenDamageReports(): void;
  onOpenPostImpact(): void;
  onOpenAdvisoryIntake(): void;
}
```

Display negative capacity gaps as `No estimated shortfall from recorded capacity (20-person margin)`, not `-20 shortage`. Label positive values `Possible capacity gap` and repeat the required human-validation limitation. Show advisory source/validity and conspicuous synthetic labeling when `isDemo` is true.

Implement `PreparednessEvidenceSet` with this boundary:

```ts
interface PreparednessEvidenceSetProps {
  evidenceSet: PreparednessEvidenceSetResult;
  canMaintainSourceData: boolean;
  onGenerateCard(): void;
  onOpenSourceData(): void;
}
```

This is a read-only evidence/provenance view. It displays the actual resolved records and never renders assessment, exposure, or capacity input fields.

- [ ] **Step 5: Make home decision-first without removing workflows**

In `OperationalWorkspace`, derive:

```ts
const dashboard = data ? buildOperationsDashboard(data, new Date(now).toISOString()) : null;
```

Replace the always-open home advisory intake section with `OperationsDecisionDashboard`. Its `onOpenAdvisoryIntake` sets `showAdvisory(true)`; render `AdvisoryForm` only after that explicit action. Priority selection updates `barangayId` and `hazardId`, then opens `prepare`.

Replace the default blank `Risk, exposure & capacity` form with `PreparednessEvidenceSet`, built from `selectPreparednessEvidenceSet(data, { barangayId, advisoryId, hazardId })`. Its generate action calls the existing `/api/action-cards/lgu` flow using only `{ barangayId, advisoryId, hazardId }`.

Move the existing assessment, exposure, and capacity authoring controls behind a separate `prepareSubView === "source-data"` view opened only by `Record or update source data`. Add `"source-data"` to the real `PrepareSubView` type during Task 4. Only `admin`, `lgu_reviewer`, and `lgu_encoder` may see the entry point, and the existing server permissions remain authoritative. A Back action returns to the read-only evidence set. Do not prefill a new assessment submission in a way that silently overwrites or mutates an existing record; the form creates the next explicitly sourced record.

Keep all existing advisory intake, assessment, exposure, capacity, report, synchronization, post-impact, action, and audit handlers intact, but do not show their input forms as the normal path for consuming existing database data.

When `api()` throws `ApiClientError` with code `UNAUTHORIZED`, redirect to `/login`; keep network errors distinct and retain the existing owner-scoped offline snapshot path.

- [ ] **Step 6: Run dashboard tests, domain tests, and TypeScript**

Run: `rtk npm test -- src/components/operations/OperationsDecisionDashboard.test.tsx src/components/assessment/PreparednessEvidenceSet.test.tsx src/lib/domain/operationsDashboard.test.ts`

Run: `rtk npm run typecheck`

Expected: both commands exit 0.

- [ ] **Step 7: Commit the dashboard**

```powershell
rtk git add -- src/components/operations/OperationsDecisionDashboard.tsx src/components/operations/OperationsDecisionDashboard.test.tsx src/components/assessment/PreparednessEvidenceSet.tsx src/components/assessment/PreparednessEvidenceSet.test.tsx src/components/modules/OperationalWorkspace.tsx
rtk git commit -m "feat: make operations home a decision dashboard"
```

---

### Task 6: Evidence-Complete LGU Card and Persisted-Output Gemini Controls

**Files:**
- Create: `src/lib/domain/aiRequest.ts`
- Create: `src/lib/domain/aiRequest.test.ts`
- Create: `src/components/assessment/PersistedOutputAiPanel.tsx`
- Create: `src/components/assessment/PersistedOutputAiPanel.test.tsx`
- Create: `src/components/assessment/LGUActionCard.test.tsx`
- Modify: `src/components/assessment/LGUActionCard.tsx`
- Modify: `src/components/modules/OperationalWorkspace.tsx`

**Interfaces:**
- Consumes: persisted `outputId`, `LGUActionCardProps`, the existing `/api/ai` response, and existing deterministic card data.
- Produces: `buildAiRequest(outputId, mode, language)`, two constrained AI actions, and a visible deterministic evidence chain.

- [ ] **Step 1: Write failing AI-request tests**

```ts
import { describe, expect, it } from "vitest";
import { buildAiRequest } from "./aiRequest";

describe("buildAiRequest", () => {
  it.each(["explain", "brief"] as const)("uses only persisted output for %s", (mode) => {
    expect(buildAiRequest("550e8400-e29b-41d4-a716-446655440000", mode, "en")).toEqual({
      outputId: "550e8400-e29b-41d4-a716-446655440000",
      mode,
      language: "en",
    });
  });
});
```

- [ ] **Step 2: Write failing card and AI-panel rendering tests**

Render `LGUActionCard` inside `LanguageProvider` and assert it contains:

- `Likelihood 5 × Severity 4 = Risk 20`;
- methodology name, version, and source;
- exposure estimate, method, confidence, source, and reference date;
- validated capacity and possible gap;
- evidence and limitations;
- action-rule ID/source;
- responsible unit or `Unassigned`;
- `Human confirmation required`.

Render `PersistedOutputAiPanel` and assert `Explain Assessment`, `Generate Operational Brief`, and copy stating that AI does not calculate risk or invent actions.

- [ ] **Step 3: Run the three focused tests and confirm RED**

Run: `rtk npm test -- src/lib/domain/aiRequest.test.ts src/components/assessment/PersistedOutputAiPanel.test.tsx src/components/assessment/LGUActionCard.test.tsx`

Expected: FAIL because the request module/panel do not exist and the current card lacks the required primary trace copy.

- [ ] **Step 4: Implement the exact AI request boundary**

```ts
export type AiMode = "explain" | "brief";

export function buildAiRequest(
  outputId: string,
  mode: AiMode,
  language: "en" | "fil",
) {
  return { outputId, mode, language } as const;
}
```

`PersistedOutputAiPanel` accepts:

```ts
interface PersistedOutputAiPanelProps {
  outputId: string;
  language: "en" | "fil";
}
```

Each button POSTs `JSON.stringify(buildAiRequest(...))` to `/api/ai`. Keep separate result headings for explanation and brief, preserve the last deterministic card when either request fails, show server fallback wording, and label all generated prose `AI wording from persisted verified inputs`.

- [ ] **Step 5: Strengthen the deterministic card presentation**

Add a primary assessment equation block built exclusively from supplied props:

```tsx
<p className="text-lg font-black text-slate-950">
  Likelihood {display(assessment?.likelihood)} × Severity{" "}
  {display(assessment?.severity)} = Risk {display(assessment?.riskResult)}
</p>
```

Keep methodology, assessment date, exposure metadata, validated capacity, gap, evidence, data gaps, recommendation IDs/sources, responsible units, statuses, and confirmation requirements visible. Use `Unassigned` for a null responsible unit and never infer one.

- [ ] **Step 6: Connect both Gemini modes to the generated output**

In `ConnectedLguOutput`, read the active language from `useLanguage()` and render:

```tsx
<>
  <LGUActionCard {...mappedCardProps} />
  {c.outputId ? (
    <PersistedOutputAiPanel outputId={c.outputId} language={language} />
  ) : (
    <p>This card has no persisted output ID; AI wording is unavailable.</p>
  )}
</>
```

Remove the duplicate AI-fetching state/button from `PreparednessBrief`; keep its deterministic structured brief and source/methodology view. Do not change `/api/ai` to accept arbitrary verified input.

- [ ] **Step 7: Run focused tests and the existing action-card/domain tests**

Run: `rtk npm test -- src/lib/domain/aiRequest.test.ts src/components/assessment/PersistedOutputAiPanel.test.tsx src/components/assessment/LGUActionCard.test.tsx src/lib/domain/actionCards.test.ts src/lib/domain/aiGuard.test.ts`

Run: `rtk npm run typecheck`

Expected: all commands exit 0.

- [ ] **Step 8: Commit the card and AI controls**

```powershell
rtk git add -- src/lib/domain/aiRequest.ts src/lib/domain/aiRequest.test.ts src/components/assessment/PersistedOutputAiPanel.tsx src/components/assessment/PersistedOutputAiPanel.test.tsx src/components/assessment/LGUActionCard.tsx src/components/assessment/LGUActionCard.test.tsx src/components/modules/OperationalWorkspace.tsx
rtk git commit -m "feat: expose persisted-output AI controls on LGU cards"
```

---

### Task 7: Enforce and Present the Damage-to-Action Lifecycle

**Files:**
- Create: `src/lib/domain/reportLifecycle.ts`
- Create: `src/lib/domain/reportLifecycle.test.ts`
- Create: `src/components/recovery/ReportLifecycle.tsx`
- Create: `src/components/recovery/ReportLifecycle.test.tsx`
- Modify: `src/app/api/post-impact/consolidate/route.ts`
- Modify: `src/components/modules/OperationalWorkspace.tsx`
- Modify: `src/components/recovery/PostImpactActionCard.tsx`

**Interfaces:**
- Consumes: database verification states, synchronized field reports, linked-needs verification performed by `verify_field_report`, and existing post-impact card/action output.
- Produces: `reportLifecycleStage(status)`, `assertReportsConsolidatable(reports)`, explicit lifecycle counts, and a consolidation route that accepts only verified reports.

- [ ] **Step 1: Write failing lifecycle tests**

```ts
import { describe, expect, it } from "vitest";
import {
  assertReportsConsolidatable,
  reportLifecycleStage,
} from "./reportLifecycle";

describe("report lifecycle", () => {
  it.each([
    ["UNVERIFIED", "REPORTED"],
    ["FOR_REVIEW", "IN_REVIEW"],
    ["VERIFIED", "VALIDATED"],
    ["REJECTED", "REJECTED"],
  ] as const)("maps %s to %s", (status, stage) => {
    expect(reportLifecycleStage(status)).toBe(stage);
  });

  it("allows only validated reports into consolidation", () => {
    expect(() =>
      assertReportsConsolidatable([{ id: "a", verification_status: "VERIFIED" }]),
    ).not.toThrow();
    expect(() =>
      assertReportsConsolidatable([{ id: "b", verification_status: "UNVERIFIED" }]),
    ).toThrow("Only validated reports can be consolidated");
  });
});
```

- [ ] **Step 2: Write a failing lifecycle component test**

Render `ReportLifecycle` with `reported=4`, `inReview=2`, `validated=3`, `consolidated=1`, and assert the ordered labels:

```text
Reported / UNVERIFIED -> Review -> VALIDATED -> Consolidation -> Action
```

Also assert that reported values are described as observations and that consolidation requires non-overlapping validated reports.

- [ ] **Step 3: Run focused tests and confirm RED**

Run: `rtk npm test -- src/lib/domain/reportLifecycle.test.ts src/components/recovery/ReportLifecycle.test.tsx`

Expected: FAIL because the new modules do not exist.

- [ ] **Step 4: Implement lifecycle mapping and consolidation guard**

```ts
export type ReportLifecycleStage =
  | "REPORTED"
  | "IN_REVIEW"
  | "VALIDATED"
  | "REJECTED";

export function reportLifecycleStage(status: string): ReportLifecycleStage {
  if (status === "VERIFIED") return "VALIDATED";
  if (status === "FOR_REVIEW") return "IN_REVIEW";
  if (status === "REJECTED") return "REJECTED";
  return "REPORTED";
}

export function assertReportsConsolidatable(
  reports: Array<{ id: string; verification_status: string }>,
) {
  const invalid = reports.filter(
    (report) => report.verification_status !== "VERIFIED",
  );
  if (invalid.length) {
    throw new Error("Only validated reports can be consolidated");
  }
}
```

In the route, translate the domain error into:

```ts
throw new AppError(
  "INVALID_INPUT",
  "Only validated reports can be consolidated. Review the selected reports and linked needs first.",
  422,
  { reportIds: invalid.map((report) => report.id) },
);
```

Perform this check after verifying that all selected IDs belong to the selected barangay/advisory and before inserting `post_impact_reviews`.

- [ ] **Step 5: Present the lifecycle in Damage & Needs and Post Impact**

Render `ReportLifecycle` above the report form and above the recovery review list. Derive counts from current `reports` and queue state without renaming database values. In the UI, explain that `VERIFIED` is displayed to implementors as the validated lifecycle stage.

Disable a report's consolidation checkbox until its `verification_status === "VERIFIED"`. Keep the existing verification action, evidence reason, linked-needs verification, non-overlap confirmation, deterministic post-impact rule generation, action assignment, and audit history.

In `PostImpactActionCard`, add a compact provenance line explaining that reported and validated totals remain separate and that actions come from rule IDs with authorized human confirmation; do not add relief quantities or autonomous allocation wording.

- [ ] **Step 6: Run focused tests, post-impact tests, and TypeScript**

Run: `rtk npm test -- src/lib/domain/reportLifecycle.test.ts src/components/recovery/ReportLifecycle.test.tsx src/lib/domain/postImpact.test.ts src/lib/domain/actionCards.test.ts`

Run: `rtk npm run typecheck`

Expected: all commands exit 0.

- [ ] **Step 7: Commit lifecycle enforcement and presentation**

```powershell
rtk git add -- src/lib/domain/reportLifecycle.ts src/lib/domain/reportLifecycle.test.ts src/components/recovery/ReportLifecycle.tsx src/components/recovery/ReportLifecycle.test.tsx src/app/api/post-impact/consolidate/route.ts src/components/modules/OperationalWorkspace.tsx src/components/recovery/PostImpactActionCard.tsx
rtk git commit -m "feat: enforce validated post-impact consolidation"
```

---

### Task 8: Full Verification, Browser Acceptance, and Documentation

**Files:**
- Modify: `docs/WORKFLOW-IMPLEMENTATION.md`
- Modify only if behavior changed: `docs/API.md`
- Modify only if a boundary changed: `docs/ARCHITECTURE.md`

**Interfaces:**
- Consumes: all prior tasks and current environment configuration.
- Produces: fresh test/type/build evidence and an honest acceptance record for public, household, unauthenticated operations, and—when credentials exist—authenticated operations.

- [ ] **Step 1: Update workflow documentation with exact implemented behavior**

Record `/` as public gateway, `/operations` as authenticated workspace, real profile-derived navigation, dashboard selector rules, two Gemini modes using `outputId`, validated-only consolidation, and any local environment limitation. Do not repeat the design spec; document observed implementation and verification results.

- [ ] **Step 2: Run the complete automated suite**

Run: `rtk npm test`

Expected: exit 0 and all test files pass.

- [ ] **Step 3: Run TypeScript and production build**

Run: `rtk npm run typecheck`

Run: `rtk npm run build`

Expected: both commands exit 0. Treat any Next.js 16 deprecation notice as work to resolve, not as ignorable output.

- [ ] **Step 4: Start the application for browser acceptance**

Run: `rtk npm run dev`

Expected: Next.js reports a local URL and remains running. Use the browser verification skill required by the environment after the dev server starts.

- [ ] **Step 5: Verify the public and unauthenticated routes in a browser**

Confirm:

1. `/` shows only the two intended entry paths and makes no `/api/operations` request;
2. keyboard focus and mobile layout work for both entry cards;
3. `/household` loads and a generation attempt calls `/api/households/action-card`;
4. `/login` authenticates through Supabase and has no fake credentials or bypass;
5. unauthenticated `/operations` resolves to `/login`, not a generic retry-only workspace;
6. no visible text says `Simulate User View`.

- [ ] **Step 6: Verify the authenticated operational story when configuration permits**

Using an authorized test account and prepared database records, confirm:

1. the shell displays the real `user_profiles.role` and assigned barangay;
2. the dashboard shows the current verified advisory, priority barangays, estimates, possible gaps, pending validation, and open actions from Supabase;
3. Preparedness displays the existing matched assessment, exposure, and validated capacity without asking for duplicate input;
4. `Generate LGU Action Card` sends only record selectors (`barangayId`, `advisoryId`, and `hazardId`) and reads all values from Supabase;
5. no dashboard or Preparedness load creates an assessment, output, or action;
6. source-data forms appear only after an authorized user explicitly opens `Record or update source data`;
7. a reviewer can generate an LGU card and see its deterministic equation, methodology/version, evidence, limitations, rule IDs, responsible units, and confirmation requirements;
8. both Gemini buttons send only `outputId`, `mode`, and `language` and leave the deterministic card intact on fallback;
9. an unverified report cannot be consolidated; after review/verification it can be selected for non-overlapping consolidation;
10. action decisions and reasons appear in audit history.

If Supabase/Gemini credentials or an authorized account are absent, state exactly which steps could not be run. Do not manufacture a passing result.

- [ ] **Step 7: Inspect the final diff and rerun the completion gate**

Run: `rtk git diff --check`

Run: `rtk git status --short`

Run: `rtk npm test`

Run: `rtk npm run typecheck`

Run: `rtk npm run build`

Expected: no whitespace errors, only intended files changed, and all three verification commands exit 0.

- [ ] **Step 8: Commit the verified documentation**

```powershell
rtk git add -- docs/WORKFLOW-IMPLEMENTATION.md docs/API.md docs/ARCHITECTURE.md
rtk git commit -m "docs: record real operations acceptance checks"
```

Skip unchanged documentation paths in `git add`; do not create an empty commit.
