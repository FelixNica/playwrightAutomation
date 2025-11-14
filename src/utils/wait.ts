/**
 * Prompt used in Cursor:
 * "Write a helper that waits for minimal network idleness and a small delay to stabilize dynamic UI.
 * Use waitForLoadState for 'domcontentloaded' and try 'networkidle' with a timeout,
 * then add a small fixed delay. Make it safe with try/catch so it doesn't fail if network doesn't idle."
 */

import { Page } from '@playwright/test';

export async function settle(page: Page, ms: number = 250): Promise<void> {
  // Wait for DOM to be loaded
  await page.waitForLoadState('domcontentloaded');
  
  // Try to wait for network to be idle (with timeout to avoid hanging)
  try {
    await page.waitForLoadState('networkidle', { timeout: 3000 });
  } catch {
    // If network doesn't idle within 3s, continue anyway
  }
  
  // Add a small fixed delay for UI animations/updates
  await page.waitForTimeout(ms);
}
