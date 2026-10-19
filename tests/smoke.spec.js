const { test, expect } = require('@playwright/test');

/* Opens a page while collecting console errors and page errors,
   so every test can assert the CSP is not tripping anything. */
async function openPage(t, path) {
    const page = await t.newPage();
    const problems = [];
    page.on('console', (m) => {
        if (m.type() === 'error') { problems.push(m.text()); }
    });
    page.on('pageerror', (e) => { problems.push(String(e)); });
    await page.goto(path);
    return { page, problems };
}

function expectClean(problems) {
    const real = problems.filter((p) => !/favicon/i.test(p));
    expect(real, real.join('\n')).toEqual([]);
}

test('home renders departments and trending products', async ({ context }) => {
    const { page, problems } = await openPage(context, '/');
    await expect(page).toHaveTitle(/StoreFront/);
    await expect(page.locator('#catGrid .cat')).toHaveCount(8);
    await expect(page.locator('#trending .prod')).toHaveCount(4);
    expectClean(problems);
});

test('home search filters departments and shows product matches', async ({ context }) => {
    const { page, problems } = await openPage(context, '/');
    await page.fill('#searchInput', 'gaming');
    await expect(page.locator('#catGrid .cat:not(.is-hidden)')).toHaveCount(1);
    await expect(page.locator('#matches')).toBeVisible();
    const matchCount = await page.locator('#matchGrid .prod').count();
    expect(matchCount).toBeGreaterThan(0);
    await expect(page.locator('#trending')).toBeHidden();

    await page.fill('#searchInput', '');
    await expect(page.locator('#matches')).toBeHidden();
    await expect(page.locator('#trending')).toBeVisible();
    expectClean(problems);
});

test('newsletter rejects empty email via native validation', async ({ context }) => {
    const { page } = await openPage(context, '/');
    await page.click('#newsletterForm .btn--primary');
    // native validation blocks submit; no toast should appear
    await expect(page.locator('.toast')).toHaveCount(0);
});

test('add to cart from trending updates badge, drawer and subtotal', async ({ context }) => {
    const { page, problems } = await openPage(context, '/');

    await page.locator('#trending [data-add-id="p49"]').click();
    await expect(page.locator('#cartCount')).toHaveText('1');

    await page.click('#cartBtn');
    await expect(page.locator('#cartPanel')).toHaveClass(/is-open/);
    await expect(page.locator('#cartLines .cart-line')).toHaveCount(1);
    await expect(page.locator('#cartSubtotal')).toHaveText('₹59.00');
    expectClean(problems);
});

test('cart quantity steppers and removal work', async ({ context }) => {
    const { page } = await openPage(context, '/');

    await page.locator('#trending [data-add-id="p49"]').click();
    await expect(page.locator('#cartCount')).toHaveText('1');

    await page.click('#cartBtn');
    await page.click('#cartLines [data-act="inc"]');
    await expect(page.locator('#cartCount')).toHaveText('2');
    await expect(page.locator('#cartSubtotal')).toHaveText('₹118.00');

    await page.click('#cartLines [data-act="dec"]');
    await expect(page.locator('#cartCount')).toHaveText('1');

    await page.click('#cartLines [data-act="rm"]');
    await expect(page.locator('#cartCount')).toHaveText('0');
    await expect(page.locator('#cartEmpty')).toBeVisible();
});

test('cart persists across reload', async ({ context }) => {
    const { page } = await openPage(context, '/');
    await page.locator('#trending [data-add-id="p25"]').click();
    await expect(page.locator('#cartCount')).toHaveText('1');
    await page.reload();
    await expect(page.locator('#cartCount')).toHaveText('1');
});

test('theme toggle persists across reload', async ({ context }) => {
    const { page } = await openPage(context, '/');
    await page.click('#themeToggle');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('category page renders products, sorts and syncs the URL', async ({ context }) => {
    const { page, problems } = await openPage(context, '/category.html?c=gaming');
    await expect(page.locator('#catName')).toHaveText('Gaming');
    await expect(page.locator('#grid .prod')).toHaveCount(12);

    await page.selectOption('#sort', 'price-up');
    await expect(page).toHaveURL(/sort=price-up/);
    const prices = await page.locator('#grid .prod .price').allTextContents();
    const nums = prices.map((p) => parseFloat(p.replace(/[₹,]/g, '')));
    expect(nums[0]).toBeLessThanOrEqual(nums[nums.length - 1]);
    expectClean(problems);
});

test('category search debounces into filtered results and URL', async ({ context }) => {
    const { page } = await openPage(context, '/category.html?c=gaming');
    await page.fill('#searchInput', 'controller');
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/q=controller/);
    const shown = await page.locator('#grid .prod').count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(12);
});

test('unknown category shows the not-found state', async ({ context }) => {
    const { page } = await openPage(context, '/category.html?c=does-not-exist');
    await expect(page.locator('#notFound')).toBeVisible();
    await expect(page.locator('#nfList a')).toHaveCount(8);
});

test('product page renders details and related items', async ({ context }) => {
    const { page, problems } = await openPage(context, '/product.html?p=p49');
    await expect(page.locator('#pdpName')).toHaveText('Pro Wireless Controller');
    await expect(page.locator('#pdpPrice')).toHaveText('₹59.00');
    await expect(page.locator('#related .prod')).toHaveCount(4);

    await page.click('#pdpInc');
    await page.click('#pdpInc');
    await page.click('#pdpAdd');
    await expect(page.locator('#cartCount')).toHaveText('3');
    expectClean(problems);
});

test('unknown product shows the not-found state', async ({ context }) => {
    const { page } = await openPage(context, '/product.html?p=nope');
    await expect(page.locator('#notFound')).toBeVisible();
});

test('wishlist toggle syncs hearts, badge and drawer', async ({ context }) => {
    const { page } = await openPage(context, '/');

    await page.locator('#trending .prod [data-wish-id="p49"]').click();
    await expect(page.locator('#wishCount')).toHaveText('1');
    await expect(page.locator('#trending [data-wish-id="p49"]')).toHaveAttribute('aria-pressed', 'true');

    await page.click('#wishBtn');
    await expect(page.locator('#wlPanel')).toHaveClass(/is-open/);
    await expect(page.locator('#wlLines .cart-line')).toHaveCount(1);

    await page.click('#wlLines [data-wl-rm]');
    await expect(page.locator('#wishCount')).toHaveText('0');
    await expect(page.locator('#wlEmpty')).toBeVisible();
});

test('product cards link to the product page', async ({ context }) => {
    const { page } = await openPage(context, '/category.html?c=gaming');
    await page.click('#grid .prod:nth-child(1) .prod__link');
    await expect(page).toHaveURL(/product\.html\?p=p/);
    await expect(page.locator('#pdpName')).not.toBeEmpty();
});
