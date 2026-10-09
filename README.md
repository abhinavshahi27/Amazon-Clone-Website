# StoreFront 🛍️

A responsive e-commerce storefront UI, hand-built with semantic HTML, modern CSS and vanilla
JavaScript — no frameworks, no build step, no dependencies.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## 📸 Overview

StoreFront is a fictional shop built as a front-end portfolio project. It covers the patterns a
real storefront needs — a sticky header with live search, a hero, a filterable department grid,
product cards with an add-to-cart flow, and a layered footer — while staying a single static page
that anyone can open straight from disk.

It is a **design demo**: nothing is for sale, no form submits anywhere, and the page does not
collect, store or transmit any data.

---

## ✨ Features

**Pages**
- **Home** — hero, store promises, department grid and a trending strip
- **Department pages** — one per category via `category.html?c=<slug>`, so every
  department has its own shareable, bookmarkable URL with no build step
- Unknown slugs fall through to a proper "department not found" page

**Cart**
- Persisted to `localStorage`, so it survives navigating between pages and reloads
- Slide-in drawer with line items, quantity steppers, per-line and running totals
- Remove, empty-cart, and an empty state; badge count syncs on every page
- Stays in sync across browser tabs via the `storage` event

**Catalogue**
- 96 products across 8 departments in `js/data.js`
- Per-department sorting (featured, price, rating, name) and an on-sale filter
- Header search filters departments on the home page and products on a department page
- Product art is generated from CSS gradients — a per-product hue and one of six
  backdrop patterns — so no placeholder photography is needed

**Layout & design**
- Custom design system driven by CSS custom properties — one token block controls the whole palette
- **Light and dark themes**, following the OS by default with a manual toggle that remembers your choice
- Fluid type and spacing via `clamp()`, so headings scale smoothly instead of stepping between breakpoints
- Gradient brand treatment, custom SVG logo mark, and an animated morphing blob behind the hero

**Responsive**
- Mobile-first grids using `auto-fill`/`minmax()` plus explicit breakpoints at 940px, 680px and 420px
- Below 940px the primary nav becomes a slide-in drawer with a scrim, `Escape` to close, and focus handling
- Below 680px the search bar reflows onto its own row and the cart drawer goes full width
- Verified with no horizontal overflow from 360px up

**Accessibility & robustness**
- Skip link, visible focus rings, ARIA labels on icon-only controls, and `aria-live` for result counts
- Focus moves into drawers on open and returns to the trigger on close
- Honours `prefers-reduced-motion` — all animation is disabled, not just shortened
- Progressive enhancement: the reveal animation is scoped behind a `js` class, so **with JavaScript
  disabled the page still renders completely**
- Every `localStorage` read and write is wrapped, so private mode and blocked storage degrade quietly

---

## 🗂️ Project Structure

```
StoreFront/
├── index.html          # Home page
├── category.html       # Department page, driven by ?c=<slug>
├── style.css           # Design tokens, components, responsive rules
├── js/
│   ├── data.js         # Product catalogue (96 products, 8 departments)
│   ├── store.js        # Cart state + localStorage persistence
│   ├── ui.js           # Shared: theme, drawers, cart, toast, product cards
│   ├── home.js         # Home page: department search
│   └── category.js     # Department page: render, sort, filter
└── assets/
    ├── logo.svg        # Brand mark (also used as the favicon)
    ├── favicon.svg
    ├── hero-gaming.jpg
    └── *.jpg           # One photograph per department
```

Both pages share the same header, footer and inline SVG icon sprite, and load the
same four scripts in order: `data` → `store` → `ui` → page script.

---

## 🚀 Getting Started

No build tools or dependencies required.

**1. Clone the repository**
```bash
git clone https://github.com/abhinavshahi27/Amazon-Clone-Website.git
cd Amazon-Clone-Website
```

**2. Serve it**

Opening `index.html` directly works, but a local server is closer to production:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

---

## 🛠️ Built With

- **HTML5** — semantic structure, inline SVG sprite
- **CSS3** — custom properties, Grid, Flexbox, `clamp()`, container-free responsive design
- **JavaScript (ES5-compatible)** — no framework, no bundler, no polyfills; `localStorage` for cart and theme
- **Google Fonts** — Plus Jakarta Sans (headings) and Inter (body)

---

## 📌 Note

"StoreFront" is a fictional brand invented for this project. It is built purely for **educational
and portfolio purposes**, is not a real shop, and is not affiliated with or endorsed by any
retailer. All product photography is generic stock imagery used as placeholder content.

---

## 🙋‍♂️ Author

**Abhinav Pratap Shahi**  
[GitHub](https://github.com/abhinavshahi27)
