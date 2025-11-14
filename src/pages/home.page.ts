/**
 * Prompt used in Cursor:
 * "Create a HomePage class with methods to navigate to the site and perform search.
 * Use dismissOverlays() on page load to handle cookie/location banners.
 * For search, use role-based selectors (searchbox) with fallbacks for placeholder text containing 'Caută'.
 * Support both Enter key submission and clicking a search button with Romanian text."
 */

import { Page, expect } from '@playwright/test';
import { dismissOverlays } from '../utils/cookie-consent';
import { settle } from '../utils/wait';

export class HomePage {
  private readonly selectors = {
    searchBox: {
      primary: '#header-search-bar-input',
      placeholder: /ce cau[tț]i/i,
      role: 'searchbox' as const,
      type: 'input[type="search"]',
      anySearch: 'input[placeholder*="search" i]'
    }
  };

  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
    await dismissOverlays(this.page);
    await settle(this.page);
  }

  async search(term: string): Promise<void> {
    // Try common search box patterns - updated after debugging actual page structure
    const searchBox = this.page
      .locator(this.selectors.searchBox.primary)
      .or(this.page.getByPlaceholder(this.selectors.searchBox.placeholder))
      .or(this.page.getByRole(this.selectors.searchBox.role))
      .or(this.page.locator(this.selectors.searchBox.type))
      .or(this.page.locator(this.selectors.searchBox.anySearch));

    await searchBox.first().fill(term);
    
    // Submit via Enter key
    await searchBox.first().press('Enter');

    await settle(this.page);
  }
}
