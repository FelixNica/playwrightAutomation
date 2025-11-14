/**
 * Prompt used in Cursor:
 * "Create a CartPage class that:
 * - Opens the cart UI by clicking cart icon/button in header (Romanian: 'Coș', 'Cos', 'Cart')
 * - If cart is a separate page (/cos or /cart), navigate via header link
 * - Get line items from cart (cart-item, .cart-item containers)
 * - For each line item extract: product name, quantity (from spinbutton or text), line total price
 * - Get cart total price from summary section
 * - Parse all prices using the Romanian price parser
 * Use resilient selectors with multiple fallbacks for dynamic page structures."
 */

import { Page, Locator, expect } from '@playwright/test';
import { parseRon } from '../utils/price';
import { settle } from '../utils/wait';

export class CartPage {
  private readonly selectors = {
    cartButton: {
      buttonFilter: 'button, a',
      svgIcon: 'svg',
      badgePattern: /^\d+$/
    },
    lineItem: {
      container: 'li',
      image: 'img',
      unitPricePattern: /Lei\/(Kg|L|buc)/,
      alternativeSelectors: {
        article: 'article',
        divWithImage: 'div:has(img[alt])',
        buttonWithPlus: '*:has(button:has-text("+"))'
      },
      nameSelectors: ['h3', 'h4', 'a', '[class*="name"]', '[class*="title"]'],
      quantityRole: 'spinbutton' as const
    },
    productCount: {
      pattern: /^\d+\s+produse?$/,
      anyElement: '*'
    },
    total: {
      selectors: [
        '[data-testid*="cart-total"]',
        '[data-testid*="total"]',
        '[class*="total"]',
        '.cart-total',
        '.summary-total',
        '.grand-total'
      ]
    },
    navigation: {
      checkoutUrl: '/checkout'
    }
  };

  constructor(private page: Page) {}

  async openCartUI(): Promise<void> {
    console.log('Opening cart...');
    
    // Click the cart button in the header (the one with the badge showing item count)
    const cartButton = this.page.locator(this.selectors.cartButton.buttonFilter).filter({ has: this.page.locator(this.selectors.cartButton.svgIcon) }).filter({ hasText: this.selectors.cartButton.badgePattern }).first();
    
    if (await cartButton.isVisible().catch(() => false)) {
      console.log('Clicking cart button...');
      await cartButton.click();
      await settle(this.page, 2000);
    } else {
      console.log('Cart button not found, trying direct navigation to /checkout...');
      await this.page.goto(this.selectors.navigation.checkoutUrl);
      await settle(this.page, 1000);
    }
    
    console.log(`Cart URL: ${this.page.url()}`);
  }

  lineItems(): Locator {
    // Cart items are li elements with images and unit prices (Lei/Kg, Lei/L, etc.)
    // Note: This also matches promotional items, so we filter by count in items() method
    return this.page.locator(this.selectors.lineItem.container)
      .filter({ has: this.page.locator(this.selectors.lineItem.image) })
      .filter({ hasText: this.selectors.lineItem.unitPricePattern });
  }

  async items(): Promise<{ name: string; qty: number; lineTotal: number }[]> {
    const rows = this.lineItems();
    let count = await rows.count();
    const items: { name: string; qty: number; lineTotal: number }[] = [];

    console.log(`Found ${count} potential cart items using selector`);
    
    // Debug: try alternative selectors if none found
    if (count === 0) {
      console.log('Trying alternative selectors...');
      const altCount1 = await this.page.locator(this.selectors.lineItem.alternativeSelectors.article).count();
      const altCount2 = await this.page.locator(this.selectors.lineItem.alternativeSelectors.divWithImage).count();
      const altCount3 = await this.page.locator(this.selectors.lineItem.alternativeSelectors.buttonWithPlus).count();
      console.log(`  article: ${altCount1}`);
      console.log(`  div:has(img[alt]): ${altCount2}`);
      console.log(`  *:has(button with +): ${altCount3}`);
    }
    
    // WORKAROUND: The selector picks up promotional items too
    // Cart items are always the FIRST items in the list (before "Mega Promotia Saptamanii")
    // Extract the cart count from the "X produse" text to know how many actual items there are
    const produseText = await this.page.locator(this.selectors.productCount.anyElement).filter({ hasText: this.selectors.productCount.pattern }).first().textContent().catch(() => '');
    const cartCountMatch = produseText.match(this.selectors.productCount.pattern);
    const actualCartCount = cartCountMatch ? parseInt(cartCountMatch[1]) : Math.min(count, 10);
    
    if (actualCartCount < count) {
      console.log(`Limiting to first ${actualCartCount} items (from "${produseText}" text)`);
      count = actualCartCount;
    }

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const fullText = (await row.textContent() || '').trim();
      
      // Skip items that don't look like cart items (e.g., promotional items)
      if (!fullText || fullText.length < 10) {
        continue;
      }

      // Extract product name - try different selectors
      let name = '';
      for (const selector of this.selectors.lineItem.nameSelectors) {
        const nameEl = row.locator(selector).first();
        if (await nameEl.count() > 0) {
          const text = (await nameEl.textContent() || '').trim();
          if (text && text.length > 3) {
            name = text;
            break;
          }
        }
      }
      
      // If no name found via selectors, extract from full text (take first part before numbers)
      if (!name) {
        const match = fullText.match(/^([A-Za-z\s]+)/);
        name = match ? match[1].trim() : fullText.slice(0, 50);
      }

      // Extract quantity - default to 1
      let qty = 1;
      const qtyInput = row.getByRole(this.selectors.lineItem.quantityRole).first();
      if (await qtyInput.count() > 0) {
        const qtyValue = await qtyInput.inputValue().catch(() => '1');
        qty = Number(qtyValue.replace(/[^\d]/g, '')) || 1;
      }

      // Extract line total price - look for price patterns in the text
      // Pattern in cart: "989Lei24085" where 989 is the price in bani (9.89 lei) and 24085 is product code
      // We need the number right before "Lei" that's NOT followed by "/" (unit price)
      let lineTotal = 0;
      const priceMatch = fullText.match(/(\d{3,4})Lei\d{5}/); // Price in bani + Lei + product code
      if (priceMatch) {
        // Convert from bani to lei (divide by 100)
        lineTotal = parseInt(priceMatch[1]) / 100;
      }

      if (name && lineTotal > 0) {
        items.push({ name, qty, lineTotal });
      }
    }

    return items;
  }

  async total(): Promise<number> {
    // Try multiple selectors for the cart total
    for (const selector of this.selectors.total.selectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        // Try the last matching element (usually the grand total)
        const totalText = (await elements.last().textContent() || '').trim();
        try {
          const total = parseRon(totalText);
          if (total > 0) {
            return total;
          }
        } catch {
          continue;
        }
      }
    }
    
    // Fallback: return 0 if no total found
    console.log('Warning: Could not find cart total');
    return 0;
  }
}
