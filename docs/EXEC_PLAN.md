# Execution plan

## Goal
Upgrade the existing single-realtor Next.js/Supabase app to the attached Realtor Platform Execution Kit v3 while preserving a runnable application and documenting any checks blocked by absent credentials or local services.

## Milestones
- [x] M0 — Inspect repository, baseline, architecture, assumptions, and risks.
- [x] M1 — Foundation: scripts, environment docs, accessible shell, CI, headers.
- [ ] M2 — Schema v3: normalized fees/locations/reference data, status/readiness, RLS, RPCs, storage, seeds/tests.
- [ ] M3 — Domain: pricing/fees, phones/WhatsApp, routes, slugs/references, status, freshness/readiness, search.
- [ ] M4 — Public website: property route grammar, cars, closed listings, requests, safety, public detail UX and SEO.
- [ ] M5 — Enquiries, reports, events, privacy-safe abuse controls.
- [ ] M6 — Admin authorization, settings and location management.
- [ ] M7 — Listing workflow, readiness, fees, image metadata and lifecycle.
- [ ] M8 — Reports, enquiry operations, share tools and analytics.
- [ ] M9 — SEO, accessibility, performance and security hardening.
- [ ] M10 — Run available gates, self-audit, docs, and launch handoff.

## Progress log
- 2026-10-10 — Relaxed listing publication: a title and one cover photo are sufficient; price, location, descriptive copy, subtype facts, availability confirmation, fees, and photo description are optional. Added migration `202610100001_minimal_listing_publication.sql`; it has not been applied remotely. Public pages use explicit “on request”/unknown wording for missing facts. Typecheck, targeted lint, and production build pass; tests and remote database migration were not run.
- 2026-10-07 — M0 inspected the clean initial commit. Existing app uses Next 16.4, React 19, Supabase SSR, Supabase JS, Zod and Vitest. Baseline checks are recorded below. Keep-and-extend selected; no real inventory or credentials were present.
- 2026-10-07 — M1 foundation and the core M2–M9 code paths implemented: scripts/CI, nonce CSP, responsive shell, v3 migration/RPCs/RLS, domain helpers, public routes/forms, admin tools, share cards, CSV export and first-party analytics. Several milestone acceptance items remain incomplete or unverified; see the current state below.
- 2026-10-07 — Corrected the v3 location seed SQL after the owner reported a duplicate table alias and invalid value-column references. After the owner reported a second hosted SQL error, made the `price_period` conversion drop and recreate the dependent generated `sort_price` column in the right order. The owner later reported that the v3 migration applied successfully; it was not independently verified here.
- 2026-10-07 — Added a separate migration for three clearly labeled fictional demo properties, one each in Ibadan, Lagos, and Abuja, with illustrative stock image mappings and guards that keep demos out of availability/enquiry/report workflows. No remote migration was run; the demo migration requires an existing admin profile and remains to be pushed by the owner.
- 2026-10-08 — Updated public home and metadata copy to present all three stated service cities; removed the remaining Lagos-only presentation label and updated demo content/docs to cover all three cities. `npm run typecheck`, `npm run lint`, and `npm run build` passed after these edits; tests were not run.
- 2026-10-08 — Reworked admin overview and category-separated inventory/create/edit flows; upgraded listing photo batching and management; grouped property/vehicle filters, preserved URL criteria in pagination, and added removable active-filter chips. Research sources and engineering decisions: `docs/ADMIN_RESEARCH.md`. Typecheck, lint, and production build passed; tests and live Supabase upload were not run.
- 2026-10-09 — Improved admin photo-upload discoverability: new listings save as private drafts and redirect directly to the photo manager; the edit page now places the photo manager before the long detail form and provides a visible jump link and numbered workflow labels. `npm run typecheck`, `npm run lint`, and `npm run build` passed. No live upload was attempted.
- 2026-10-10 — Refreshed public discovery around property: home search now captures rent/buy intent, city and keywords; added direct Ibadan/Lagos/Abuja entry cards; rebuilt the main property results page with grouped filters, removable active criteria, and improved empty states; refined listing, detail, form, header and responsive styling. Research patterns are documented in `docs/ADMIN_RESEARCH.md`. `npm run typecheck`, `npm run lint`, and `npm run build` passed. Local browser review confirmed no horizontal overflow at 320px and 390px, and the homepage rent/buy + city search navigates to the matching query. Live content/database and production deployment were not changed.

