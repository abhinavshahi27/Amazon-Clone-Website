/* =========================================================
   StoreFront — wishlist store
   Same pattern as the cart store: a small persisted list of
   product ids kept in localStorage, with subscribers that
   re-render on every change and a storage listener so open
   tabs stay in sync.
   ========================================================= */
window.Wish = (function () {
    'use strict';

    var KEY = 'storefront:wishlist';
    var ids = [];
    var listeners = [];

    function valid(id) {
        return !!(window.Store && window.Store.product(id));
    }

    /* ---- persistence (never throws: private mode, blocked storage, bad JSON) ---- */
    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) { return []; }
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) { return []; }
            var seen = {};
            return parsed.filter(function (id) {
                return typeof id === 'string' && valid(id) && !seen[id] && (seen[id] = true);
            });
        } catch (e) {
            return [];
        }
    }

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch (e) { /* ignore */ }
    }

    function emit() {
        save();
        listeners.forEach(function (fn) { fn(api); });
    }

    var api = {
        has: function (id) { return ids.indexOf(id) !== -1; },

        /* toggle returns true when the product was added */
        toggle: function (id) {
            if (!valid(id)) { return false; }
            var i = ids.indexOf(id);
            var added = i === -1;
            if (added) { ids.push(id); } else { ids.splice(i, 1); }
            emit();
            return added;
        },

        items: function () {
            return ids.map(function (id) { return window.Store.product(id); });
        },

        count: function () { return ids.length; },

        subscribe: function (fn) { listeners.push(fn); fn(api); }
    };

    ids = load();

    // Keep tabs in sync if the wishlist changes in another window.
    window.addEventListener('storage', function (e) {
        if (e.key === KEY) {
            ids = load();
            listeners.forEach(function (fn) { fn(api); });
        }
    });

    return api;
}());
