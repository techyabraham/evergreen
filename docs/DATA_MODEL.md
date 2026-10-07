# Data model

`listings` stores shared listing identity, public status, price and location. `property_details` and `vehicle_details` store category-specific fields. `listing_fees` records fee type, known/unknown/not-applicable state, amount, cadence and disclosure notes. `listing_images` stores display and thumbnail paths, dimensions, alt text and ordering. `listing_private` is admin-only for exact addresses and internal notes.

`locations`, `property_types`, and `amenities` are controlled taxonomies. Listing status transitions are recorded in `listing_status_events`; readiness is computed before publication. `site_settings` holds business configuration with public column grants limited to fields used by the site. `enquiries`, `listing_reports`, `contact_events`, and `rate_limits` support operations and abuse controls.

Prices use NGN in current admin forms. Rental periods are explicit; unknown fees stay unknown. Public totals are never inferred from missing fees.
