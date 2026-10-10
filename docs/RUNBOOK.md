# Runbook

## Local development

1. Install Node 24 and npm dependencies.
2. Copy `.env.example` to `.env.local`; use a dedicated development Supabase project or the local stack only.
3. Start local Supabase with `npm run db:start`. Reset local data only with `npm run db:reset:local`.
4. Run `npm run dev` and sign in at `/admin/login` after provisioning an admin profile.

## Routine operations

- Confirm availability and fee details before publishing; check readiness and preview.
- Review new enquiries and reports in Admin. Use archived status for withdrawn inventory.
- For a property request, contact the person using their selected channel and move the enquiry through New → Contacted → Inspection arranged → Closed (or Spam). CSV export is restricted to an admin session.
- For a stale report, inspect the listing and reporter details. Confirm directly with the realtor; a visitor report does not automatically hide inventory.
- Reconfirm listing status on the configured freshness interval; stale hiding is controlled in site settings.
- To mark rented/sold, use the status control after confirming the transaction. To relist a closed record, return it to draft, enter a reason, then republish. Availability confirmation is optional for publication; only enter it after checking.
- Purge leads only after confirming the retention policy with the privacy contact. Run the purge RPC first in dry-run mode, review the count, then use apply mode.
- Add an area through Admin → Locations with the correct parent; do not add a duplicate slug under that parent.
- To change WhatsApp, update Site settings with a verified international or Nigerian number, save, then test both the public CTA and a real phone.
- Keep database backups and a separate backup of private Storage objects.
- Review deletion/retention settings for enquiries with the business privacy contact.

## Incident response

For a leaked credential: rotate it in Supabase/hosting, revoke sessions if an auth credential was exposed, inspect audit logs, and review recent admin/status/contact activity. For compromised media, remove affected objects and re-upload approved copies. Do not investigate or test against production without the business owner's incident authorization.
