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
