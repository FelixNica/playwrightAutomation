import { test } from '@playwright/test';
import { HomePage } from '../src/pages/home.page';
import { PLPPage } from '../src/pages/plp.page';
import { CartPage } from '../src/pages/cart.page';
import { LoginPage } from '../src/pages/login.page';

// Debug selectors for investigation
const DEBUG_SELECTORS = {
  cartBadge: [
    '[data-testid*="cart"] [class*="badge"]',
    '[data-testid*="cart"] [class*="count"]',
    '[class*="cart"] [class*="badge"]',
    '[class*="cart"] [class*="count"]',
    'a[href*="cart"] span',
    'a[href*="cos"] span'
  ],
  addToCartButton: '[data-testid="product-block-add"]',
  drawerOverlay: '[data-testid="ecom-drawer-overlay"]',
  dialog: '[role="dialog"]',
  notifications: '[class*="notification"], [class*="toast"], [class*="alert"], [role="alert"]',
  body: 'body',
  cartItems: [
    '[data-testid*="cart-item"]',
    '[data-testid*="cart-line"]',
    '[data-testid*="product"]',
    '.cart-item',
    '[class*="cart-item"]',
    '[class*="CartItem"]',
    'article',
    'li:has(img)',
    '*:has(> img[alt*="Vel Pitar"])',
    '*:has(> img[alt*="Olympus"])'
  ],
  produsePattern: /\d+\s+produse/
};

