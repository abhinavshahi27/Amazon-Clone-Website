/* =========================================================
   StoreFront — home page
   Only the department search lives here; everything else on the
   home page is static markup so it still works without JS.
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
    function reset() { input.value = ''; filter(''); input.focus(); }
    if (clearBtn)   { clearBtn.addEventListener('click', reset); }
    if (emptyReset) { emptyReset.addEventListener('click', reset); }

    var newsletter = $('#newsletterForm');
    if (newsletter) {
        newsletter.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = $('#email');
            UI.toast(email && email.value
                ? 'Thanks! Nothing was actually sent — this is a demo.'
                : 'Add an email address first (it still goes nowhere).');
            newsletter.reset();
        });
    }

    UI.init();
}());
