# Mobile experience research and implementation notes

## Sources

- [MDN: Responsive design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) explains fluid layouts, mobile-first breakpoints, viewport sizing and the use of Grid/Flexbox to adapt content rather than scale a desktop page down.
- [MDN: Mobile accessibility](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/Mobile) highlights touch controls, reducing typing effort, legible layouts and appropriately sized images on slower/smaller devices.
- [W3C WAI: WCAG 2.2 target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) defines the AA minimum target as 24 by 24 CSS pixels with a spacing exception. The app aims higher for primary controls.
- [web.dev: Accessible tap targets](https://web.dev/articles/accessible-tap-targets) recommends roughly 48 by 48 device-independent pixels and spacing around targets for touch use.

## Applied decisions

- Preserve the same site content, routes, search options, and property/vehicle separation; change layout and interaction ergonomics for narrow screens.
- Use a compact route-aware mobile navigation with a clear expanded state, keyboard dismissal, and 48px touch target.
- Keep homepage search prominent, let city cards and listing collections scroll horizontally with snap points, and keep result grids single-column at phone widths.
- Let listing detail photos swipe horizontally and retain all photos; show a visible swipe cue and photo count.
- Keep key property actions ahead of long detail copy on a phone, while retaining desktop's two-column layout.
- Use minimum 48px primary mobile controls and 16px form text to improve touch usability and avoid forced zoom in mobile Safari. Preserve browser zoom.
- Convert admin inventory rows to labeled cards on phone widths so the user does not need to pan a wide table; retain the semantic table for larger screens.
- Respect safe-area insets and reduced-motion preferences. Avoid fixed controls that cover content or rely on hover.

## Validation approach

Manual browser review covered 320px and 390px CSS widths on the home, property results, vehicle results, about, request, contact and admin login routes. These routes had no horizontal overflow. The mobile menu was opened, navigated with, and confirmed to close on route change. Home hero/search geometry was checked at both widths; listing gallery markup retains all photos and exposes a swipe cue. Admin inventory cards were verified in markup and CSS, but its authenticated rendered view was not available in this session. Typecheck, lint and production build passed. Tests were not run.

This is not a substitute for review on physical iOS and Android devices, at intermediate tablet widths, with browser zoom, screen readers, slow network conditions, or authenticated admin data. Those checks remain before launch.
