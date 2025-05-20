import { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Utility functions for end-to-end testing of authentication flows
 */
export const authE2EUtils = {
  /**
   * Performs a standard login flow
   */
  async login(page: Page, email: string, password: string): Promise<void> {
    // Navigate to the auth page
    await page.goto('/auth');
    
    // Wait for the page to load
    await page.waitForSelector('form');
    
    // Fill in the login form
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="Password"]', password);
    
    // Submit the form
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation to complete (the dashboard should load on success)
    await page.waitForURL('**/dashboard');
    
    // Verify that login was successful
    const welcomeText = await page.textContent('h1');
    expect(welcomeText).toContain('Dashboard');
  },
  
  /**
   * Tests the MFA enrollment flow (requires a real phone number and manual code entry)
   */
  async enrollMfa(page: Page, phoneNumber: string): Promise<void> {
    // Navigate to MFA settings page
    await page.goto('/dashboard/security/mfa');
    
    // Wait for the page to load
    await page.waitForSelector('button:has-text("Enable two-factor authentication")');
    
    // Click the enable MFA button
    await page.click('button:has-text("Enable two-factor authentication")');
    
    // Fill in the phone number
    await page.fill('input[placeholder*="phone"]', phoneNumber);
    
    // Optional device name
    await page.fill('input[placeholder="My Phone"]', 'Test Device');
    
    // Solve reCAPTCHA manually (wait for user interaction)
    // This will require manual intervention during the test
    console.log('Please solve the reCAPTCHA in the browser...');
    
    // Click send code button
    await page.click('button:has-text("Send Code")');
    
    // Manual verification code entry (would require actual SMS receipt)
    console.log('Please enter the verification code received via SMS...');
    
    // Wait for manual entry and completion
    await page.waitForSelector('text=Two-factor authentication is enabled', { timeout: 120000 });
  },
  
  /**
   * Tests the login with MFA verification flow
   */
  async loginWithMfa(page: Page, email: string, password: string): Promise<void> {
    // Navigate to the auth page
    await page.goto('/auth');
    
    // Fill in the login form
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="Password"]', password);
    
    // Submit the form
    await page.click('button:has-text("Sign In")');
    
    // Wait for MFA verification screen
    await page.waitForSelector('text=Two-Factor Authentication');
    
    // Manual verification code entry (would require actual SMS receipt)
    console.log('Please enter the verification code received via SMS...');
    
    // Wait for manual entry and completion
    await page.waitForURL('**/dashboard', { timeout: 120000 });
  },
  
  /**
   * Tests MFA disabling
   */
  async disableMfa(page: Page): Promise<void> {
    // Navigate to MFA settings page
    await page.goto('/dashboard/security/mfa');
    
    // Wait for the page to load
    await page.waitForSelector('text=Two-factor authentication is enabled');
    
    // Click the remove button
    await page.click('button:has-text("Remove")');
    
    // Confirm that MFA was disabled
    await page.waitForSelector('text=Two-factor authentication is not enabled');
  },
  
  /**
   * Tests rate limiting by attempting multiple failed logins
   */
  async testRateLimiting(page: Page, email: string, password: string, attempts: number): Promise<boolean> {
    // Navigate to the auth page
    await page.goto('/auth');
    
    // Invalid password for triggering rate limiting
    const invalidPassword = password + '123';
    
    // Attempt multiple failed logins
    for (let i = 0; i < attempts; i++) {
      await page.fill('input[placeholder*="Email"]', email);
      await page.fill('input[placeholder*="Password"]', invalidPassword);
      
      // Submit the form
      await page.click('button:has-text("Sign In")');
      
      // Wait a moment for the response
      await page.waitForTimeout(1000);
      
      // Check if rate limiting kicked in
      const errorText = await page.textContent('.error-message');
      if (errorText && (errorText.includes('too many requests') || errorText.includes('Too many unsuccessful login attempts'))) {
        return true;
      }
      
      // Clear the form for next attempt
      await page.fill('input[placeholder*="Email"]', '');
      await page.fill('input[placeholder*="Password"]', '');
    }
    
    return false;
  }
};
