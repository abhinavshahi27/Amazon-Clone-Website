/* =========================================================
   StoreFront — shared UI
   Runs on every page: theme, nav drawer, cart drawer, wishlist
   drawer, toast, scroll behaviour, scroll reveal, motion
   extras (fly-to-cart, card tilt, hero parallax) and the
   product-card renderer.
   ========================================================= */
window.UI = (function () {
    'use strict';

    var $  = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

    function esc(str) {
        return String(str).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function money(n) {
        return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function reducedMotion() {
        return !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /* =====================================================
       Toast
       ===================================================== */
    var toastEl, toastTimer;
    function toast(message) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'toast';
            toastEl.setAttribute('role', 'status');
            toastEl.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = message;
        toastEl.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
    }

    /* =====================================================
       Theme
       ===================================================== */
    var THEME_KEY = 'storefront:theme';
    var root = document.documentElement;

    function systemDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function isDark() {
        var set = root.getAttribute('data-theme');
        return set ? set === 'dark' : systemDark();
    }
    function initTheme() {
        var saved = null;
        try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
        if (saved === 'dark' || saved === 'light') { root.setAttribute('data-theme', saved); }

        var btn = $('#themeToggle');
        if (!btn) { return; }
        function label() {
            var dark = isDark();
            btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
            btn.setAttribute('aria-pressed', String(dark));
        }
        label();
        btn.addEventListener('click', function () {
            var next = isDark() ? 'light' : 'dark';
            var apply = function () {
                root.setAttribute('data-theme', next);
                try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
                label();
            };
            /* cross-fade the whole page when the browser supports it */
            if (document.startViewTransition && !reducedMotion()) {
                document.startViewTransition(apply);
            } else {
                apply();
            }
        });
    }

    /* =====================================================
       Overlay panels (nav drawer, cart drawer, wishlist drawer)
       ===================================================== */
    var openPanel = null;
    var lastFocus = null;

    function setPanel(panel, scrim, open, opener) {
        if (!panel) { return; }
        panel.classList.toggle('is-open', open);
        if (scrim) { scrim.hidden = !open; }
        document.body.classList.toggle('is-locked', open);
        if (opener) { opener.setAttribute('aria-expanded', String(open)); }

        if (open) {
            lastFocus = document.activeElement;
            openPanel = { panel: panel, scrim: scrim, opener: opener };
            var target = panel.querySelector('a, button, input');
            if (target) { target.focus(); }
        } else {
            openPanel = null;
            if (lastFocus && lastFocus.focus && document.contains(lastFocus)) { lastFocus.focus(); }
            lastFocus = null;
        }
    }

    function closeOpenPanel() {
        if (openPanel) { setPanel(openPanel.panel, openPanel.scrim, false, openPanel.opener); }
    }

    function focusablesIn(panel) {
        return $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', panel)
            .filter(function (el) { return el.offsetParent !== null; });
    }

    function trapTab(e) {
        var panel = openPanel.panel;
        var focusables = focusablesIn(panel);
        if (!focusables.length) { return; }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        var active = document.activeElement;
        if (e.shiftKey && (active === first || !panel.contains(active))) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
            e.preventDefault();
            first.focus();
        }
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && openPanel) { closeOpenPanel(); }
        if (e.key === 'Tab' && openPanel) { trapTab(e); }
    });

    /* =====================================================
       Chrome injected from JS
       The nav drawer, its scrim, the back-to-top button and the
       reading progress bar are useless without JS anyway, so they
       live here instead of being duplicated in every page. The
       visible bar nav stays static so the pages degrade without JS.
       ===================================================== */
    var toTop;

    function buildChrome() {
        var progress = document.createElement('div');
        progress.className = 'progress';
        progress.setAttribute('aria-hidden', 'true');
        document.body.appendChild(progress);

        toTop = document.createElement('button');
        toTop.className = 'to-top';
        toTop.id = 'toTop';
        toTop.type = 'button';
        toTop.setAttribute('aria-label', 'Back to top');
        toTop.hidden = true;
        toTop.innerHTML = '<svg><use href="#i-up"/></svg>';
        document.body.appendChild(toTop);

        var scrim = document.createElement('div');
        scrim.className = 'nav-scrim';
        scrim.id = 'navScrim';
        scrim.hidden = true;

        /* drawer links mirror the visible bar nav so they can never drift apart */
        var bar = $('.nav--bar');
        var links = bar ? $$('a', bar).map(function (a) {
            var current = a.getAttribute('aria-current');
            return '<a href="' + esc(a.getAttribute('href') || '#') + '"' +
                (current ? ' aria-current="' + esc(current) + '"' : '') + '>' + a.innerHTML + '</a>';
        }).join('') : '';

        var drawer = document.createElement('nav');
        drawer.className = 'nav-drawer';
        drawer.id = 'nav';
        drawer.setAttribute('aria-label', 'Primary');
        drawer.innerHTML =
            '<button class="nav__close" id="navClose" type="button" aria-label="Close menu">' +
                '<svg><use href="#i-close"/></svg></button>' + links;

        document.body.appendChild(scrim);
        document.body.appendChild(drawer);

        /* the search forms never navigate; filtering is instant */
        $$('form.search').forEach(function (f) {
            f.addEventListener('submit', function (e) { e.preventDefault(); });
        });
    }

    function initNav() {
        var nav   = $('#nav');
        var open  = $('#navOpen');
        var close = $('#navClose');
        var scrim = $('#navScrim');
        if (!nav) { return; }

        if (open)  { open.addEventListener('click',  function () { setPanel(nav, scrim, true, open); }); }
        if (close) { close.addEventListener('click', function () { setPanel(nav, scrim, false, open); }); }
        if (scrim) { scrim.addEventListener('click', function () { setPanel(nav, scrim, false, open); }); }
        $$('a', nav).forEach(function (a) {
            a.addEventListener('click', function () { setPanel(nav, scrim, false, open); });
        });

        /* the drawer only exists below 940px — close it if the viewport grows */
        var wide = window.matchMedia('(min-width: 940px)');
        var onChange = function (e) { if (e.matches) { setPanel(nav, scrim, false, open); } };
        if (wide.addEventListener) { wide.addEventListener('change', onChange); }
        else if (wide.addListener) { wide.addListener(onChange); }
    }

    /* =====================================================
       Cart drawer — built in JS so every page stays in sync
       ===================================================== */
    var cartPanel, cartScrim, cartList, cartSubtotal, cartCountEl, cartEmpty, cartFoot;
    var prevQty = {};
    var cartFirstRender = true;

    function artTile(p, cls) {
        /* every product carries its own icon slug; the category glyph is the fallback */
        var glyph = p.icon || (window.Store.category(p.cat) || {}).glyph || 'g-gaming';
        /* products in a department share a hue family, so vary the backdrop pattern
           deterministically to keep a 12-up grid from looking like one tile */
        var variant = parseInt(p.id.slice(1), 10) % 6;
        return '<div class="' + cls + ' art-tile art-tile--v' + variant + '" data-h="' + p.hue + '">' +
               '<svg class="art" aria-hidden="true"><use href="#' + glyph + '"/></svg></div>';
    }

    /* CSP keeps style-src tight for markup, so --h is carried as data and
       applied through the CSSOM (which is not an inline-style violation) */
    function applyHues(scope) {
        $$('[data-h]', scope || document).forEach(function (el) {
            el.style.setProperty('--h', el.getAttribute('data-h'));
        });
    }

    function buildCart() {
        cartScrim = document.createElement('div');
        cartScrim.className = 'scrim';
        cartScrim.hidden = true;

        cartPanel = document.createElement('aside');
        cartPanel.className = 'cart-panel';
        cartPanel.id = 'cartPanel';
        cartPanel.setAttribute('role', 'dialog');
        cartPanel.setAttribute('aria-modal', 'true');
        cartPanel.setAttribute('aria-label', 'Shopping cart');
        cartPanel.innerHTML =
            '<div class="cart-panel__head">' +
                '<h2>Your cart <span class="cart-panel__n" id="cartPanelN"></span></h2>' +
                '<button class="icon-btn" id="cartClose" type="button" aria-label="Close cart">' +
                    '<svg><use href="#i-close"/></svg></button>' +
            '</div>' +
            '<div class="cart-panel__body">' +
                '<ul class="cart-lines" id="cartLines"></ul>' +
                '<div class="cart-empty" id="cartEmpty">' +
                    '<svg><use href="#i-cart"/></svg>' +
                    '<p><strong>Your cart is empty</strong></p>' +
                    '<p>Add something from a department and it will show up here.</p>' +
                '</div>' +
            '</div>' +
            '<div class="cart-panel__foot" id="cartFoot">' +
                '<div class="cart-total"><span>Subtotal</span><strong id="cartSubtotal">$0.00</strong></div>' +
                '<p class="cart-note">StoreFront is a demo &mdash; no payment is taken and no order is placed.</p>' +
                '<button class="btn btn--primary" id="cartCheckout" type="button">Checkout</button>' +
                '<button class="link-btn" id="cartClear" type="button">Empty cart</button>' +
            '</div>';

        document.body.appendChild(cartScrim);
        document.body.appendChild(cartPanel);

        cartList     = $('#cartLines');
        cartSubtotal = $('#cartSubtotal');
        cartCountEl  = $('#cartPanelN');
        cartEmpty    = $('#cartEmpty');
        cartFoot     = $('#cartFoot');

        var btn = $('#cartBtn');
        $('#cartClose').addEventListener('click', function () { setPanel(cartPanel, cartScrim, false, btn); });
        cartScrim.addEventListener('click',       function () { setPanel(cartPanel, cartScrim, false, btn); });
        if (btn) {
            btn.addEventListener('click', function () { setPanel(cartPanel, cartScrim, true, btn); });
        }

        $('#cartClear').addEventListener('click', function () {
            if (window.Store.count() === 0) { return; }
            window.Store.clear();
            toast('Cart emptied');
        });
        $('#cartCheckout').addEventListener('click', function () {
            if (window.Store.count() === 0) { toast('Add something to the cart first'); return; }
            toast('This is a front-end demo — there is no checkout to run.');
        });

        /* quantity + remove, delegated so re-rendering never loses handlers */
        cartList.addEventListener('click', function (e) {
            var el = e.target.closest('[data-act]');
            if (!el) { return; }
            var id = el.getAttribute('data-id');
            var line = window.Store.lines().filter(function (l) { return l.id === id; })[0];
            if (!line) { return; }
            var li = el.closest('.cart-line');

            if (el.dataset.act === 'inc') { window.Store.setQty(id, line.qty + 1); }
            if (el.dataset.act === 'dec') {
                if (line.qty <= 1 && li) { removeLine(li, id, line); }
                else { window.Store.setQty(id, line.qty - 1); }
            }
            if (el.dataset.act === 'rm' && li) { removeLine(li, id, line); }
        });
    }

    /* animate a line shut, then take it out of the store */
    function removeLine(li, id, line) {
        if (li.dataset.removing) { return; }
        li.dataset.removing = '1';
        var gone = function () {
            window.Store.remove(id);
            toast(line.product.name + ' removed');
        };
        if (reducedMotion() || !li.animate) { gone(); return; }
        li.style.overflow = 'hidden';
        li.animate([
            { height: li.offsetHeight + 'px', opacity: 1, paddingTop: '16px', paddingBottom: '16px', borderWidth: '1px' },
            { height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px', borderWidth: '0px' }
        ], { duration: 220, easing: 'ease' }).onfinish = gone;
    }

    function renderCart(store) {
        var lines = store.lines();
        var n = store.count();

        var badge = $('#cartCount');
        if (badge) {
            badge.textContent = String(n);
            badge.dataset.empty = n === 0 ? 'true' : 'false';
            badge.classList.add('is-bumped');
            setTimeout(function () { badge.classList.remove('is-bumped'); }, 220);
        }
        var cartBtn = $('#cartBtn');
        if (cartBtn) {
            cartBtn.setAttribute('aria-label', 'Cart, ' + n + (n === 1 ? ' item' : ' items'));
        }

        if (!cartPanel) { return; }

        cartCountEl.textContent = n ? '(' + n + ')' : '';
        cartEmpty.hidden = n > 0;
        cartFoot.hidden  = n === 0;
        cartSubtotal.textContent = money(store.subtotal());

        cartList.innerHTML = lines.map(function (l) {
            var p = l.product;
            return '<li class="cart-line" data-line-id="' + p.id + '">' +
                artTile(p, 'cart-line__img') +
                '<div class="cart-line__main">' +
                    '<p class="cart-line__name">' + esc(p.name) + '</p>' +
                    '<p class="cart-line__unit">' + money(p.price) + ' each</p>' +
                    '<div class="qty">' +
                        '<button data-act="dec" data-id="' + p.id + '" type="button" aria-label="Decrease quantity of ' + esc(p.name) + '">&minus;</button>' +
                        '<span class="qty-num" aria-label="Quantity">' + l.qty + '</span>' +
                        '<button data-act="inc" data-id="' + p.id + '" type="button" aria-label="Increase quantity of ' + esc(p.name) + '">+</button>' +
                    '</div>' +
                '</div>' +
                '<div class="cart-line__end">' +
                    '<p class="cart-line__total">' + money(l.total) + '</p>' +
                    '<button class="cart-line__rm" data-act="rm" data-id="' + p.id + '" type="button" aria-label="Remove ' + esc(p.name) + '">Remove</button>' +
                '</div>' +
            '</li>';
        }).join('');
        applyHues(cartList);

        /* diff against the previous render so only changed lines animate */
        var qmap = {};
        lines.forEach(function (l) { qmap[l.id] = l.qty; });
        if (!cartFirstRender) {
            $$('.cart-line', cartList).forEach(function (li) {
                var id = li.getAttribute('data-line-id');
                if (!(id in prevQty)) {
                    li.classList.add('is-in');
                } else if (prevQty[id] !== qmap[id]) {
                    var num = li.querySelector('.qty-num');
                    if (num) { num.classList.add('is-roll'); }
                }
            });
        }
        cartFirstRender = false;
        prevQty = qmap;
    }

    /* =====================================================
       Wishlist drawer
       ===================================================== */
    var wlPanel, wlScrim, wlList, wlCountEl, wlEmpty;

    function buildWishlist() {
        wlScrim = document.createElement('div');
        wlScrim.className = 'scrim';
        wlScrim.hidden = true;

        wlPanel = document.createElement('aside');
        wlPanel.className = 'cart-panel wl-panel';
        wlPanel.id = 'wlPanel';
        wlPanel.setAttribute('role', 'dialog');
        wlPanel.setAttribute('aria-modal', 'true');
        wlPanel.setAttribute('aria-label', 'Wishlist');
        wlPanel.innerHTML =
            '<div class="cart-panel__head">' +
                '<h2>Wishlist <span class="cart-panel__n" id="wlPanelN"></span></h2>' +
                '<button class="icon-btn" id="wlClose" type="button" aria-label="Close wishlist">' +
                    '<svg><use href="#i-close"/></svg></button>' +
            '</div>' +
            '<div class="cart-panel__body">' +
                '<ul class="cart-lines" id="wlLines"></ul>' +
                '<div class="cart-empty" id="wlEmpty">' +
                    '<svg><use href="#i-heart"/></svg>' +
                    '<p><strong>Nothing saved yet</strong></p>' +
                    '<p>Tap the heart on a product to keep it here for later.</p>' +
                '</div>' +
            '</div>';

        document.body.appendChild(wlScrim);
        document.body.appendChild(wlPanel);

        wlList    = $('#wlLines');
        wlCountEl = $('#wlPanelN');
        wlEmpty   = $('#wlEmpty');

        var btn = $('#wishBtn');
        $('#wlClose').addEventListener('click', function () { setPanel(wlPanel, wlScrim, false, btn); });
        wlScrim.addEventListener('click',      function () { setPanel(wlPanel, wlScrim, false, btn); });
        if (btn) {
            btn.addEventListener('click', function () { setPanel(wlPanel, wlScrim, true, btn); });
        }

        wlList.addEventListener('click', function (e) {
            var rm = e.target.closest('[data-wl-rm]');
            if (!rm) { return; }
            window.Wish.toggle(rm.getAttribute('data-wl-rm'));
        });
    }

    function renderWish(wish) {
        var items = wish.items();
        var n = items.length;

        var badge = $('#wishCount');
        if (badge) {
            badge.textContent = String(n);
            badge.dataset.empty = n === 0 ? 'true' : 'false';
        }
        var btn = $('#wishBtn');
        if (btn) { btn.setAttribute('aria-label', 'Wishlist, ' + n + (n === 1 ? ' item' : ' items')); }

        syncWish(document);

        if (!wlPanel) { return; }
        wlCountEl.textContent = n ? '(' + n + ')' : '';
        wlEmpty.hidden = n > 0;
        wlList.innerHTML = items.map(function (p) {
            return '<li class="cart-line" data-line-id="' + p.id + '">' +
                artTile(p, 'cart-line__img') +
                '<div class="cart-line__main">' +
                    '<p class="cart-line__name">' + esc(p.name) + '</p>' +
                    '<p class="cart-line__unit">' + money(p.price) + '</p>' +
                '</div>' +
                '<div class="cart-line__end">' +
                    '<button class="btn btn--add btn--add-sm" data-add-id="' + p.id + '" type="button">Add to cart</button>' +
                    '<button class="cart-line__rm" data-wl-rm="' + p.id + '" type="button" aria-label="Remove ' + esc(p.name) + ' from wishlist">Remove</button>' +
                '</div>' +
            '</li>';
        }).join('');
        applyHues(wlList);
    }

    function syncWish(scope) {
        $$('[data-wish-id]', scope || document).forEach(function (b) {
            var on = window.Wish.has(b.getAttribute('data-wish-id'));
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-pressed', String(on));
        });
    }

    /* =====================================================
       Product cards (shared by every page that shows products)
       ===================================================== */
    function productCard(p) {
        var tag = p.badge
            ? '<span class="tag' + (p.badge === 'New' ? ' tag--new' : '') + '">' + esc(p.badge) + '</span>'
            : '';
        var old = p.old ? ' <s>' + money(p.old) + '</s>' : '';
        var href = 'product.html?p=' + encodeURIComponent(p.id);
        return '<article class="prod reveal">' +
            '<div class="prod__img">' + artTile(p, 'prod__art') + tag +
                '<button class="wish-btn" data-wish-id="' + p.id + '" type="button" aria-pressed="false" aria-label="Save ' + esc(p.name) + ' to wishlist">' +
                    '<svg><use href="#i-heart"/></svg></button>' +
            '</div>' +
            '<div class="prod__body">' +
                '<h3><a class="prod__link" href="' + href + '">' + esc(p.name) + '</a></h3>' +
                '<p class="rating"><svg><use href="#i-star"/></svg><span>' + p.rating.toFixed(1) +
                    '</span> <small>(' + p.reviews.toLocaleString() + ')</small></p>' +
                '<p class="price">' + money(p.price) + old + '</p>' +
                '<button class="btn btn--add" data-add-id="' + p.id + '" type="button">Add to cart</button>' +
            '</div>' +
        '</article>';
    }

    /* =====================================================
       Fly-to-cart
       Clone the product art and arc it into the cart button.
       ===================================================== */
    function flyToCart(fromEl) {
        if (reducedMotion() || !fromEl || !fromEl.animate) { return; }
        var cartBtn = $('#cartBtn');
        if (!cartBtn) { return; }
        var from = fromEl.getBoundingClientRect();
        var to = cartBtn.getBoundingClientRect();
        if (!from.width || !from.height) { return; }

        var clone = fromEl.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        var s = clone.style;
        s.position = 'fixed';
        s.left = '0';
        s.top = '0';
        s.zIndex = '300';
        s.width = from.width + 'px';
        s.height = from.height + 'px';
        s.margin = '0';
        s.pointerEvents = 'none';
        s.borderRadius = '16px';
        s.boxShadow = '0 12px 34px -12px rgba(22,20,32,.35)';
        s.transform = 'translate(' + from.left + 'px,' + from.top + 'px)';
        document.body.appendChild(clone);

        var mx = to.left + to.width / 2 - (from.left + from.width / 2);
        var my = to.top + to.height / 2 - (from.top + from.height / 2);
        clone.animate([
            { transform: 'translate(' + from.left + 'px,' + from.top + 'px) scale(1)', opacity: 1 },
            { transform: 'translate(' + (from.left + mx * 0.45) + 'px,' + (from.top + my * 0.15) + 'px) scale(.55)', opacity: .95, offset: .5 },
            { transform: 'translate(' + (from.left + mx) + 'px,' + (from.top + my) + 'px) scale(.1)', opacity: .35 }
        ], { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' }).onfinish = function () {
            clone.remove();
        };
    }

    /* Delegated so cards rendered later still work. One listener
       handles add-to-cart, wishlist toggles and the fly animation. */
    document.addEventListener('click', function (e) {
        var wishBtn = e.target.closest('[data-wish-id]');
        if (wishBtn) {
            var wid = wishBtn.getAttribute('data-wish-id');
            var added = window.Wish.toggle(wid);
            var wp = window.Store.product(wid);
            toast((wp ? wp.name : 'Product') + (added ? ' saved to wishlist' : ' removed from wishlist'));
            return;
        }

        var btn = e.target.closest('[data-add-id]');
        if (!btn) { return; }
        var p = window.Store.product(btn.getAttribute('data-add-id'));
        if (!p) { return; }
        var qty = Math.max(1, parseInt(btn.getAttribute('data-add-qty') || '1', 10) || 1);
        var host = btn.closest('.prod, .pdp');
        var art = host ? (host.querySelector('.prod__art') || host.querySelector('.pdp__art')) : null;
        flyToCart(art);
        window.Store.add(p.id, qty);
        toast(p.name + ' added to cart');
        btn.classList.add('is-added');
        var label = btn.textContent;
        btn.textContent = 'Added ✓';
        setTimeout(function () {
            btn.classList.remove('is-added');
            btn.textContent = label === 'Added ✓' ? 'Add to cart' : label;
        }, 1400);
    });

    /* =====================================================
       Card tilt (fine pointers only)
       ===================================================== */
    function initTilt() {
        if (!window.matchMedia) { return; }
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) { return; }
        if (reducedMotion()) { return; }

        var current = null;
        var raf = false;
        var px = 0, py = 0;

        function clear() {
            if (!current) { return; }
            current.style.removeProperty('--rx');
            current.style.removeProperty('--ry');
            current.classList.remove('is-tilt');
            current = null;
        }

        document.addEventListener('pointermove', function (e) {
            var card = e.target && e.target.closest ? e.target.closest('.prod, .cat') : null;
            if (card !== current) {
                clear();
                current = card;
                if (card) { card.classList.add('is-tilt'); }
            }
            if (!current) { return; }
            px = e.clientX;
            py = e.clientY;
            if (raf) { return; }
            raf = true;
            requestAnimationFrame(function () {
                raf = false;
                if (!current) { return; }
                var r = current.getBoundingClientRect();
                if (!r.width || !r.height) { return; }
                var rx = ((py - (r.top + r.height / 2)) / (r.height / 2)) * -3.5;
                var ry = ((px - (r.left + r.width / 2)) / (r.width / 2)) * 3.5;
                current.style.setProperty('--rx', rx.toFixed(2) + 'deg');
                current.style.setProperty('--ry', ry.toFixed(2) + 'deg');
            });
        });
        document.addEventListener('pointerdown', clear);
    }

    /* =====================================================
       Hero parallax (home page only, subtle)
       ===================================================== */
    function initParallax() {
        var media = $('.hero__media');
        if (!media || reducedMotion()) { return; }
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) { return; }
            ticking = true;
            requestAnimationFrame(function () {
                ticking = false;
                var y = window.scrollY || window.pageYOffset;
                if (y > 900) { return; }
                media.style.transform = 'translate3d(0,' + (y * -0.05).toFixed(1) + 'px,0)';
            });
        }, { passive: true });
    }

    /* =====================================================
       Scroll: header shadow + back to top
       ===================================================== */
    function initScroll() {
        var header = $('#header');
        var ticking = false;

        function onScroll() {
            var y = window.scrollY || window.pageYOffset;
            if (header) { header.classList.toggle('is-stuck', y > 8); }
            if (toTop)  { toTop.hidden = y < 500; }
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
        }, { passive: true });
        onScroll();

        if (toTop) {
            toTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
            });
        }
    }

    /* =====================================================
       Scroll reveal
       ===================================================== */
    var io = null;
    function reveal(scope) {
        var els = $$('.reveal:not(.is-visible)', scope || document);
        if (!els.length) { return; }

        if (!('IntersectionObserver' in window) || reducedMotion()) {
            els.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }
        if (!io) {
            io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) { return; }
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                });
            }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
        }
        els.forEach(function (el, i) {
            el.style.transitionDelay = (Math.min(i % 4, 3) * 60) + 'ms';
            io.observe(el);
        });

        /* failsafe: if nothing has been revealed after two seconds the observer
           is not working here — show everything rather than leave it invisible */
        setTimeout(function () {
            var any = els.some(function (el) { return el.classList.contains('is-visible'); });
            if (!any) {
                els.forEach(function (el) {
                    el.style.transitionDelay = '0ms';
                    el.classList.add('is-visible');
                });
            }
        }, 2000);
    }

    /* reveal without animation — for grids re-rendered while the user types */
    function markVisible(scope) {
        $$('.reveal:not(.is-visible)', scope || document).forEach(function (el) {
            el.style.transitionDelay = '0ms';
            el.classList.add('is-visible');
        });
    }

    /* =====================================================
       Boot
       ===================================================== */
    function init() {
        initTheme();
        buildChrome();
        initNav();
        buildCart();
        buildWishlist();
        initScroll();
        initTilt();
        initParallax();
        applyHues(document);
        window.Store.subscribe(renderCart);
        window.Wish.subscribe(renderWish);
        reveal();

        if ('serviceWorker' in navigator &&
            (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ });
        }
    }

    return {
        init: init, toast: toast, reveal: reveal, markVisible: markVisible,
        productCard: productCard, artTile: artTile, applyHues: applyHues,
        syncWish: syncWish, money: money, esc: esc
    };
}());
