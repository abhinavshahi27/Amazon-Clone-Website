/* =========================================================
   StoreFront — interaction layer
   Vanilla JS, no dependencies. Everything degrades gracefully:
   with JS disabled the page is still a complete, readable store.
   ========================================================= */
(function () {
    'use strict';

    var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ---------------------------------------------------------
       Theme — follows the OS by default, remembers an explicit choice
       --------------------------------------------------------- */
    var THEME_KEY = 'storefront:theme';
    var root = document.documentElement;
    var themeToggle = $('#themeToggle');

    function storedTheme() {
        try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
    }
    function rememberTheme(value) {
        try { localStorage.setItem(THEME_KEY, value); } catch (e) { /* private mode — fine */ }
    }
    function systemPrefersDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function currentlyDark() {
        var set = root.getAttribute('data-theme');
        if (set) { return set === 'dark'; }
        return systemPrefersDark();
    }
    function syncToggleLabel() {
        if (!themeToggle) { return; }
        themeToggle.setAttribute('aria-label',
            currentlyDark() ? 'Switch to light theme' : 'Switch to dark theme');
    }

    var saved = storedTheme();
    if (saved === 'dark' || saved === 'light') { root.setAttribute('data-theme', saved); }
    syncToggleLabel();

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var next = currentlyDark() ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            rememberTheme(next);
            syncToggleLabel();
        });
    }

    /* ---------------------------------------------------------
       Mobile navigation drawer
       --------------------------------------------------------- */
    var nav      = $('#nav');
    var navOpen  = $('#navOpen');
    var navClose = $('#navClose');
    var scrim    = $('#navScrim');

    function setMenu(open) {
        if (!nav) { return; }
        nav.classList.toggle('is-open', open);
        document.body.classList.toggle('is-locked', open);
        if (scrim) { scrim.hidden = !open; }
        if (navOpen) { navOpen.setAttribute('aria-expanded', String(open)); }
        if (open) {
            var first = $('a', nav);
            if (first) { first.focus(); }
        } else if (navOpen && document.activeElement && nav.contains(document.activeElement)) {
            navOpen.focus();
        }
    }

    if (navOpen)  { navOpen.addEventListener('click',  function () { setMenu(true); }); }
    if (navClose) { navClose.addEventListener('click', function () { setMenu(false); }); }
    if (scrim)    { scrim.addEventListener('click',    function () { setMenu(false); }); }
    if (nav) {
        $$('a', nav).forEach(function (link) {
            link.addEventListener('click', function () { setMenu(false); });
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav && nav.classList.contains('is-open')) { setMenu(false); }
    });
    // Drawer only exists below 940px — close it if the viewport grows past that.
    var wide = window.matchMedia('(min-width: 940px)');
    (wide.addEventListener ? wide.addEventListener.bind(wide, 'change') : wide.addListener.bind(wide))(
        function (e) { if (e.matches) { setMenu(false); } }
    );

    /* ---------------------------------------------------------
       Category search — filters the grid as you type
       --------------------------------------------------------- */
    var input   = $('#searchInput');
    var clearBtn= $('#searchClear');
    var cards   = $$('#catGrid .cat');
    var count   = $('#resultCount');
    var empty   = $('#emptyState');
    var emptyTerm = $('#emptyTerm');
    var emptyReset = $('#emptyReset');

    function haystack(card) {
        return ((card.dataset.name || '') + ' ' + (card.dataset.tags || '')).toLowerCase();
    }

    function filter(term) {
        var q = term.trim().toLowerCase();
        var shown = 0;

        cards.forEach(function (card) {
            var hit = !q || haystack(card).indexOf(q) !== -1;
            card.classList.toggle('is-hidden', !hit);
            if (hit) { shown++; }
        });

        if (clearBtn) { clearBtn.hidden = !q; }

        if (empty) {
            empty.hidden = shown !== 0;
            if (emptyTerm) { emptyTerm.textContent = '"' + term.trim() + '"'; }
        }
        if (count) {
            count.textContent = q
                ? shown + ' of ' + cards.length + ' departments'
                : cards.length + ' departments';
        }
    }

    if (input) {
        filter('');
        input.addEventListener('input', function () { filter(input.value); });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { input.value = ''; filter(''); }
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            input.value = ''; filter(''); input.focus();
        });
    }
    if (emptyReset) {
        emptyReset.addEventListener('click', function () {
            input.value = ''; filter(''); input.focus();
        });
    }

    /* ---------------------------------------------------------
       Cart counter
       --------------------------------------------------------- */
    var cartCount = $('#cartCount');
    var cartBtn   = $('#cartBtn');
    var items = 0;

    function renderCart() {
        if (!cartCount) { return; }
        cartCount.textContent = String(items);
        cartCount.dataset.empty = items === 0 ? 'true' : 'false';
        if (cartBtn) {
            cartBtn.setAttribute('aria-label',
                'Cart, ' + items + (items === 1 ? ' item' : ' items'));
        }
        cartCount.classList.add('is-bumped');
        setTimeout(function () { cartCount.classList.remove('is-bumped'); }, 220);
    }

    $$('[data-add]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            items++;
            renderCart();
            toast(btn.dataset.add + ' added to cart');
            btn.classList.add('is-added');
            btn.textContent = 'Added ✓';
            setTimeout(function () {
                btn.classList.remove('is-added');
                btn.textContent = 'Add to cart';
            }, 1400);
        });
    });

    if (cartBtn) {
        cartBtn.addEventListener('click', function () {
            toast(items === 0
                ? 'Your cart is empty — try adding something'
                : items + (items === 1 ? ' item' : ' items') + ' in your cart (demo only)');
        });
    }

    /* ---------------------------------------------------------
       Toast
       --------------------------------------------------------- */
    var toastEl = $('#toast');
    var toastTimer;

    function toast(message) {
        if (!toastEl) { return; }
        toastEl.textContent = message;
        toastEl.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
    }

    /* ---------------------------------------------------------
       Newsletter — goes nowhere, says so
       --------------------------------------------------------- */
    var newsletter = $('#newsletterForm');
    if (newsletter) {
        newsletter.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = $('#email');
            toast(email && email.value
                ? 'Thanks! Nothing was actually sent — this is a demo.'
                : 'Add an email address first (it still goes nowhere).');
            newsletter.reset();
        });
    }

    /* ---------------------------------------------------------
       Scroll: sticky-header shadow + back-to-top
       --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       Scroll reveal
       --------------------------------------------------------- */
    var reveals = $$('.reveal');

    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) { return; }
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });

        reveals.forEach(function (el, i) {
            el.style.transitionDelay = (Math.min(i % 4, 3) * 60) + 'ms';
            io.observe(el);
        });

        // Failsafe: if the observer has revealed nothing at all after two
        // seconds it isn't working in this browser — show everything rather
        // than leave half the page at opacity 0.
        setTimeout(function () {
            var anyShown = reveals.some(function (el) {
                return el.classList.contains('is-visible');
            });
            if (!anyShown) {
                io.disconnect();
                reveals.forEach(function (el) {
                    el.style.transitionDelay = '0ms';
                    el.classList.add('is-visible');
                });
            }
        }, 2000);
    }
}());
