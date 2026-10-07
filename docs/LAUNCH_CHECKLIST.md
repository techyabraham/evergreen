# Launch checklist

- [ ] Confirm legal business name, realtor identity, phone, WhatsApp, email, address display and approved biography.
- [ ] Create separate development, staging and production Supabase projects; apply and review migrations in development first.
- [ ] Verify public/admin RLS, storage visibility, status transitions and submission throttles with anon/admin accounts.
- [ ] Set production-only secrets and canonical URL; confirm HTTPS, auth redirect URLs, domain ownership and backups.
- [ ] Add verified listings, fee states, rights-cleared photos and accurate photo alt text.
- [ ] Review privacy notice, retention period, safety wording and contact destination with the business owner.
- [ ] Run typecheck, lint, unit tests, build, database tests, Playwright, axe, Lighthouse and mobile/keyboard checks.
- [ ] Test enquiry, report, WhatsApp and phone flows on real devices; confirm no staging data is indexed.
- [ ] Review vulnerability audit and hosting logs; establish an incident contact and credential-rotation process.

Launch remains blocked until the owner supplies identity/contact/content and an isolated development Supabase project is available for migration and RLS verification.
