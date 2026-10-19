/* =========================================================
   StoreFront — service worker
   Offline shell for a static site: pre-cache the core assets,
   then serve everything stale-while-revalidate so repeat
   visits are instant and still pick up deploy-time updates.
   ========================================================= */
(function () {
    'use strict';

    var VERSION = 'storefront-v2';
    var CORE = [
        './',
        './index.html',
        './category.html',
        './product.html',
        './style.css',
        './manifest.webmanifest',
        './js/data.js',
        './js/store.js',
        './js/wishlist.js',
        './js/ui.js',
        './js/preboot.js',
        './js/home.js',
        './js/category.js',
        './js/product.js',
        './assets/logo.svg',
        './assets/favicon.svg',
        './assets/fonts/inter-var.woff2',
        './assets/fonts/plus-jakarta-sans-var.woff2',
        './assets/icons/icon-192.png',
        './assets/icons/icon-512.png'
    ];

    self.addEventListener('install', function (e) {
        e.waitUntil(
            caches.open(VERSION)
                .then(function (cache) { return cache.addAll(CORE); })
                .then(function () { return self.skipWaiting(); })
        );
    });

    self.addEventListener('activate', function (e) {
        e.waitUntil(
            caches.keys()
                .then(function (keys) {
                    return Promise.all(keys.map(function (key) {
                        return key === VERSION ? null : caches.delete(key);
                    }));
                })
                .then(function () { return self.clients.claim(); })
        );
    });

    self.addEventListener('fetch', function (e) {
        var req = e.request;
        if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
            return;
        }

    /* strip query/hash so ?c=gaming shares one cache entry with the bare page */
    function canonical(url) {
        var clean = new URL(url);
        clean.search = '';
        clean.hash = '';
        return clean.toString();
    }

    /* navigations: network first so a fresh deploy is picked up,
       cache second so the shell still opens offline */
    if (req.mode === 'navigate') {
        e.respondWith(
            fetch(req).then(function (res) {
                var copy = res.clone();
                caches.open(VERSION).then(function (cache) { cache.put(canonical(req.url), copy); });
                return res;
            }).catch(function () {
                return caches.match(canonical(req.url)).then(function (hit) {
                    return hit || caches.match('./index.html');
                });
            })
        );
        return;
    }

        /* everything else: stale-while-revalidate */
        e.respondWith(
            caches.match(req).then(function (hit) {
                var refreshing = fetch(req).then(function (res) {
                    if (res && res.status === 200) {
                        var copy = res.clone();
                        caches.open(VERSION).then(function (cache) { cache.put(req, copy); });
                    }
                    return res;
                }).catch(function () { return hit; });
                return hit || refreshing;
            })
        );
    });
}());
