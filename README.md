# Property, thoughtfully.

A single-realtor property and vehicle listings site built with Next.js App Router, TypeScript, Supabase Auth, Postgres and private Supabase Storage. The initial application contains no inventory, credentials, or real business identity. Add verified content before launch.

## Runtime and commands

- Node.js 20.9 or newer (developed with Node 24)
- npm
- `npm install`
- `npm run dev` — local development at `http://localhost:3000`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build` and `npm start`
- `npm run test:e2e` — Playwright public-page smoke and axe checks (install browser with `npx playwright install chromium`)
- `npm run db:start`, `npm run db:reset:local`, `npm run db:test`, `npm run db:types` — local Supabase tools; reset is guarded to localhost

## Local environment

Copy `.env.example` to `.env.local` and fill in a **development-only Supabase project**:

- `NEXT_PUBLIC_SUPABASE_URL` — development project's URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — project's public publishable key (legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only credential used only by allowlisted, rate-limited submission/event RPCs; never expose it to the browser
- `IP_HASH_SALT` — unique random secret for one-way IP rate-limit hashes
- `NEXT_PUBLIC_SITE_URL` — local URL, then separate preview and production canonical URLs
- `NEXT_PUBLIC_BUSINESS_NAME` — approved display name used for page titles and logo text alternatives; the supplied Evergreen Global Properties logo is shown in the header and footer
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — realtor's verified number. Enter a Nigerian number such as `080...` or `234...`; never put a real number in source code.
- `NEXT_PUBLIC_ENABLE_SHORT_LET` — emergency configuration fallback; the database setting is authoritative. Defaults to disabled.

Do not use production credentials for local development. Keep local, preview/staging, and production projects and environment variables separate. The service-role secret is required only for the server-side submission and event RPCs; never place it in a `NEXT_PUBLIC_` variable.

## Supabase setup (development first)

1. Create a Supabase project owned by the business or its designated organization. Keep production separate from development.
2. Apply the ordered migrations, including `202610070001_initial_schema.sql` and `202610070002_platform_v3.sql`, to the development project using the Supabase CLI (`supabase link` and `supabase db push`) or the SQL editor. Review the v3 migration and RLS policies before applying to any shared environment.
3. Create the initial auth user from Supabase Auth (public signup is not part of this app). Copy the UUID, then insert its admin profile using the SQL editor while signed in as project owner:

   ```sql
   insert into public.profiles (id, display_name)
   values ('AUTH_USER_UUID', 'APPROVED DISPLAY NAME');
   ```

   The profile has the `admin` role by default. Do not expose a public profile API for this table.
4. The migration creates the private `listing-media` bucket, 2 MB optimized-object limit, JPEG/PNG/WebP allowlist, and policies. Admin uploads require an authorized profile and use `listings/{listing UUID}/...`. Public signed image reads are allowed only while the parent listing is publicly visible.
5. Set the local environment variables and run the app. Sign in at `/admin/login`. Add a draft, confirm the price, location and permission for every photo, inspect its preview, and publish only after readiness checks.
6. To verify policies before launch, use one anonymous client and one admin session: anonymous listing queries must return only published rows; anonymous reads of `listing_private` and `enquiries` and writes to listings/profiles must fail; an anonymous enquiry insert with valid consent may succeed; admin CRUD must succeed; and media reads must fail for drafts and pass for published listings. Do not run these checks against production data.

The first admin profile is provisioned through the project owner SQL context because users cannot self-assign the admin role. Rotate the auth password immediately if compromised and revoke active sessions in Supabase Auth. Normal listing removal should use archived/unavailable status, not hard deletion.

## Data and operations

- Store rent/vehicle prices as numeric NGN amounts with a separate period. Unknown rental fees display as “Contact for details”; totals are never inferred.
- `listing_private` is separate from the public listing projection. Exact address is not currently shown publicly.
- Enquiries store only contact and message details needed to follow up. Server-side validation, origin checks, a honeypot, salted IP hashes, and database-side rate limits are included. Configure `IP_HASH_SALT` and `SUPABASE_SERVICE_ROLE_KEY` in each environment before enabling submissions.
- Listing image objects are private. Keep a separate backup/export of Storage objects in addition to Postgres backups; database backups do not include image binaries. Confirm storage retention and project billing with the business owner.
- No fake sample listings are seeded. Only publish information verified and approved by the realtor. The app explicitly says listings are not independently verified.
- Update privacy copy with the business's data contact, retention period, and approved legal text before launch. Configure a real phone number and test it on a phone.

## Preview and production handoff

Use a separate Supabase staging project and hosting preview variables. Before production: configure a business-owned hosting/Supabase account, approved domain and HTTPS, auth redirect URLs, verified business name/contact, rights-cleared images and listing details, fees and availability, the privacy contact/notice, backups for Postgres and image storage, and an incident/contact process. Verify RLS using anonymous and admin clients, test mobile and keyboard journeys, and check WhatsApp on a real device. No project has been deployed and no migration has been applied by this repository setup.

## Current limits

This is an MVP starting point. Short-let enablement is controlled in site settings; currency is NGN in the first admin form. Filter results are bounded, URLs preserve selected filters, and additional pages use page links. Supabase and credentials are not included, so connected authentication, persistence, storage, rate limits, and RLS must be verified in the owner's development project before launch.
