# Security Policy

## Scope

StoreFront is a static, front-end-only demo. There is no backend, no database,
no authentication and no payment processing. The only client-side state is the
cart and theme in `localStorage`, which never leaves the browser.

Within that scope, security means:

- **CSP** — every page ships a `Content-Security-Policy` meta tag allowing only
  same-origin scripts, styles, images and fonts. No inline scripts, no third-party
  origins, `object-src 'none'`, `base-uri 'self'`.
- **Self-hosted fonts** — typography is served from this repository, so no request
  (and no visitor IP) is shared with Google or any other CDN.
- **XSS hygiene** — every string interpolated into HTML by `js/ui.js` goes through
  the `esc()` helper; URLs built from user input (search terms, slugs, ids) are
  `encodeURIComponent`-encoded.
- **Storage validation** — `localStorage` payloads for the cart and wishlist are
  parsed defensively and validated against the catalogue before use, so tampered
  values degrade quietly instead of reaching the renderer.
- **Supply chain** — no runtime dependencies at all; dev dependencies (test tooling)
  are pinned in `package.json` and kept out of the shipped site.

## Reporting a Vulnerability

This is a portfolio project with no users or data, but reports are still welcome.
Please use [GitHub private vulnerability reporting](../../security/advisories/new)
on this repository. Include a description, a reproduction (URL + steps), and, if
relevant, the browser you tested in. You will get a response within a few days.
