import { test, expect } from '@playwright/test';

/**
 * User Onboarding E2E Test Suite
 * 
 * This suite tests the complete onboarding flow for new users, including:
 * - Sign up process
 * - Email verification
 * - Profile completion
 * - Guided walkthrough
 * - Educational content access
 */

test.describe('User Onboarding Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Start from a clean slate - clear local storage and cookies
    await page.context().clearCookies();

    // Go to the homepage
    await page.goto('/');
  });

  test('New user should be guided through the sign-up process', async ({ page }) => {
    // Click on sign up button
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Wait for the signup page to load
    await expect(page).toHaveURL(/.*\/auth\/signup/);
    
    // Fill in the sign-up form with test user details
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    
    // Submit the form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should be redirected to the email verification page
    await expect(page).toHaveURL(/.*\/auth\/verify-email/);
    
    // Check for email verification instruction
    await expect(page.getByText(/verification email has been sent/i)).toBeVisible();
    
    // Mock email verification (in a real test, we might use API to verify)
    // For now, we'll skip ahead to simulate a verified user
  });

  test('Verified user should see the onboarding walkthrough', async ({ page }) => {
    // Mock an authenticated user session
    await page.addInitScript(() => {
      // Mock localStorage for a logged-in user
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_id', 'test-user-123');
      localStorage.setItem('user_email', 'test@example.com');
    });
    
    // Go to the dashboard
    await page.goto('/dashboard');
    
    // The onboarding dialog should be visible for new users
    await expect(page.getByText(/get started with coinbox/i)).toBeVisible();
    
    // Check that the progress indicator is at 0%
    await expect(page.getByText(/0% complete/i)).toBeVisible();
    
    // Complete the first step
    await page.getByRole('button', { name: /next/i }).click();
    
    // Progress should have updated
    await expect(page.getByText(/20% complete/i)).toBeVisible();
    
    // Navigate through all steps
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /(next|set up profile|add payment method|view trading guide|enable 2fa)/i }).click();
      // Wait for animation to complete
      await page.waitForTimeout(300);
    }
    
    // After completing all steps, the onboarding should be marked as complete
    await expect(page.getByText(/onboarding complete/i)).toBeVisible();
    
    // Check if localStorage was updated correctly
    const onboardingCompleted = await page.evaluate(() => localStorage.getItem('onboarding_completed_test-user-123'));
    expect(onboardingCompleted).toBe('true');
  });

  test('User should be able to access educational content', async ({ page }) => {
    // Go directly to the education center
    await page.goto('/education/p2p-trading');
    
    // Check if educational content is loaded
    await expect(page.getByRole('heading', { name: /p2p trading education center/i })).toBeVisible();
    
    // Check if there are educational articles
    await expect(page.getByText(/p2p trading basics/i)).toBeVisible();
    await expect(page.getByText(/security best practices/i)).toBeVisible();
    
    // Click on one of the articles
    await page.getByText(/understanding escrow/i).click();
    
    // Check if article content loads
    await expect(page.getByText(/escrow system protects both buyers and sellers/i)).toBeVisible();
  });

  test('User can restart onboarding from profile settings', async ({ page }) => {
    // Mock an authenticated user session with completed onboarding
    await page.addInitScript(() => {
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_id', 'test-user-123');
      localStorage.setItem('user_email', 'test@example.com');
      localStorage.setItem('onboarding_completed_test-user-123', 'true');
      localStorage.setItem('onboarding_progress_test-user-123', '100');
    });
    
    // Go to the profile settings
    await page.goto('/dashboard/settings');
    
    // Find and click the restart onboarding button
    await page.getByRole('button', { name: /restart tutorial/i }).click();
    
    // The onboarding dialog should be visible again
    await expect(page.getByText(/get started with coinbox/i)).toBeVisible();
    
    // Check that the progress indicator was reset
    await expect(page.getByText(/0% complete/i)).toBeVisible();
  });
});
