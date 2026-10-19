/* =========================================================
   StoreFront — product page
   Reads ?p=<id>, renders the product with a quantity stepper,
   wishlist toggle and related items from the same department.
   ===================================================== */
(function () {
    'use strict';

    var $ = function (s) { return document.querySelector(s); };
    var esc = UI.esc;

    function idFromUrl() {
        var m = /[?&]p=([^&]+)/.exec(window.location.search);
        return m ? decodeURIComponent(m[1]) : '';
    }

    var product = Store.product(idFromUrl());

    /* ---- unknown or missing id ---- */
    if (!product) {
        $('#pdpPage').hidden = true;
        $('#notFound').hidden = false;
        $('#nfList').innerHTML = Store.categories().map(function (c) {
            return '<li><a href="category.html?c=' + encodeURIComponent(c.slug) + '">' + esc(c.name) + '</a></li>';
        }).join('');
        UI.init();
        return;
    }

    var category = Store.category(product.cat);

    /* ---- metadata ---- */
    document.title = product.name + ' — StoreFront';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) { desc.setAttribute('content', product.name + ' — ' + UI.money(product.price) + ' at StoreFront. Free delivery and 30-day returns.'); }

    var blurb = product.name + ' comes from our ' + category.name + ' range — ' + category.blurb +
        ' Like everything at StoreFront it ships free and you have 30 days to change your mind.';

    /* ---- breadcrumbs ---- */
    var crumbCat = $('#crumbCat');
    crumbCat.textContent = category.name;
    crumbCat.href = 'category.html?c=' + encodeURIComponent(category.slug);
    $('#crumbName').textContent = product.name;

    /* ---- art ---- */
    var art = $('#pdpArt');
    art.setAttribute('data-h', product.hue);
    art.classList.add('art-tile--v' + (parseInt(product.id.slice(1), 10) % 6));
    art.innerHTML = '<svg class="art" aria-hidden="true"><use href="#' + (product.icon || category.glyph) + '"/></svg>';

    /* ---- info ---- */
    $('#pdpEyebrow').textContent = category.name;
    $('#pdpName').textContent = product.name;
    $('#pdpRating').textContent = product.rating.toFixed(1);
    $('#pdpReviews').textContent = product.reviews.toLocaleString() + ' reviews';
    $('#pdpPrice').textContent = UI.money(product.price);
    var oldEl = $('#pdpOld');
    if (product.old) { oldEl.textContent = UI.money(product.old); } else { oldEl.hidden = true; }
    var tagEl = $('#pdpTag');
    if (product.badge) { tagEl.textContent = product.badge; } else { tagEl.hidden = true; }
    $('#pdpBlurb').textContent = blurb;

    /* ---- quantity stepper ---- */
    var qty = 1;
    var qtyEl = $('#pdpQty');
    var addBtn = $('#pdpAdd');
    addBtn.setAttribute('data-add-id', product.id);
    var wishBtn = $('#pdpWish');
    wishBtn.setAttribute('data-wish-id', product.id);
    wishBtn.setAttribute('aria-label', 'Save ' + product.name + ' to wishlist');
    function setQty(n) {
        qty = Math.min(99, Math.max(1, n));
        qtyEl.textContent = qty;
        addBtn.setAttribute('data-add-qty', qty);
    }
    $('#pdpDec').addEventListener('click', function () { setQty(qty - 1); });
    $('#pdpInc').addEventListener('click', function () { setQty(qty + 1); });

    /* ---- structured data ---- */
    var ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: blurb,
        category: category.name,
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews
        },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.price.toFixed(2),
            availability: 'https://schema.org/InStock',
            url: window.location.href
        }
    });
    document.head.appendChild(ld);

    /* ---- related items ---- */
    var related = Store.productsIn(product.cat)
        .filter(function (p) { return p.id !== product.id; })
        .sort(function (a, b) { return b.rating - a.rating; })
        .slice(0, 4);
    var relGrid = $('#related');
    relGrid.innerHTML = related.map(UI.productCard).join('');
    UI.applyHues(relGrid);
    UI.syncWish(relGrid);

    UI.init();
}());