## Baseline
- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm test`: PASS, 6 tests (requires an unsandboxed subprocess on Windows due to Vite path resolution)
- `npm run build`: PASS
- Repository was a clean Git repository at `573c755 Initial commit`.

## Risk register
1. No Supabase project/keys: live RLS, storage, auth and RPC behavior cannot be verified here.
2. No realtor intake: identity, contacts, locations, fee policy, safety copy and inventory remain unset.
3. v3 database contract is a major schema change; migration must be reviewed/applied to a development project first.
4. Service-role RPC path is security-sensitive; key must remain server-only and use limited RPCs.
5. Staleness can hide listings when auto-hide is enabled; publication requires a title and one accurately cover-marked photo.
6. Image conversion relies on browser codec support; HEIC conversion is not guaranteed in every browser.
7. RPC rate limits need DB-side enforcement and realistic concurrency tests.
8. No local Supabase CLI/Docker/database may be available; SQL gates may be NOT EXECUTED.
9. No staging account/domain to verify external hosting, auth redirects, or email/Turnstile.
10. Performance, Lighthouse, axe and mobile device checks require browser tooling/data beyond compilation.

## Gates
Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run `npm run db:test` / `npm run test:e2e` only when their local services and binaries are available. Document real outcomes in M10.

## Current implementation and verification state

- M1: implementation complete. Browser smoke verified on a dedicated local port; one axe check covers home, request and safety pages. Mobile overflow checked at 320, 375, 768 and 1280 px. Broader keyboard/visual review remains.
- M2: v3 migration, policy changes, RPCs, reference data and pgTAP smoke tests are written. The owner reported that v3 applied to the linked project. Follow-up migrations for demo content and minimal listing publication are written but not applied. No database operation was run here. A working local Supabase/Docker database is unavailable for verification. Generated database types are still mostly from the pre-v3 schema.
- M3–M9: major pieces are implemented, but each has remaining acceptance gaps: domain coverage is not measured at 90%; the app currently queries public tables directly rather than routing all search through the SQL functions; Turnstile and Resend are env placeholders only; no Quick Post/autosave/duplicate flow; no full admin/data-backed E2E suite; no Lighthouse run; admin RLS and storage behavior are unverified.
- M10: available gates and the implementation self-audit are recorded below. Database, generated types, migration replay, hosted staging, Lighthouse and authenticated admin E2E remain manual gates.

### Latest checks

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 21 tests across 3 files.
- `npm run build`: PASS; optimized build, TypeScript, and 24 static pages completed. Initial restricted run hit `spawn EPERM`; rerun with process permissions passed.
- `npm run test:e2e`: PASS, 3 tests; home/request/safety axe checks, response headers/CSP, keyboard menu, and no horizontal overflow at 320/375/768/1280.
- `npm audit`: PASS, zero reported vulnerabilities (also confirmed with `npm audit --omit=dev`).
- `npm run db:reset:local`, `npm run db:test`, `npm run db:types`: NOT EXECUTED; no Supabase CLI or usable Docker daemon.

### Known gaps before calling this release candidate complete

1. Apply/replay migrations against an isolated Supabase dev database; resolve SQL, pgTAP, RLS, Storage and advisor findings; regenerate and commit types.
2. Add sample-only local fixtures or document why database-driven E2E scenarios need owner-managed auth fixtures.
3. Finish missing operations and acceptance work: Turnstile/Resend, Quick Post, duplicate-as-draft, autosave, detailed readiness UI, full admin and lead lifecycle E2E, broad axe, Lighthouse, image-orphan review, and JSON-LD/SEO validation.
4. Confirm business identity, contacts, service areas, approved copy, privacy retention/legal wording, inventory and photo rights; deploy and verify staging only after these are supplied.
