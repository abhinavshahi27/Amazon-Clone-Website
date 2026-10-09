/* =========================================================
   StoreFront — shared UI
   Runs on every page: theme, nav drawer, cart drawer, toast,
   scroll behaviour, scroll reveal, and the product-card renderer.
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

    function money(n) { return '$' + n.toFixed(2); }

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
            btn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
        }
        label();
        btn.addEventListener('click', function () {
            var next = isDark() ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
            label();
        });
    }

    /* =====================================================
       Overlay panels (nav drawer + cart drawer)
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

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && openPanel) { closeOpenPanel(); }
    });

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

        // The drawer only exists below 940px — close it if the viewport grows.
        var wide = window.matchMedia('(min-width: 940px)');
        var onChange = function (e) { if (e.matches) { setPanel(nav, scrim, false, open); } };
        if (wide.addEventListener) { wide.addEventListener('change', onChange); }
        else if (wide.addListener) { wide.addListener(onChange); }
    }

    /* =====================================================
       Cart drawer — built in JS so both pages stay in sync
       ===================================================== */
    var cartPanel, cartScrim, cartList, cartSubtotal, cartCountEl, cartEmpty, cartFoot;

    function artTile(p, cls) {
        var cat = window.Store.category(p.cat);
        var glyph = cat ? cat.glyph : 'g-gaming';
        // Products in a department share a glyph, so vary the backdrop pattern
        // deterministically to keep a 12-up grid from looking like one tile.
        var variant = parseInt(p.id.slice(1), 10) % 6;
        return '<div class="' + cls + ' art-tile art-tile--v' + variant + '" style="--h:' + p.hue + '">' +
               '<svg class="art" aria-hidden="true"><use href="#' + glyph + '"/></svg></div>';
    }

    function buildCart() {
        cartScrim = document.createElement('div');
        cartScrim.className = 'scrim';
        cartScrim.hidden = true;

        cartPanel = document.createElement('aside');
        cartPanel.className = 'cart-panel';
        cartPanel.id = 'cartPanel';
        cartPanel.setAttribute('aria-label', 'Shopping cart');
        cartPanel.innerHTML =
            '<div class="cart-panel__head">' +
                '<h2>Your cart <span class="cart-panel__n" id="cartPanelN"></span></h2>' +
                '<button class="icon-btn" id="cartClose" aria-label="Close cart">' +
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
                '<p class="cart-note">Demo only — nothing is charged and no order is placed.</p>' +
                '<button class="btn btn--primary" id="cartCheckout">Checkout</button>' +
                '<button class="link-btn" id="cartClear">Empty cart</button>' +
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

        // Quantity + remove, delegated so re-rendering never loses handlers.
        cartList.addEventListener('click', function (e) {
            var el = e.target.closest('[data-act]');
            if (!el) { return; }
            var id = el.getAttribute('data-id');
            var line = window.Store.lines().filter(function (l) { return l.id === id; })[0];
            if (!line) { return; }

            if (el.dataset.act === 'inc') { window.Store.setQty(id, line.qty + 1); }
            if (el.dataset.act === 'dec') { window.Store.setQty(id, line.qty - 1); }
            if (el.dataset.act === 'rm')  {
                window.Store.remove(id);
                toast(line.product.name + ' removed');
            }
        });
    }

    function renderCart(store) {
        var n = store.count();

        // header badge (exists on every page)
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

        cartList.innerHTML = store.lines().map(function (l) {
            var p = l.product;
            return '<li class="cart-line">' +
                artTile(p, 'cart-line__img') +
                '<div class="cart-line__main">' +
                    '<p class="cart-line__name">' + esc(p.name) + '</p>' +
                    '<p class="cart-line__unit">' + money(p.price) + ' each</p>' +
                    '<div class="qty">' +
                        '<button data-act="dec" data-id="' + p.id + '" aria-label="Decrease quantity of ' + esc(p.name) + '">&minus;</button>' +
                        '<span aria-label="Quantity">' + l.qty + '</span>' +
                        '<button data-act="inc" data-id="' + p.id + '" aria-label="Increase quantity of ' + esc(p.name) + '">+</button>' +
                    '</div>' +
                '</div>' +
                '<div class="cart-line__end">' +
                    '<p class="cart-line__total">' + money(l.total) + '</p>' +
                    '<button class="cart-line__rm" data-act="rm" data-id="' + p.id + '" aria-label="Remove ' + esc(p.name) + '">Remove</button>' +
                '</div>' +
            '</li>';
        }).join('');
    }

    /* =====================================================
       Product cards (shared by the home and category pages)
       ===================================================== */
    function productCard(p) {
        var tag = p.badge
            ? '<span class="tag' + (p.badge === 'New' ? ' tag--new' : '') + '">' + esc(p.badge) + '</span>'
            : '';
        var old = p.old ? ' <s>' + money(p.old) + '</s>' : '';
        return '<article class="prod reveal">' +
            '<div class="prod__img">' + artTile(p, 'prod__art') + tag + '</div>' +
            '<div class="prod__body">' +
                '<h3>' + esc(p.name) + '</h3>' +
                '<p class="rating"><svg><use href="#i-star"/></svg><span>' + p.rating.toFixed(1) +
                    '</span> <small>(' + p.reviews.toLocaleString() + ')</small></p>' +
                '<p class="price">' + money(p.price) + old + '</p>' +
                '<button class="btn btn--add" data-add-id="' + p.id + '">Add to cart</button>' +
            '</div>' +
        '</article>';
    }

    // Delegated so cards rendered later still work.
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-add-id]');
        if (!btn) { return; }
        var p = window.Store.product(btn.getAttribute('data-add-id'));
        if (!p) { return; }
        window.Store.add(p.id, 1);
        toast(p.name + ' added to cart');
        btn.classList.add('is-added');
        btn.textContent = 'Added ✓';
        setTimeout(function () {
            btn.classList.remove('is-added');
            btn.textContent = 'Add to cart';
        }, 1400);
    });

    /* =====================================================
       Scroll: header shadow + back to top
       ===================================================== */
    function initScroll() {
        var header = $('#header');
        var toTop  = $('#toTop');
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
                var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
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

        if (!('IntersectionObserver' in window) ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

        // Failsafe: if nothing has been revealed after two seconds the observer
        // is not working here — show everything rather than leave it invisible.
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

    /* =====================================================
       Boot
       ===================================================== */
    function init() {
        initTheme();
        initNav();
        buildCart();
        initScroll();
        window.Store.subscribe(renderCart);
        reveal();
    }

    return {
        init: init, toast: toast, reveal: reveal,
        productCard: productCard, artTile: artTile,
        money: money, esc: esc
    };
}());
