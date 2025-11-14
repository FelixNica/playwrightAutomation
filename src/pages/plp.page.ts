/**
 * Prompt used in Cursor:
 * "Create a PLPPage (Product Listing Page) class for product search results.
 * Methods should:
 * - Get product card elements using data-testid or class selectors with filters for 'lei' or 'RON' text
 * - Extract product name from links/headings (h2, h3, .name, .product-title)
 * - Extract and parse price using the price utility
 * - Add product to cart using button with Romanian text like 'Adaugă', 'În coș', 'Cos', 'Add'
 * - Have a convenience method to pick the first visible product and add it to cart
 * Use resilient selectors with multiple fallback options."
 */

import { Page, Locator, expect } from '@playwright/test';
import { parseRon } from '../utils/price';
import { settle } from '../utils/wait';

export class PLPPage {
  private readonly selectors = {
    productCard: {
      containers: '[data-testid*="product-card"], [data-testid*="product-item"], article, .product-card, .product-item, .product',
      priceFilter: /lei|RON/i
    },
    productName: {
      primary: 'h3[data-testid="styled-title"]',
      fallbacks: 'h3, h2, h4, .name, .product-title, .product-name'
    },
    price: '[data-testid*="price"], .price, .product-price, [class*="price"]',
    addToCart: {
      primary: '[data-testid="product-block-add"]',
      fallbackPattern: /adaug[ăa]\s+(î|i)n\s+co[șs]/i
    },
    overlay: {
      drawer: '[data-testid="ecom-drawer-overlay"]'
    },
    modal: {
      delivery: '[role="dialog"], .modal, [class*="modal"]',
      deliveryTextPattern: /livr|deliver/i,
      closeButton: /închide|close|inchide|x/i
    }
  };

  constructor(private page: Page) {}

  productCards(): Locator {
    // Try common product card containers
    return this.page
      .locator(this.selectors.productCard.containers)
      .filter({ hasText: this.selectors.productCard.priceFilter });
  }

  async cardName(card: Locator): Promise<string> {
    // Try h3 first (most specific for mega-image.ro), then fallback to other options
    const h3Element = card.locator(this.selectors.productName.primary);
    if (await h3Element.count() > 0) {
      return (await h3Element.textContent() || '').trim();
    }
    
    // Fallback to other selectors
    const nameElement = card.locator(this.selectors.productName.fallbacks).first();
    return (await nameElement.textContent() || '').trim();
  }

  async cardPrice(card: Locator): Promise<number> {
    const priceElement = card
      .locator(this.selectors.price)
      .first();
    
    const priceText = (await priceElement.textContent() || '').trim();
    return parseRon(priceText);
  }

  async addCardToCart(card: Locator): Promise<void> {
    // Dismiss any drawer overlay that might be covering the button
    const drawerOverlay = this.page.locator(this.selectors.overlay.drawer);
    if (await drawerOverlay.isVisible().catch(() => false)) {
      console.log('Dismissing drawer overlay...');
      // Click the overlay to close it or press Escape
      await this.page.keyboard.press('Escape').catch(() => null);
      await this.page.waitForTimeout(500);
    }
    
    // Use data-testid for the actual "Add to cart" button, not the "Add to list" button
    const addButton = card
      .locator(this.selectors.addToCart.primary)
      .or(card.getByRole('button', { name: this.selectors.addToCart.fallbackPattern })) // "Adauga in cos" specifically
      .first();
    
    // Use force click to bypass any remaining overlays
    await addButton.click({ force: true });
    await settle(this.page, 1000);
    
    // Dismiss delivery selection modal if it appears
    const deliveryModal = this.page.locator(this.selectors.modal.delivery).filter({ hasText: this.selectors.modal.deliveryTextPattern });
    if (await deliveryModal.isVisible().catch(() => false)) {
      console.log('Dismissing delivery selection modal...');
      
      // Try clicking close button
      const closeButton = this.page.getByRole('button', { name: this.selectors.modal.closeButton }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click().catch(() => null);
      } else {
        // Try pressing Escape
        await this.page.keyboard.press('Escape').catch(() => null);
      }
      
      await settle(this.page, 500);
    }
  }

  async pickAndAddFirstVisible(): Promise<{ name: string; price: number }> {
    const cards = this.productCards();
    
    // Wait for at least one product card to be visible
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    
    const card = cards.first();
    const name = await this.cardName(card);
    const price = await this.cardPrice(card);
    
    await this.addCardToCart(card);
    
    return { name, price };
  }
}
