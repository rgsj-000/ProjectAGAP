# Supabase, local, and Vercel setup

Do not send secret values in chat. Enter them directly in `.env.local` and Vercel's encrypted Environment Variables settings. A local file address is not used by Supabase or Vercel after the repository is pushed.

## Values you need

- Supabase project URL, anon/publishable key, and service-role key.
- Gemini API key only if controlled AI wording is enabled; the core works without it.
- Production Vercel URL/custom domain for Supabase Auth redirects.
- Optional: production SMTP, approved LGU methodology/rules, authorized Lucena datasets, and authorized advisory feeds.

The MVP supports manual verified advisory intake; PAGASA/PHIVOLCS APIs are not required.

## Supabase

1. Create a project. Singapore is normally the nearest region to Lucena; confirm data-residency policy first.
2. Save the database password securely.
3. Install Supabase CLI, then run `supabase login` and `supabase link --project-ref YOUR_REF`.
4. Run `supabase db push`. Migrations enable PostGIS, create tables/indexes/RLS, private Storage buckets, and operational actions.
5. For demonstration only, apply `supabase/seed.sql`. Never use its values operationally.
6. Enable email/password Auth. Disable open LGU signup; invite LGU users through an administrator.
7. Allow redirects for `http://localhost:3000/auth/callback`, Vercel previews, and `https://YOUR_DOMAIN/auth/callback`.
8. Create the first Auth user, then bootstrap the admin with its real UUID:

   ```sql
   insert into public.user_profiles (id, role)
   values ('AUTH-USER-UUID', 'admin');
   ```

9. Confirm private buckets: `advisory-evidence`, `damage-evidence`, and `generated-outputs`.
10. Replace all demo methodologies, rules, facilities, capacities, and contacts before operational use.

## Local development

1. Copy `.env.example` to `.env.local` and fill it in.
2. Run `npm install`, `npm test`, and `npm run dev`.
3. `DLH-P03-HH0048` works only with synthetic seed data.

## Vercel

1. Push this application directory to a private Git repository and import it as a Next.js project.
2. Use `npm run build`; no separate backend service or local path is needed.
3. Add every `.env.example` key to Preview and Production. Mark `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `AGAP_INTERNAL_SECRET` as secrets. Never prefix them with `NEXT_PUBLIC_`.
4. Set `NEXT_PUBLIC_APP_URL` independently for Preview and Production.
5. Deploy, add the resulting domain to Supabase Auth redirects, then redeploy after environment changes.
6. Smoke-test health, LGU sign-in, advisory create/verify, risk/card generation, household card, offline reconnect, conflict resolution, and post-impact card.

## Before operational use

- Ensure operational records have `is_demo=false` and remove/segregate demo records.
- Formally approve/version risk methodologies and action rules; document licenses and limitations.
- Test RLS with public, reporter, encoder, reviewer, and admin accounts.
- Configure MFA policy, SMTP, backups/PITR, monitoring, log retention, and incident response.
- Complete privacy, retention, and Data Protection Officer reviews.
- Validate official contacts and all source data.
- Field-test offline synchronization and conflict drills.
- Preserve AGAP's status as decision support; authorized officials retain emergency authority.
