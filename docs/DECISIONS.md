# Decisions

## Keep and extend the existing app
The repository is a clean, runnable Next.js 16 App Router application with Supabase Auth/Storage, a strict TypeScript base, validation and public/admin routes. Replacing it wholesale would discard working code without a benefit. Keep the root `app/`, `components/`, and `lib/` organization for now; the kit's proposed `src/` layout is illustrative, not a runtime requirement.

## Framework conventions
- Follow installed Next.js 16 conventions: async route params where needed and `proxy.ts` for request/session refresh.
- Use the installed Supabase SSR client pattern. Public data access must not load session cookies; admin access uses the cookie session.
- Do not rely on unavailable Cache Components APIs; use a supported cache API only after verifying it in the installed release.

## Database migration strategy
Keep the existing initial migration immutable and add ordered v3 migrations that migrate its tables. No migration is applied by this work. Fresh local databases run the ordered migrations; shared development projects require review before apply.

## Dependencies
Existing: Next.js/React, Supabase SSR/JS, Zod, TypeScript, ESLint, Vitest. Add only packages needed by an implemented feature, and record the reason here. Avoid UI, analytics, and image-processing services that require accounts or add unnecessary client weight.

## Browser and accessibility checks
Playwright and axe-core Playwright are development dependencies because the execution kit requires local end-to-end smoke coverage and automated accessibility checks. They do not add client bundle code.

## Public demonstration content
Three fictional examples, one each in Ibadan, Lagos, and Abuja, may be published only as demo records. The schema flags them, the UI prominently labels them, suppresses availability/enquiries/SEO structured data, and the database RPCs reject lead/report submissions. Generic Unsplash photos are labeled illustrative and mapped from reserved demo asset paths; they are not property photos. The demo migration requires an existing admin profile so each listing has an accountable `created_by` reference.

## Admin and listing search workflows
Admin inventory is separated into property and vehicle workspaces. Creation starts with a type choice, edit fields are category-specific, and the server rejects category changes after creation. Image batches are optimized in-browser and then validated/uploaded through authenticated admin actions against the existing restricted Storage bucket. The action body cap is 6 MB to accommodate a display image, thumbnail, and metadata while keeping the old 85 MB allowance out of the request path. Public search uses grouped primary/advanced filters, URL-backed criteria, removable active-filter chips, and explicit clear-all controls. Research and sources are recorded in `docs/ADMIN_RESEARCH.md`.
