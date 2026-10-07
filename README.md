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

## Local environment

Copy `.env.example` to `.env.local` and fill in a **development-only Supabase project**:

- `NEXT_PUBLIC_SUPABASE_URL` — development project's URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — project's public anon/publishable key; RLS protects exposed data
- `NEXT_PUBLIC_SITE_URL` — local URL, then separate preview and production canonical URLs
- `NEXT_PUBLIC_BUSINESS_NAME` — approved display name; when blank, the site uses a temporary wordmark
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — realtor's verified number. Enter a Nigerian number such as `080...` or `234...`; never put a real number in source code.
- `NEXT_PUBLIC_ENABLE_SHORT_LET` — set to `false` to hide, filter out, and prevent publishing short-let listings. Defaults to enabled.

Do not use production credentials for local development. Keep local, preview/staging, and production projects and environment variables separate. The application does not need a Supabase service-role secret.

## Supabase setup (development first)

1. Create a Supabase project owned by the business or its designated organization. Keep production separate from development.
2. Apply `supabase/migrations/202610070001_initial_schema.sql` to the development project using the Supabase CLI (`supabase link` and `supabase db push`) or the SQL editor. Review SQL and RLS policies before applying to any shared environment.
3. Create the initial auth user from Supabase Auth (public signup is not part of this app). Copy the UUID, then insert its admin profile using the SQL editor while signed in as project owner:

   ```sql
   insert into public.profiles (id, display_name)
   values ('AUTH_USER_UUID', 'APPROVED DISPLAY NAME');
   ```

   The profile has the `admin` role by default. Do not expose a public profile API for this table.
4. The migration creates the private `listing-media` bucket, 8 MB per-file limit, JPEG/PNG/WebP allowlist, and policies. Admin uploads require an authorized profile and use the listing UUID as the first path segment. Public signed image reads are allowed only while the parent listing is published.
5. Set the local environment variables and run the app. Sign in at `/admin/login`. Add a real draft, confirm the price, location and permissions for every photo, inspect its preview, and publish only after checks.
6. To verify policies before launch, use one anonymous client and one admin session: anonymous listing queries must return only published rows; anonymous reads of `listing_private` and `enquiries` and writes to listings/profiles must fail; an anonymous enquiry insert with valid consent may succeed; admin CRUD must succeed; and media reads must fail for drafts and pass for published listings. Do not run these checks against production data.

The first admin profile is provisioned through the project owner SQL context because users cannot self-assign the admin role. Rotate the auth password immediately if compromised and revoke active sessions in Supabase Auth. Normal listing removal should use archived/unavailable status, not hard deletion.

## Data and operations

- Store rent/vehicle prices as numeric NGN amounts with a separate period. Unknown rental fees display as “Contact for details”; totals are never inferred.
- `listing_private` is separate from the public listing projection. Exact address is not currently shown publicly.
- Enquiries store only contact and message details needed to follow up. An off-screen honeypot and a small per-process request throttle are included. The in-memory throttle is best effort on multi-instance hosting; add a managed rate-limit service before a public launch with meaningful traffic.
- Listing image objects are private. Keep a separate backup/export of Storage objects in addition to Postgres backups; database backups do not include image binaries. Confirm storage retention and project billing with the business owner.
- No fake sample listings are seeded. Only publish information verified and approved by the realtor. The app explicitly says listings are not independently verified.
- Update privacy copy with the business's data contact, retention period, and approved legal text before launch. Configure a real phone number and test it on a phone.

## Preview and production handoff

Use a separate Supabase staging project and hosting preview variables. Before production: configure a business-owned hosting/Supabase account, approved domain and HTTPS, auth redirect URLs, verified business name/contact, rights-cleared images and listing details, fees and availability, the privacy contact/notice, backups for Postgres and image storage, and an incident/contact process. Verify RLS using anonymous and admin clients, test mobile and keyboard journeys, and check WhatsApp on a real device. No project has been deployed and no migration has been applied by this repository setup.

## Current limits

This is an MVP starting point. Short-let enablement is environment-configured; currency is NGN in the first admin form. Filter results are bounded, URLs preserve selected filters, and additional pages use page links. Supabase and credentials are not included, so connected authentication, persistence, storage, rate limits, and RLS must be verified in the owner's development project before launch.