test('Debug: Comprehensive cart investigation', async ({ page }) => {
  const homePage = new HomePage(page);
  const plpPage = new PLPPage(page);
  const cartPage = new CartPage(page);
  
  console.log('========================================');
  console.log('=== STEP 1: NAVIGATE TO HOME PAGE ===');
  console.log('========================================');
  await homePage.goto();
  console.log(`✓ Home page loaded: ${page.url()}`);
  
  console.log('\n========================================');
  console.log('=== STEP 2: CHECK CART BADGE BEFORE ===');
  console.log('========================================');
  await page.waitForTimeout(1000);
  
  // Look for cart badge/counter
  for (const selector of DEBUG_SELECTORS.cartBadge) {
    const badge = page.locator(selector).first();
    if (await badge.isVisible().catch(() => false)) {
      const badgeText = await badge.textContent().catch(() => '');
      console.log(`Cart badge (${selector}): "${badgeText}"`);
    }
  }
  
  console.log('\n========================================');
  console.log('=== STEP 3: SEARCH FOR FIRST PRODUCT ===');
  console.log('========================================');
  
  await homePage.search('lapte');
  console.log(`✓ Search completed: ${page.url()}`);
  await page.waitForTimeout(1000);
  
  console.log('\n========================================');
  console.log('=== STEP 4: ADD FIRST PRODUCT ===');
  console.log('========================================');
  
  const firstCard = plpPage.productCards().first();
  const firstName = await plpPage.cardName(firstCard);
  const firstPrice = await plpPage.cardPrice(firstCard);
  console.log(`Product 1: "${firstName}" - ${firstPrice} lei`);
  
  // Check button before click
  const addButton1 = firstCard.locator(DEBUG_SELECTORS.addToCartButton);
  const btn1Text = await addButton1.textContent().catch(() => '');
  const btn1AriaLabel = await addButton1.getAttribute('aria-label').catch(() => '');
  console.log(`Button before: text="${btn1Text}", aria-label="${btn1AriaLabel}"`);
  
  // Check for drawer overlay
  const drawerOverlay = page.locator(DEBUG_SELECTORS.drawerOverlay);
  const overlayVisible = await drawerOverlay.isVisible().catch(() => false);
  console.log(`Drawer overlay visible: ${overlayVisible}`);
  
  if (overlayVisible) {
    console.log('Dismissing drawer overlay with Escape...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  
  console.log('Clicking add to cart button (force)...');
  await addButton1.click({ force: true });
  console.log('✓ Button clicked');
  
  // Wait and check for changes
  await page.waitForTimeout(3000);
  
  // Check if button state changed
  const btn1TextAfter = await addButton1.textContent().catch(() => '');
  const btn1AriaLabelAfter = await addButton1.getAttribute('aria-label').catch(() => '');
  console.log(`Button after: text="${btn1TextAfter}", aria-label="${btn1AriaLabelAfter}"`);
  
  // Check for any modals/dialogs
  const visibleDialogs = await page.locator(DEBUG_SELECTORS.dialog).all();
  const visibleDialogCount = visibleDialogs.filter(async d => await d.isVisible().catch(() => false)).length;
  console.log(`Visible dialogs after add: ${visibleDialogCount}`);
  
  if (visibleDialogCount > 0) {
    console.log('Dialog detected! Content:');
    for (const dialog of visibleDialogs) {
      if (await dialog.isVisible().catch(() => false)) {
        const dialogText = await dialog.textContent().catch(() => '');
        console.log(`  "${dialogText.slice(0, 200)}"`);
      }
    }
    
    // Try to dismiss
    console.log('Attempting to dismiss dialog...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }
  
  console.log('\n========================================');
  console.log('=== STEP 5: CHECK CART BADGE AFTER ADD 1 ===');
  console.log('========================================');
  
  for (const selector of DEBUG_SELECTORS.cartBadge) {
    const badge = page.locator(selector).first();
    if (await badge.isVisible().catch(() => false)) {
      const badgeText = await badge.textContent().catch(() => '');
      console.log(`Cart badge (${selector}): "${badgeText}"`);
    }
  }
  
  // Check for success notification
  const notifications = await page.locator(DEBUG_SELECTORS.notifications).all();
  console.log(`\nNotifications/alerts: ${notifications.length}`);
  for (let i = 0; i < notifications.length; i++) {
    const notif = notifications[i];
    if (await notif.isVisible().catch(() => false)) {
      const text = await notif.textContent().catch(() => '');
      console.log(`  Notification ${i + 1}: "${text.trim()}"`);
    }
  }
  
  console.log('\n========================================');
  console.log('=== STEP 6: ADD SECOND PRODUCT ===');
  console.log('========================================');
  
  await homePage.search('paine');
  console.log(`✓ Search completed: ${page.url()}`);
  await page.waitForTimeout(1000);
  
  const secondCard = plpPage.productCards().first();
  const secondName = await plpPage.cardName(secondCard);
  const secondPrice = await plpPage.cardPrice(secondCard);
  console.log(`Product 2: "${secondName}" - ${secondPrice} lei`);
  
  const addButton2 = secondCard.locator(DEBUG_SELECTORS.addToCartButton);
  
  // Check for overlay again
  const overlay2Visible = await drawerOverlay.isVisible().catch(() => false);
  if (overlay2Visible) {
    console.log('Dismissing drawer overlay...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  
  console.log('Clicking add to cart button...');
  await addButton2.click({ force: true });
  console.log('✓ Button clicked');
  await page.waitForTimeout(3000);
  
  console.log('\n========================================');
  console.log('=== STEP 7: CHECK CART BADGE AFTER ADD 2 ===');
  console.log('========================================');
  
  for (const selector of DEBUG_SELECTORS.cartBadge) {
    const badge = page.locator(selector).first();
    if (await badge.isVisible().catch(() => false)) {
      const badgeText = await badge.textContent().catch(() => '');
      console.log(`Cart badge (${selector}): "${badgeText}"`);
    }
  }
  
  console.log('\n========================================');
  console.log('=== STEP 8: OPEN CART ===');
  console.log('========================================');
  
  await cartPage.openCartUI();
  console.log(`✓ Cart opened`);
  console.log(`Cart URL: ${page.url()}`);
  
  const pageTitle = await page.title();
  console.log(`Page title: "${pageTitle}"`);
  
  console.log('\n========================================');
  console.log('=== STEP 9: ANALYZE CART PAGE STRUCTURE ===');
  console.log('========================================');
  
  // Check if cart is empty
  const bodyText = await page.locator(DEBUG_SELECTORS.body).textContent().catch(() => '');
  const hasEmptyText = bodyText.toLowerCase().includes('gol') || 
                       bodyText.toLowerCase().includes('empty') ||
                       bodyText.toLowerCase().includes('vid');
  console.log(`Page contains "empty" text: ${hasEmptyText}`);
  
  // Try different cart item selectors
  console.log('\nSearching for cart items with different selectors:');
  for (const selector of DEBUG_SELECTORS.cartItems) {
    const count = await page.locator(selector).count();
    if (count > 0 && count < 100) {  // Only show reasonable counts
      console.log(`  ✓ ${selector}: ${count} elements found`);
      
      // Show first 2 elements details
      for (let i = 0; i < Math.min(2, count); i++) {
        const el = page.locator(selector).nth(i);
        const text = await el.textContent().catch(() => '');
        console.log(`    Element ${i + 1} text (150 chars): "${text.slice(0, 150).replace(/\n/g, ' ')}"`);
      }
    }
  }
  
  // Try to find the "2 produse" section
  console.log('\nLooking for cart section with "produse" text:');
  const produseSection = page.locator('*').filter({ hasText: DEBUG_SELECTORS.produsePattern });
  const produseSectionCount = await produseSection.count();
  console.log(`  Found ${produseSectionCount} elements with "X produse" text`);
  if (produseSectionCount > 0) {
    const sectionText = await produseSection.first().textContent();
    console.log(`  Section text: "${sectionText?.slice(0, 200)}"`);
  }
  
  // Use CartPage methods
  console.log('\n========================================');
  console.log('=== STEP 10: READ CART CONTENTS ===');
  console.log('========================================');
  
  try {
    const cartItems = await cartPage.items();
    console.log(`CartPage.items() returned: ${cartItems.length} items`);
    
    if (cartItems.length > 0) {
      cartItems.forEach((item, i) => {
        console.log(`\nItem ${i + 1}:`);
        console.log(`  Name: "${item.name}"`);
        console.log(`  Quantity: ${item.qty}`);
        console.log(`  Line Total: ${item.lineTotal} lei`);
      });
    } else {
      console.log('⚠️  WARNING: Cart is empty!');
    }
    
    const total = await cartPage.total();
    console.log(`\nCart Total: ${total} lei`);
    
    // Verification checks (same as E2E test)
    console.log('\n========================================');
    console.log('=== STEP 11: VERIFY CART CONTENTS ===');
    console.log('========================================');
    
    console.log(`\n1. Item Count Check:`);
    console.log(`   Expected: >= 2 line items`);
    console.log(`   Actual: ${cartItems.length} line items`);
    console.log(`   Status: ${cartItems.length >= 2 ? '✓ PASS' : '✗ FAIL'}`);
    
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.qty, 0);
    console.log(`\n2. Total Quantity Check:`);
    console.log(`   Expected: >= 2 items`);
    console.log(`   Actual: ${totalQuantity} items`);
    console.log(`   Status: ${totalQuantity >= 2 ? '✓ PASS' : '✗ FAIL'}`);
    
    console.log(`\n3. Product Names Check:`);
    const cartItemNames = cartItems.map(item => item.name.toLowerCase());
    const product1Match = cartItemNames.some(name => 
      name.includes(firstName.toLowerCase().slice(0, 6)) || firstName.toLowerCase().includes(name.slice(0, 6))
    );
    const product2Match = cartItemNames.some(name => 
      name.includes(secondName.toLowerCase().slice(0, 6)) || secondName.toLowerCase().includes(name.slice(0, 6))
    );
    console.log(`   Product 1 ("${firstName}") in cart: ${product1Match ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`   Product 2 ("${secondName}") in cart: ${product2Match ? '✓ PASS' : '✗ FAIL'}`);
    
    console.log(`\n4. Total Price Check:`);
    const computedTotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const priceDifference = Math.abs(total - computedTotal);
    console.log(`   Computed total: ${computedTotal.toFixed(2)} lei`);
    console.log(`   Displayed total: ${total.toFixed(2)} lei`);
    console.log(`   Difference: ${priceDifference.toFixed(2)} lei`);
    console.log(`   Status: ${priceDifference <= 0.05 ? '✓ PASS' : '✗ FAIL'}`);
    
  } catch (error) {
    console.log(`❌ Error reading cart: ${error}`);
  }
  
  console.log('\n========================================');
  console.log('=== PAUSING FOR MANUAL INSPECTION ===');
  console.log('========================================');
  await page.pause();
});
