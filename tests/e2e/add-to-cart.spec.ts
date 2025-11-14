/**
 * Prompt used in Cursor:
 * "Write a Playwright test that searches two different grocery items on mega-image.ro,
 * adds the first listed item from each search to the cart, then opens the cart and verifies:
 * (1) there are at least 2 items in the cart (total quantity ≥ 2),
 * (2) product names match the ones we added (using case-insensitive substring matching),
 * (3) cart total equals the sum of line totals (allowing small rounding error ≤ 0.05 lei),
 * (4) the selected products are displayed in the cart.
 * Use search terms 'lapte' (milk) and 'paine' (bread) for better availability.
 * Include detailed console logs for debugging."
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../../src/pages/home.page';
import { PLPPage } from '../../src/pages/plp.page';
import { CartPage } from '../../src/pages/cart.page';
import { LoginPage } from '../../src/pages/login.page';

test.describe('Add to Cart E2E Tests', () => {
  test('Add two items to cart and validate contents and total', async ({ page }) => {
    const homePage = new HomePage(page);
    const plpPage = new PLPPage(page);
    const cartPage = new CartPage(page);

    // Use two common search terms to maximize product availability
    const searchTerm1 = 'lapte';   // milk
    const searchTerm2 = 'paine';   // bread

    console.log('=== Starting E2E Test: Add to Cart ===');

    // Step 1: Navigate to home page
    console.log('\nStep 1: Navigating to mega-image.ro home page...');
    await homePage.goto();
    console.log('✓ Home page loaded');

    // Step 2: Search for first product and add to cart
    console.log(`\nStep 2: Searching for "${searchTerm1}"...`);
    await homePage.search(searchTerm1);
    console.log('✓ Search completed');

    console.log('Adding first product from search results...');
    const product1 = await plpPage.pickAndAddFirstVisible();
    console.log(`✓ Product 1 added: "${product1.name}" - ${product1.price} lei`);

    // Step 3: Search for second product and add to cart
    console.log(`\nStep 3: Searching for "${searchTerm2}"...`);
    await homePage.search(searchTerm2);
    console.log('✓ Search completed');

    console.log('Adding first product from search results...');
    const product2 = await plpPage.pickAndAddFirstVisible();
    console.log(`✓ Product 2 added: "${product2.name}" - ${product2.price} lei`);

    // Step 4: Open cart
    console.log('\nStep 4: Opening shopping cart...');
    await cartPage.openCartUI();
    console.log('✓ Cart opened');

    // Step 5: Get cart contents
    console.log('\nStep 5: Reading cart contents...');
    const cartItems = await cartPage.items();
    const cartTotal = await cartPage.total();

    console.log(`\n=== Cart Contents ===`);
    console.log(`Number of line items: ${cartItems.length}`);
    cartItems.forEach((item, index) => {
      console.log(`  Item ${index + 1}: "${item.name}" - Qty: ${item.qty} - Line Total: ${item.lineTotal} lei`);
    });
    console.log(`Cart Total: ${cartTotal} lei`);

    // Verification 1: Check that at least 2 items are in the cart
    console.log('\n=== Verification 1: Item Count ===');
    expect(cartItems.length, 'Cart should contain at least 2 line items').toBeGreaterThanOrEqual(2);
    console.log(`✓ Cart contains ${cartItems.length} line items`);

    // Verification 2: Check total quantity (sum of quantities)
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.qty, 0);
    console.log(`Total quantity of items: ${totalQuantity}`);
    expect(totalQuantity, 'Total quantity should be at least 2').toBeGreaterThanOrEqual(2);
    console.log('✓ Total quantity is valid');

    // Verification 3: Verify that the selected products are displayed in the cart
    console.log('\n=== Verification 2: Product Names Match ===');
    const cartItemNames = cartItems.map(item => item.name.toLowerCase());
    
    // Use substring matching (first 6 chars) for flexibility with truncated/modified names
    const product1NameSubstring = product1.name.toLowerCase().slice(0, Math.min(6, product1.name.length));
    const product2NameSubstring = product2.name.toLowerCase().slice(0, Math.min(6, product2.name.length));

    const product1InCart = cartItemNames.some(name => 
      name.includes(product1NameSubstring) || product1.name.toLowerCase().includes(name.slice(0, 6))
    );
    const product2InCart = cartItemNames.some(name => 
      name.includes(product2NameSubstring) || product2.name.toLowerCase().includes(name.slice(0, 6))
    );

    console.log(`Looking for product 1 substring: "${product1NameSubstring}"`);
    console.log(`Product 1 found in cart: ${product1InCart}`);
    expect(product1InCart, `Product 1 "${product1.name}" should be in cart`).toBeTruthy();
    console.log('✓ Product 1 found in cart');

    console.log(`Looking for product 2 substring: "${product2NameSubstring}"`);
    console.log(`Product 2 found in cart: ${product2InCart}`);
    expect(product2InCart, `Product 2 "${product2.name}" should be in cart`).toBeTruthy();
    console.log('✓ Product 2 found in cart');

    // Verification 4: Verify that the total value of the basket is accurate
    console.log('\n=== Verification 3: Total Price Accuracy ===');
    const computedTotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    console.log(`Computed total (sum of line items): ${computedTotal.toFixed(2)} lei`);
    console.log(`Displayed cart total: ${cartTotal.toFixed(2)} lei`);
    console.log(`Difference: ${Math.abs(cartTotal - computedTotal).toFixed(2)} lei`);

    // Allow small rounding difference (max 0.05 lei)
    const priceDifference = Math.abs(cartTotal - computedTotal);
    expect(priceDifference, 'Cart total should match sum of line totals (within 0.05 lei)').toBeLessThanOrEqual(0.05);
    console.log('✓ Cart total is accurate');

    console.log('\n=== All Verifications Passed! ===');
  });
});
