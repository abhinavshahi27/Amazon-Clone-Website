/* =========================================================
   StoreFront — cart store
   Holds cart state, persists it to localStorage so it survives
   navigation between the home page and the category pages, and
   notifies subscribers whenever it changes.
   ========================================================= */
window.Store = (function () {
    'use strict';

    var KEY = 'storefront:cart';

    /* ---- catalogue validation: a bad data.js edit should warn loudly,
       not crash the renderer halfway through a grid ---- */
    function validate(raw) {
        raw = raw && typeof raw === 'object' ? raw : { categories: [], products: [] };
        var cats = {};
        (Array.isArray(raw.categories) ? raw.categories : []).forEach(function (c) {
            if (c && typeof c.slug === 'string' && typeof c.name === 'string') { cats[c.slug] = c; }
        });

        var seen = {};
        var dropped = [];
        var products = (Array.isArray(raw.products) ? raw.products : []).filter(function (p) {
            var ok = p && typeof p === 'object'
                && typeof p.id === 'string' && !seen[p.id]
                && cats[p.cat]
                && typeof p.name === 'string' && p.name
                && typeof p.price === 'number' && isFinite(p.price) && p.price >= 0
                && typeof p.rating === 'number' && isFinite(p.rating) && p.rating >= 0 && p.rating <= 5
                && typeof p.reviews === 'number' && isFinite(p.reviews) && p.reviews >= 0
                && (p.hue === undefined || (typeof p.hue === 'number' && isFinite(p.hue) && p.hue >= 0 && p.hue <= 360));
            if (!ok) { dropped.push(p && p.id ? p.id : '(missing id)'); return false; }
            seen[p.id] = true;
            return true;
        });

        var categories = Object.keys(cats).map(function (slug) { return cats[slug]; });
        if (dropped.length && window.console && console.warn) {
            console.warn('StoreFront: dropped invalid catalogue entries: ' + dropped.join(', '));
        }
        return { categories: categories, products: products };
    }

    var catalog = validate(window.CATALOG);
    var byId = {};
    catalog.products.forEach(function (p) {
        byId[p.id] = p;
        /* frozen: rendering code can rely on the shape never drifting at runtime */
        Object.freeze(p);
    });
    Object.freeze(catalog.products);
    catalog.categories.forEach(Object.freeze);
    Object.freeze(catalog.categories);

    var items = [];        // [{ id, qty }]
    var listeners = [];

    /* ---- persistence (never throws: private mode, blocked storage, bad JSON) ---- */
    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) { return []; }
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) { return []; }
            return parsed.filter(function (row) {
                return row && byId[row.id] && row.qty > 0;
            }).map(function (row) {
                return { id: row.id, qty: Math.min(99, Math.max(1, Math.round(row.qty))) };
            });
        } catch (e) {
            return [];
        }
    }

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* ignore */ }
    }

    function emit() {
        save();
        listeners.forEach(function (fn) { fn(api); });
    }

    function find(id) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) { return i; }
        }
        return -1;
    }

    var api = {
        product: function (id) { return byId[id] || null; },

        category: function (slug) {
            var hit = null;
            catalog.categories.forEach(function (c) { if (c.slug === slug) { hit = c; } });
            return hit;
        },

        categories: function () { return catalog.categories.slice(); },

        productsIn: function (slug) {
            return catalog.products.filter(function (p) { return p.cat === slug; });
        },

        /* ---- reads ---- */
        lines: function () {
            return items.map(function (row) {
                var p = byId[row.id];
                return { id: row.id, qty: row.qty, product: p, total: p.price * row.qty };
            });
        },

        count: function () {
            return items.reduce(function (n, row) { return n + row.qty; }, 0);
        },

        subtotal: function () {
            return items.reduce(function (sum, row) {
                return sum + byId[row.id].price * row.qty;
            }, 0);
        },

        /* ---- writes ---- */
        add: function (id, qty) {
            if (!byId[id]) { return false; }
            var i = find(id);
            if (i === -1) { items.push({ id: id, qty: Math.max(1, qty || 1) }); }
            else { items[i].qty = Math.min(99, items[i].qty + (qty || 1)); }
            emit();
            return true;
        },

        setQty: function (id, qty) {
            var i = find(id);
            if (i === -1) { return; }
            qty = Math.round(qty);
            if (qty <= 0) { items.splice(i, 1); }
            else { items[i].qty = Math.min(99, qty); }
            emit();
        },

        remove: function (id) {
            var i = find(id);
            if (i !== -1) { items.splice(i, 1); emit(); }
        },

        clear: function () { items = []; emit(); },

        subscribe: function (fn) { listeners.push(fn); fn(api); }
    };

    items = load();

    // Keep tabs in sync if the cart changes in another window.
    window.addEventListener('storage', function (e) {
        if (e.key === KEY) {
            items = load();
            listeners.forEach(function (fn) { fn(api); });
        }
    });

    return api;
}());
