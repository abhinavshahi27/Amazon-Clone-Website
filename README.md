# StoreFront 🛍️

A responsive e-commerce storefront UI, hand-built with semantic HTML, modern CSS and vanilla
JavaScript — no frameworks, no build step, no runtime dependencies.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

---

## 📸 Overview

StoreFront is a fictional shop built as a front-end portfolio project. It covers the patterns a
real storefront needs — a sticky header with live search, a hero, a filterable department grid,
product detail pages, a wishlist, an add-to-cart flow with animated feedback, and a layered
footer — while staying a static site that anyone can open straight from disk.

It is a **design demo**: nothing is for sale, no form submits anywhere, and the page does not
collect, store or transmit any data.

---

## ✨ Features

**Pages**
- **Home** — hero, store promises, department grid, live product matches while searching, and a trending strip
- **Department pages** — one per category via `category.html?c=<slug>`; search, sort and the
  on-sale filter are mirrored into the URL (`?q=&sort=&sale=`), so every view is shareable
  and survives a reload
- **Product pages** — `product.html?p=<id>` with quantity stepper, wishlist toggle, related
  items and JSON-LD structured data
- Unknown slugs and ids fall through to proper "not found" pages

**Cart & wishlist**
- Cart persisted to `localStorage`; slide-in drawer with line items, quantity steppers,
  per-line and running totals; badge count syncs on every page
- Add-to-cart flies the product art into the cart button; removed lines collapse shut;
  changed quantities roll; new lines slide in
- Wishlist with the same persistence pattern: heart toggles on every card, a synced badge,
  and its own drawer with add-to-cart
- Both stay in sync across browser tabs via the `storage` event

**Catalogue**
- 96 products across 8 departments in `js/data.js`, validated and frozen at boot so a bad
  data edit warns in the console instead of crashing mid-grid
- Per-department sorting (featured, price, rating, name) and an on-sale filter
- Header search filters departments **and** surfaces matching products on the home page
- Product art is generated on the fly — a hand-drawn SVG icon matching each product's name
  (96 unique icons), a per-product hue and one of six backdrop patterns on a CSS gradient tile
- Prices throughout the store are formatted in Indian Rupees (₹) with en-IN digit grouping

**Motion (all disabled under `prefers-reduced-motion`)**
- View Transitions: the theme toggle cross-fades the whole page, and navigating between
  pages morphs the hero image (progressive — unsupported browsers just navigate)
- Pointer-following 3D tilt on product and category cards, staggered hero entrance,
  floating hero badge, scroll parallax, and a scroll-driven reading progress bar

**Security**
- Content-Security-Policy on every page: same-origin scripts, styles, images and fonts;
  `object-src 'none'`; `base-uri 'self'`. No inline scripts and no third-party origins
- Self-hosted variable fonts — the site makes **zero third-party requests**
- All rendered strings escaped; all user-derived URLs encoded; `localStorage` payloads
  validated against the catalogue before use

**PWA**
- `manifest.webmanifest` + a service worker (network-first navigations, stale-while-revalidate
  assets) make the site installable and fully usable offline

**Layout & design**
- Custom design system driven by CSS custom properties; light and dark themes following the
  OS with a manual toggle that remembers your choice
- Fluid type and spacing via `clamp()`; colour tokens tuned to WCAG AA contrast in both themes

**Responsive**
- Mobile-first grids with explicit breakpoints at 940px, 680px and 420px
- Below 940px the primary nav becomes a JS-injected slide-in drawer with a scrim,
  `Escape` to close, focus trapping, and focus return

**Accessibility & robustness**
- Skip link, visible focus rings, ARIA labels on icon-only controls, `aria-live` for result
  counts, `role="dialog"` + focus traps on drawers, `aria-pressed` on toggles
- Progressive enhancement: with JavaScript disabled the home page still renders completely
- Every `localStorage` read and write is wrapped, so private mode and blocked storage degrade quietly

---

## 🗂️ Project Structure

```
StoreFront/
├── index.html              # Home page
├── category.html           # Department page, driven by ?c=<slug>
├── product.html            # Product page, driven by ?p=<id>
├── style.css               # Design tokens, components, responsive rules, motion
├── sw.js                   # Service worker (offline shell)
├── manifest.webmanifest    # PWA manifest
├── robots.txt / sitemap.xml
├── js/
│   ├── preboot.js          # Pre-paint `js` class (keeps the CSP free of inline scripts)
│   ├── data.js             # Product catalogue (96 products, 8 departments)
│   ├── store.js            # Cart state + localStorage persistence + catalogue validation
│   ├── wishlist.js         # Wishlist state, same pattern as the cart
│   ├── ui.js               # Shared: theme, drawers, cart/wishlist UI, toast, motion extras
│   ├── home.js             # Home page: department search + product matches
│   ├── category.js         # Department page: render, sort, filter, URL sync
│   └── product.js          # Product page: render, stepper, related items, JSON-LD
├── assets/
│   ├── fonts/              # Self-hosted variable fonts (Inter, Plus Jakarta Sans)
│   ├── icons/              # PWA icons (192/512)
│   ├── logo.svg / favicon.svg
│   └── *.jpg               # One photograph per department
├── tests/smoke.spec.js     # Playwright smoke suite (14 tests)
└── .github/workflows/      # CI: Biome lint + Playwright + Lighthouse; weekly CodeQL
```

All pages load the same scripts in order: `data` → `store` → `wishlist` → `ui` → page script.
The nav drawer, back-to-top button, reading progress bar, cart drawer and wishlist drawer are
injected by `ui.js` (they are useless without JS anyway), while the header, footer and SVG
sprite stay static so the pages degrade gracefully.

---

## 🚀 Getting Started

No build tools or runtime dependencies required.

**1. Clone the repository**
```bash
git clone https://github.com/abhinavshahi27/Amazon-Clone-Website.git
cd Amazon-Clone-Website
```

**2. Serve it**

Opening `index.html` directly works, but a local server is closer to production
(and enables the service worker):

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

**3. Optional: run the checks**

Lint and browser tests need the dev tooling (kept entirely out of the shipped site):

```bash
npm install
npm run lint        # Biome over js/ and tests/
npm test            # Playwright smoke suite against a local server
npx @lhci/cli autorun   # Lighthouse with budgets from lighthouserc.json
```

CI runs the same three jobs on every push, plus a weekly CodeQL scan.

---

## 🔒 Security & Licensing

See [SECURITY.md](SECURITY.md) for the security scope and how to report anything.
The code is released under the [MIT License](LICENSE).

---

## 🛠️ Built With

- **HTML5** — semantic structure, inline SVG sprite, CSP meta tag
- **CSS3** — custom properties, Grid, Flexbox, `clamp()`, scroll-driven animations,
  View Transitions, `@starting-style`-style filter fades
- **JavaScript (ES5-style)** — no framework, no bundler, no runtime dependencies;
  modern APIs (IntersectionObserver, Web Animations, View Transitions, Service Worker)
  used strictly as progressive enhancements behind feature checks
- **Self-hosted fonts** — Inter and Plus Jakarta Sans variable fonts in `assets/fonts/`

---

## 📌 Note

"StoreFront" is a fictional brand invented for this project. It is built purely for **educational
and portfolio purposes**, is not a real shop, and is not affiliated with or endorsed by any
retailer. All product photography is generic stock imagery used as placeholder content.

---

## 🙋‍♂️ Author

**Abhinav Pratap Shahi**  
[GitHub](https://github.com/abhinavshahi27)
