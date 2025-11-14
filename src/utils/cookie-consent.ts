/**
 * Prompt used in Cursor:
 * "Create a Playwright helper that safely dismisses cookie/location banners on mega-image.ro
 * using multiple resilient selectors (text, role, regex).
 * Try common Romanian button text like 'Accept', 'Sunt de acord', 'Acceptă toate', 'Închide'.
 * The function should never throw if buttons don't appear - use try/catch for safety.
 * Also handle location/store selection modals that might appear."
 */

import { Page, expect } from '@playwright/test';

export async function dismissOverlays(page: Page): Promise<void> {
  // Wait a moment for overlays to potentially appear
  await page.waitForTimeout(500);

  // Cookie consent – try common Romanian variants
  const cookieButtonPatterns = [
    /accept/i,
    /sunt de acord/i,
    /de acord/i,
    /consimt/i,
    /acceptă/i,
    /accept all/i,
    /acceptă toate/i
  ];

  for (const pattern of cookieButtonPatterns) {
    const button = page.getByRole('button', { name: pattern }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => null);
      await page.waitForTimeout(300);
      break;
    }
  }

  // Location / store modal (if present): try "Închide", "Close", "OK"
  const closeButtonPatterns = [
    /închide/i,
    /close/i,
    /^ok$/i,
    /got it/i,
    /continua/i
  ];

  for (const pattern of closeButtonPatterns) {
    const button = page.getByRole('button', { name: pattern }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => null);
      await page.waitForTimeout(300);
      break;
    }
  }

  // Ensure main content is interactable
  await expect(page.locator('body')).toBeVisible();
}
