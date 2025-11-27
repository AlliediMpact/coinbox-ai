# Test info

- Name: User Onboarding Journey >> New user should be guided through the sign-up process
- Location: /workspaces/coinbox-ai/src/e2e-tests/onboarding.e2e.spec.ts:23:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at /home/codespace/.cache/ms-playwright/firefox-1482/firefox/firefox
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * User Onboarding E2E Test Suite
   5 |  * 
   6 |  * This suite tests the complete onboarding flow for new users, including:
   7 |  * - Sign up process
   8 |  * - Email verification
   9 |  * - Profile completion
   10 |  * - Guided walkthrough
   11 |  * - Educational content access
   12 |  */
   13 |
   14 | test.describe('User Onboarding Journey', () => {
   15 |   test.beforeEach(async ({ page }) => {
   16 |     // Start from a clean slate - clear local storage and cookies
   17 |     await page.context().clearCookies();
   18 |
   19 |     // Go to the homepage
   20 |     await page.goto('/');
   21 |   });
   22 |
>  23 |   test('New user should be guided through the sign-up process', async ({ page }) => {
      |       ^ Error: browserType.launch: Executable doesn't exist at /home/codespace/.cache/ms-playwright/firefox-1482/firefox/firefox
   24 |     // Click on sign up button
   25 |     await page.getByRole('link', { name: /sign up/i }).click();
   26 |     
   27 |     // Wait for the signup page to load
   28 |     await expect(page).toHaveURL(/.*\/auth\/signup/);
   29 |     
   30 |     // Fill in the sign-up form with test user details
   31 |     const testEmail = `test-user-${Date.now()}@example.com`;
   32 |     const testPassword = 'TestPassword123!';
   33 |     
   34 |     await page.getByLabel(/email/i).fill(testEmail);
   35 |     await page.getByLabel(/password/i).fill(testPassword);
   36 |     await page.getByLabel(/confirm password/i).fill(testPassword);
   37 |     
   38 |     // Submit the form
   39 |     await page.getByRole('button', { name: /create account/i }).click();
   40 |     
   41 |     // Should be redirected to the email verification page
   42 |     await expect(page).toHaveURL(/.*\/auth\/verify-email/);
   43 |     
   44 |     // Check for email verification instruction
   45 |     await expect(page.getByText(/verification email has been sent/i)).toBeVisible();
   46 |     
   47 |     // Mock email verification (in a real test, we might use API to verify)
   48 |     // For now, we'll skip ahead to simulate a verified user
   49 |   });
   50 |
   51 |   test('Verified user should see the onboarding walkthrough', async ({ page }) => {
   52 |     // Mock an authenticated user session
   53 |     await page.addInitScript(() => {
   54 |       // Mock localStorage for a logged-in user
   55 |       localStorage.setItem('user_authenticated', 'true');
   56 |       localStorage.setItem('user_id', 'test-user-123');
   57 |       localStorage.setItem('user_email', 'test@example.com');
   58 |     });
   59 |     
   60 |     // Go to the dashboard
   61 |     await page.goto('/dashboard');
   62 |     
   63 |     // The onboarding dialog should be visible for new users
   64 |     await expect(page.getByText(/get started with coinbox/i)).toBeVisible();
   65 |     
   66 |     // Check that the progress indicator is at 0%
   67 |     await expect(page.getByText(/0% complete/i)).toBeVisible();
   68 |     
   69 |     // Complete the first step
   70 |     await page.getByRole('button', { name: /next/i }).click();
   71 |     
   72 |     // Progress should have updated
   73 |     await expect(page.getByText(/20% complete/i)).toBeVisible();
   74 |     
   75 |     // Navigate through all steps
   76 |     for (let i = 0; i < 4; i++) {
   77 |       await page.getByRole('button', { name: /(next|set up profile|add payment method|view trading guide|enable 2fa)/i }).click();
   78 |       // Wait for animation to complete
   79 |       await page.waitForTimeout(300);
   80 |     }
   81 |     
   82 |     // After completing all steps, the onboarding should be marked as complete
   83 |     await expect(page.getByText(/onboarding complete/i)).toBeVisible();
   84 |     
   85 |     // Check if localStorage was updated correctly
   86 |     const onboardingCompleted = await page.evaluate(() => localStorage.getItem('onboarding_completed_test-user-123'));
   87 |     expect(onboardingCompleted).toBe('true');
   88 |   });
   89 |
   90 |   test('User should be able to access educational content', async ({ page }) => {
   91 |     // Go directly to the education center
   92 |     await page.goto('/education/p2p-trading');
   93 |     
   94 |     // Check if educational content is loaded
   95 |     await expect(page.getByRole('heading', { name: /p2p trading education center/i })).toBeVisible();
   96 |     
   97 |     // Check if there are educational articles
   98 |     await expect(page.getByText(/p2p trading basics/i)).toBeVisible();
   99 |     await expect(page.getByText(/security best practices/i)).toBeVisible();
  100 |     
  101 |     // Click on one of the articles
  102 |     await page.getByText(/understanding escrow/i).click();
  103 |     
  104 |     // Check if article content loads
  105 |     await expect(page.getByText(/escrow system protects both buyers and sellers/i)).toBeVisible();
  106 |   });
  107 |
  108 |   test('User can restart onboarding from profile settings', async ({ page }) => {
  109 |     // Mock an authenticated user session with completed onboarding
  110 |     await page.addInitScript(() => {
  111 |       localStorage.setItem('user_authenticated', 'true');
  112 |       localStorage.setItem('user_id', 'test-user-123');
  113 |       localStorage.setItem('user_email', 'test@example.com');
  114 |       localStorage.setItem('onboarding_completed_test-user-123', 'true');
  115 |       localStorage.setItem('onboarding_progress_test-user-123', '100');
  116 |     });
  117 |     
  118 |     // Go to the profile settings
  119 |     await page.goto('/dashboard/settings');
  120 |     
  121 |     // Find and click the restart onboarding button
  122 |     await page.getByRole('button', { name: /restart tutorial/i }).click();
  123 |     
```