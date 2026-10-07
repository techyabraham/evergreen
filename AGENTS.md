# Project rules

## Mission
Build a mobile-first property and vehicle website for one Nigerian realtor, with a private admin dashboard and enquiry system. This is not a marketplace.

## Non-negotiables
- Do not invent listings, prices, testimonials, ratings, credentials, identity, or integrations. Missing data gets a deliberate empty state or setting.
- Show availability and inspection claims only when backed by recorded dates. Never imply independent verification.
- Do not print, log, commit, or expose secrets. Maintain `.env.example`; do not create `.env.local`.
- Do not perform production database writes, destructive remote operations, deployment, messages, or purchases without explicit authorization.
- Enforce security in database policies and server code. UI visibility is not authorization.
- Keep exact addresses, owner contacts, VIN, internal notes, leads, and IP hashes out of anonymous data, public view models, client props, HTML, logs, and sitemap.
- Report checks only after running them. Record unavailable checks with the reason and manual command.
- Do not copy competitor listings, text, images, logos, or branding. Patterns only.

## Method
- Maintain `docs/EXEC_PLAN.md`, `docs/ASSUMPTIONS.md`, and `docs/DECISIONS.md`; update progress as work proceeds.
- Inspect and preserve existing code when practical. Log consequential changes.
- Verify APIs against installed versions. This app uses Next.js 16 App Router with `proxy.ts`, React 19, Supabase JS and `@supabase/ssr`.
- Every action/handler authenticates when required, authorizes, validates, acts, and revalidates.
- Use strict TypeScript, Zod validation, pure domain helpers with unit tests, and server-only boundaries for privileged modules.
- Do not add scope-changing dependencies without a documented reason.
- Meet semantic HTML, visible focus, keyboard access, 44px primary touch targets, and reduced-motion expectations.

## Completion
Run lint, typecheck, unit tests, and build. Run relevant database/E2E checks when local services are available. Separate code-complete from launch-ready and list manual steps and risks. Never claim production-ready while credentials, RLS verification, real content, backups, or deployment checks remain outstanding.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
