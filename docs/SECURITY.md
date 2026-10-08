# Security notes

- Keep `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, email secrets and bot-verification secrets in server-only environment variables.
- `lib/data/public-submissions.ts` is the sole service-role importer. It calls only fixed RPCs for submissions/events.
- Never render `listing_private` values publicly. Public listing reads are limited by RLS to current and recently closed records; active inventory uses `published` and `under_offer`.
- Admin access requires both a verified Supabase Auth session and `profiles.role = 'admin'`.
- Public input is schema-validated in server actions/RPCs. Database-side throttles use one-way, salted IP hashes.
- Listing storage is private. Public photos are signed only after a row passes public RLS; metadata and EXIF are stripped during re-encoding.
- Demo image rows use reserved paths resolved to illustrative Unsplash CDN URLs. Demos are marked in the public UI, excluded from listing JSON-LD and sitemap entries, and rejected by enquiry/report/contact-event RPCs. Replacing the stock photos with real inventory requires approved images and an ordinary admin upload.
- Response headers include clickjacking, MIME sniffing and referrer protections plus a restrictive CSP. Review the CSP against the selected hosting provider and any third-party integrations before enabling them.
- The v3 migration has not been applied in this environment. Review and run it against a development Supabase project, then verify RLS and storage using both anon and admin identities before launch.

## RLS access matrix (intended policy)

| Data | Anonymous | Authenticated non-admin | Admin |
|---|---|---|---|
| Current published/under-offer listings and their public children | Read | Read | Full management |
| Recently closed listings | Read only during configured visibility window | Same | Full management |
| Active locations, property types and amenities | Read | Read | Manage |
| Public site settings | Listed public columns only | Listed public columns only | Read/update |
| Exact addresses and owner/VIN/internal notes | Denied | Denied | Read/update |
| Enquiries, reports, contact events, rate limits, status history | Denied | Denied | Read/update |
| Listing media | Read for publicly visible parent listings; writes denied | Same | Upload/update/delete under listing paths |
| Public submissions and event logging | No table access; fixed RPC path only via server | No direct write | Admin operations |

This matrix describes the migration's intended policy. It remains **not verified against a running database** until `supabase db reset` and the anon/non-admin/admin test matrix pass.
