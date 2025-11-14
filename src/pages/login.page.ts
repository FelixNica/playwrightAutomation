/**
 * Prompt used in Cursor:
 * "Create a LoginPage class for mega-image.ro with methods to:
 * - Navigate to login page
 * - Fill email and password fields using Romanian selectors
 * - Click login/submit button with Romanian text like 'Logare', 'Conectare', 'Login'
 * - Wait for successful login (check URL change or user menu appears)
 * Use resilient selectors with multiple fallback options."
 */

import { Page, expect } from '@playwright/test';
import { dismissOverlays } from '../utils/cookie-consent';
import { settle } from '../utils/wait';

export class LoginPage {
  private readonly selectors = {
    username: {
      byName: 'input[name="j_username"]',
      byId: '#j_username'
    },
    password: {
      byName: 'input[name="password"]',
      byId: '#current-password',
      byType: 'input[type="password"]'
    },
    loginButton: {
      buttonNamePattern: /autentificare|logare|conectare/i,
      submitButton: 'button[type="submit"]'
    }
  };

  constructor(private page: Page) {}

  async login(email: string, password: string): Promise<void> {
    console.log('Logging in with email:', email);
    
    // Navigate to login page
    await this.page.goto('/login');
    await dismissOverlays(this.page);
    await settle(this.page);

    // Fill username field (name="j_username")
    const usernameInput = this.page
      .locator(this.selectors.username.byName)
      .or(this.page.locator(this.selectors.username.byId));

    await usernameInput.first().fill(email);

    // Fill password field (name="password", id="current-password")
    const passwordInput = this.page
      .locator(this.selectors.password.byName)
      .or(this.page.locator(this.selectors.password.byId))
      .or(this.page.locator(this.selectors.password.byType));

    await passwordInput.first().fill(password);

    // Try pressing Enter in password field first (more reliable than clicking button)
    await passwordInput.first().press('Enter');
    
    // Wait a moment to see if form submits
    await this.page.waitForTimeout(1000);
    
    // If still on login page, try clicking the button
    if (this.page.url().includes('/login')) {
      const loginButton = this.page
        .getByRole('button', { name: this.selectors.loginButton.buttonNamePattern })
        .or(this.page.locator(this.selectors.loginButton.submitButton));
      
      // Force click in case there's an overlay
      await loginButton.first().click({ force: true });
    }

    // Wait for navigation or success indicator
    await settle(this.page, 1500);
    
    // Verify login success by checking we're not on login page anymore
    await this.page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
    
    console.log('✓ Login successful');
  }
}
