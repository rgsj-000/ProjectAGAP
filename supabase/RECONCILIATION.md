# September 9, 2026 database reconciliation

Applied to `project-agap` (`xxaqxcwsyawpqwphxuix`).

The live database used the September 8 schema, not the initial schema previously
committed in this repository. Its two remote migrations were fetched verbatim.
The previously unapplied `202609090001` migration was changed into a compatibility
migration over that baseline. The original version is retained in
`reference/original_initial_agap.sql` for comparison, not execution.

All five migrations now appear in the remote history. Nine missing operational
tables were added, along with current API fields on existing tables. Legacy
columns/data were retained; the old numeric damage severity is now
`legacy_severity`, with the current text severity in a separate column. Audit
IDs remain UUIDs. Missing write policies and legacy output/audit constraints
were corrected. No seed data was applied.

Verified unchanged: 33 barangays, 2 advisories, 5 household profiles, 5 damage
reports, and 0 user profiles. All three expected Storage buckets are private.
Existing advisories without documented validity ends remain unavailable to
active-card generation. Unknown household attributes, capacities, methodologies,
and action rules were not fabricated. An authorized administrator still needs to
provision LGU profiles and approved operational inputs.

## Validation

`db push --dry-run` resolved the migration history. The entire proposed migration
and role tests were first executed in a transaction ending in ROLLBACK. After
deployment, role tests were repeated against the live schema and rolled back:

- Reporter damage/needs submissions, output creation, and audit append.
- Reporter conflict insertion and visibility; reviewer conflict resolution.
- Reviewer advisory insertion.
- Rejection of forged audit/output identities and anonymous audit writes.

To regenerate the transaction scripts from the repository root:

```powershell
node supabase/checks/build-rollback.cjs
npx supabase db query --linked --file supabase/checks/policies-rollback.sql
```

Tests require at least one existing barangay. `reconcile-rollback.sql` is only
for a database still on the September 8 baseline, not the already migrated
database. All fixtures use reserved test UUIDs and roll back.

## Auth configuration still pending

The shared account was permitted to migrate the database but received HTTP 403
when updating Auth configuration. `config.toml` declares only the intended
changes, which have NOT been applied:

- Disable public signup and email signup.
- Set Site URL to `https://project-agap.vercel.app`.
- Allow production and localhost `/auth/callback` URLs listed in the config.

A member with Auth configuration permission can review `supabase config diff`
and apply `supabase config push`. The CLI reported only those four declared
properties for update. Undeclared settings are intentionally unmanaged.

The old demonstration `seed.sql` is not a production migration and is not
compatible with every constraint of the imported official-data baseline (for
example, synthetic PSGC identifiers). Do not execute it against this project.
