# Admin and listing search redesign

## UX direction

- Keep the dashboard at-a-glance: separate property, vehicle, enquiry, and draft counts, with recent work below.
- Give property and vehicle inventory separate tabs, result lists, create flows, and edit fields. Keep category immutable after a listing is created so incompatible fields and records cannot be mixed by a form submission.
- Put common search and price/sort controls first. Place less-used specifications behind a clearly named, keyboard-operable “More filters” section. Keep selected query filters visible as removable chips and provide a single clear-all action.
- Use result count/context, a useful empty state, and responsive grouped controls so the same workflow is legible on narrow screens.
- Treat image management as a small media workspace: multi-file selection, client-side preview/resize, visible progress/errors, accurate alt text, cover selection, keyboard-accessible ordering and removal.

This follows Baymard's product-list research: people need clear filtering and sorting, an overview of applied filters, and a quick way to remove one filter or clear all. See [product listing and filtering research](https://baymard.com/research/ecommerce-product-lists) and [applied-filter overview guidance](https://baymard.com/research-articles/how-to-design-applied-filters). These are general interaction patterns applied to this realtor's narrower inventory, not a marketplace design.

## Engineering direction

- Keep all listing writes behind server actions that call `requireAdmin`, validate the payload, enforce listing ownership, and report errors without logging image contents or private listing fields.
- Resize images in the browser before upload. Store a display image and thumbnail, constrain their sizes, validate content signatures on the server, remove EXIF/GPS metadata through canvas re-encoding, and cap each listing at 20 photos.
- Keep the existing private `listing-media` bucket and admin-only Storage policies. Do not expose a service-role key to the browser.
- Limit Server Action request size to 6 MB. The upload workflow submits one already-compressed photo and its thumbnail at a time, allowing a batch to show per-photo progress while staying within that cap.
- Keep search filters in URL query parameters so searches can be bookmarked and pagination preserves criteria. Property and vehicle filter sets remain category-specific.

The installed Next.js 16 guide warns that Server Actions are reachable endpoints and must authenticate and authorize each request. Its configuration guide documents a default 1 MB body limit; this project uses 6 MB to accommodate two compressed image files capped at 2 MB each plus metadata. See [Next.js forms](https://nextjs.org/docs/app/guides/forms), [Server Action security](https://nextjs.org/docs/app/guides/data-security), and [Server Action body-size configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions).

Supabase Storage requires policies on `storage.objects` for uploads and recommends using the Storage API for object operations. The existing migration limits the bucket's MIME types and size and restricts object access to admins. See [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [bucket fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## Verification limits

Typecheck, lint, and production build are run after the implementation. No live Supabase upload was attempted because this change must not write to the production database or Storage. Browser-level upload, mobile interaction, and visual checks remain staging/manual verification.
