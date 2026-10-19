/* =========================================================
   StoreFront — category page
   Reads ?c=<slug>, renders that department's products, and
   handles sorting, the on-sale filter and in-department search.
   Search, sort and filter state is mirrored into the URL so any
   view is shareable and survives a reload.
   ===================================================== */
(function () {
    'use strict';

    var $ = function (s) { return document.querySelector(s); };
    var esc = UI.esc;

    function slugFromUrl() {
        var m = /[?&]c=([^&]+)/.exec(window.location.search);
        return m ? decodeURIComponent(m[1]) : '';
    }

    var slug = slugFromUrl();
    var category = Store.category(slug);
    var grid = $('#grid');

    /* ---- unknown or missing slug ---- */
    if (!category) {
        $('#catPage').hidden = true;
        $('#notFound').hidden = false;
        var list = $('#nfList');
        list.innerHTML = Store.categories().map(function (c) {
            return '<li><a href="category.html?c=' + encodeURIComponent(c.slug) + '">' + esc(c.name) + '</a></li>';
        }).join('');
        UI.init();
        return;
    }

    /* ---- header / hero ---- */
    document.title = category.name + ' — StoreFront';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) { desc.setAttribute('content', category.name + ' at StoreFront — ' + category.blurb); }

    $('#crumbName').textContent = category.name;
    $('#catName').textContent = category.name;
    $('#catBlurb').textContent = category.blurb;
    $('#catImg').src = category.image;
    $('#catImg').alt = category.name;

    var all = Store.productsIn(slug);
    $('#catCount').textContent = all.length + ' products';

    /* ---- sorting + filtering ---- */
    var sorters = {
        featured:  function (a, b) { return (b.rating - a.rating) || (a.price - b.price); },
        'price-up':   function (a, b) { return a.price - b.price; },
        'price-down': function (a, b) { return b.price - a.price; },
        rating:    function (a, b) { return b.rating - a.rating; },
        name:      function (a, b) { return a.name.localeCompare(b.name); }
    };

    var sortSel  = $('#sort');
    var saleOnly = $('#saleOnly');
    var search   = $('#searchInput');
    var clearBtn = $('#searchClear');

    /* ---- restore state from the URL before the first render ---- */
    var params = new URLSearchParams(window.location.search);
    var initialQ = params.get('q') || '';
    if (search) { search.value = initialQ; }
    if (clearBtn) { clearBtn.hidden = !initialQ.trim(); }
    var initialSort = params.get('sort');
    if (initialSort && sorters[initialSort]) { sortSel.value = initialSort; }
    saleOnly.checked = params.get('sale') === '1';

    function currentQuery() {
        return search ? search.value.trim().toLowerCase() : '';
    }

    function syncUrl(q) {
        var parts = ['c=' + encodeURIComponent(slug)];
        if (q) { parts.push('q=' + encodeURIComponent(q)); }
        if (sortSel.value !== 'featured') { parts.push('sort=' + encodeURIComponent(sortSel.value)); }
        if (saleOnly.checked) { parts.push('sale=1'); }
        var next = 'category.html?' + parts.join('&');
        if (next !== window.location.pathname + window.location.search) {
            history.replaceState(null, '', next);
        }
    }

    var firstRender = true;
    function render() {
        var q = currentQuery();
        var rows = all.slice();

        if (q) {
            rows = rows.filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1; });
        }
        if (saleOnly.checked) {
            rows = rows.filter(function (p) { return p.old; });
        }
        rows.sort(sorters[sortSel.value] || sorters.featured);

        grid.innerHTML = rows.map(UI.productCard).join('');
        UI.applyHues(grid);
        UI.syncWish(grid);

        /* the entrance stagger belongs to the first paint; re-renders
           while typing swap content instantly so nothing re-animates */
        if (firstRender) {
            firstRender = false;
            UI.reveal(grid);
        } else {
            UI.markVisible(grid);
        }

        $('#shown').textContent = rows.length === all.length
            ? all.length + ' products'
            : rows.length + ' of ' + all.length + ' products';
        $('#gridEmpty').hidden = rows.length > 0;
        $('#gridEmpty').textContent = q
            ? 'No products in ' + category.name + ' match "' + q + '".'
            : 'Nothing here matches those filters.';

        syncUrl(search ? search.value.trim() : '');
    }

    sortSel.addEventListener('change', render);
    saleOnly.addEventListener('change', render);

    /* debounce keystrokes so a fast typist does not re-render per key */
    var deb = null;
    if (search) {
        search.addEventListener('input', function () {
            if (clearBtn) { clearBtn.hidden = !search.value.trim(); }
            clearTimeout(deb);
            deb = setTimeout(render, 120);
        });
        search.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { search.value = ''; if (clearBtn) { clearBtn.hidden = true; } render(); }
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            search.value = ''; clearBtn.hidden = true; render(); search.focus();
        });
    }

    /* ---- other departments ---- */
    $('#others').innerHTML = Store.categories()
        .filter(function (c) { return c.slug !== slug; })
        .map(function (c) {
            return '<a class="chip" href="category.html?c=' + encodeURIComponent(c.slug) + '">' +
                   esc(c.name) + '</a>';
        }).join('');

    render();
    UI.init();
}());
