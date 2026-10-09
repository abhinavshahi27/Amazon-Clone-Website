/* =========================================================
   StoreFront — category page
   Reads ?c=<slug>, renders that department's products, and
   handles sorting and the on-sale filter.
   ========================================================= */
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

    function render() {
        var q = search ? search.value.trim().toLowerCase() : '';
        var rows = all.slice();

        if (q) {
            rows = rows.filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1; });
        }
        if (saleOnly.checked) {
            rows = rows.filter(function (p) { return p.old; });
        }
        rows.sort(sorters[sortSel.value] || sorters.featured);

        grid.innerHTML = rows.map(UI.productCard).join('');
        $('#shown').textContent = rows.length === all.length
            ? all.length + ' products'
            : rows.length + ' of ' + all.length + ' products';
        $('#gridEmpty').hidden = rows.length > 0;
        $('#gridEmpty').textContent = q
            ? 'No products in ' + category.name + ' match "' + q + '".'
            : 'Nothing here matches those filters.';
        UI.reveal(grid);
    }

    sortSel.addEventListener('change', render);
    saleOnly.addEventListener('change', render);

    if (search) {
        search.addEventListener('input', function () {
            if (clearBtn) { clearBtn.hidden = !search.value.trim(); }
            render();
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
