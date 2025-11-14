/**
 * Helper script to inspect product list selectors on mega-image.ro.
 * Usage: node scripts/inspect-plp.js
 */

const { chromium } = require('@playwright/test');

async function dismissOverlays(page) {
  await page.waitForTimeout(500);

  const cookieButtonPatterns = [
    /accept/i,
    /sunt de acord/i,
    /de acord/i,
    /consimt/i,
    /acceptă/i,
    /accept all/i,
    /acceptă toate/i,
  ];

  for (const pattern of cookieButtonPatterns) {
    const button = page.getByRole('button', { name: pattern }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => null);
      await page.waitForTimeout(300);
      break;
    }
  }

  const closeButtonPatterns = [
    /închide/i,
    /close/i,
    /^ok$/i,
    /got it/i,
    /continua/i,
  ];

  for (const pattern of closeButtonPatterns) {
    const button = page.getByRole('button', { name: pattern }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => null);
      await page.waitForTimeout(300);
      break;
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    baseURL: 'https://mega-image.ro',
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await dismissOverlays(page);

  const searchBox = page
    .locator('#header-search-bar-input')
    .or(page.getByPlaceholder(/ce cau[tț]i/i))
    .or(page.getByRole('searchbox'))
    .or(page.locator('input[type="search"]'))
    .first();

  await searchBox.fill('lapte');
  await searchBox.press('Enter');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const productCards = page.locator('[data-testid*="product-card"], article').filter({ hasText: /lei|RON/i });
  const firstVisible = productCards.first();

  await firstVisible.scrollIntoViewIfNeeded();

  const rawDetails = await firstVisible.evaluate(card => {
    const buttons = Array.from(card.querySelectorAll('button'));
    return buttons.map((button, index) => ({
      index,
      dataTestId: button.getAttribute('data-testid'),
      ariaLabel: button.getAttribute('aria-label'),
      type: button.getAttribute('type'),
      text: (button.textContent || '').trim(),
      classList: button.className,
      outerHTML: button.outerHTML,
    }));
  });

  const details = rawDetails.map(button => ({
    ...button,
    outerHTML: `${button.outerHTML.slice(0, 200)}…`,
  }));

  console.log('Detected buttons inside first product card:');
  console.dir(details, { depth: null });

  console.log('Pausing script — use Playwright inspector to explore (press ▶ to resume).');
  await page.pause();

  await browser.close();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

