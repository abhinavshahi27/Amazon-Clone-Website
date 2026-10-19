/* =========================================================
   StoreFront — home page
   Department search plus a live product-matches strip, driven
   entirely from the catalogue so nothing extra is hardcoded.
   ========================================================= */
(function () {
    'use strict';

    var $  = function (s) { return document.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

    var input      = $('#searchInput');
    var clearBtn   = $('#searchClear');
    var cards      = $$('#catGrid .cat');
    var count      = $('#resultCount');
    var empty      = $('#emptyState');
    var emptyTerm  = $('#emptyTerm');
    var emptyReset = $('#emptyReset');

    var matchSection = $('#matches');
    var matchGrid    = $('#matchGrid');
    var matchCount   = $('#matchCount');
    var trending     = $('#trending');

    function haystack(card) {
        return ((card.dataset.name || '') + ' ' + (card.dataset.tags || '')).toLowerCase();
    }

    function renderMatches(q) {
        if (!matchSection) { return; }
        if (q.length < 2) {
            matchSection.hidden = true;
            if (trending) { trending.hidden = false; }
            return;
        }
        var hits = window.CATALOG.products.filter(function (p) {
            return p.name.toLowerCase().indexOf(q) !== -1;
        }).slice(0, 8);

        matchGrid.innerHTML = hits.map(UI.productCard).join('');
        UI.applyHues(matchGrid);
        UI.markVisible(matchGrid);
        UI.syncWish(matchGrid);
        matchCount.textContent = hits.length === 1 ? '1 product matches' : hits.length + ' products match';
        matchSection.hidden = hits.length === 0;
        /* while product results are on screen the trending strip is noise */
        if (trending) { trending.hidden = hits.length > 0; }
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
        renderMatches(q);
    }

    if (input) {
        filter('');
        input.addEventListener('input', function () { filter(input.value); });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { input.value = ''; filter(''); }
        });
    }
    function reset() { input.value = ''; filter(''); input.focus(); }
    if (clearBtn)   { clearBtn.addEventListener('click', reset); }
    if (emptyReset) { emptyReset.addEventListener('click', reset); }

    var newsletter = $('#newsletterForm');
    if (newsletter) {
        newsletter.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = $('#email');
            UI.toast(email && email.value
                ? 'Thanks \u2014 StoreFront is a demo, so nothing was actually sent.'
                : 'Add an email address first.');
            newsletter.reset();
        });
    }

    UI.init();
}());
