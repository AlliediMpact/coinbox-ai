import { test, expect } from '@playwright/test';

// NOTE: This test assumes you have a seeded test user account.
// It exercises only navigation & routing and does NOT modify backend/business logic.
// Update TEST_EMAIL / TEST_PASSWORD via env vars to avoid hardcoding secrets.

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:9004';
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123!';

// Helper to perform login via the /auth page
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/auth`);

  // Email input
  const emailInput = page.getByPlaceholder('Email');
  await expect(emailInput).toBeVisible();
  await emailInput.fill(TEST_EMAIL);

  // Password input
  const passwordInput = page.getByPlaceholder('Password');
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(TEST_PASSWORD);

  // Submit login form
  await page.getByRole('button', { name: /login/i }).click();

  // Expect redirect to dashboard (or at least the dashboard heading)
  await page.waitForURL(/\/dashboard/); // flexible: /dashboard or sub-route
  await expect(page.getByText('Dashboard')).toBeVisible();
}

// Helper to open user menu and logout
async function logout(page: import('@playwright/test').Page) {
  // Open user avatar menu (button with initial letter or generic U)
  const avatarButton = page.getByRole('button').filter({ hasText: /[A-ZU]/ }).first();
  await avatarButton.click();

  // Click Logout menu item
  await page.getByRole('menuitem', { name: /logout/i }).click();

  // Expect home page
  await page.waitForURL(BASE_URL + '/');
}

// Smoke test: core navigation flows for an authenticated user
// This focuses ONLY on routing; it does not assert data content.

test.describe('Navigation smoke test', () => {
  test('home -> login -> dashboard -> core routes -> logout', async ({ page }) => {
    // 1. Home page should load and show auth CTAs
    await page.goto(BASE_URL + '/');
    await expect(page.getByText(/Sign Up Now/i)).toBeVisible();
    await expect(page.getByText(/Sign In/i)).toBeVisible();

    // 2. Login via dedicated auth page (keeps test deterministic)
    await login(page);

    // 3. From dashboard, click through key sidebar routes
    const routes = [
      { label: 'Dashboard', url: '/dashboard' },
      { label: 'Coin Trading', url: '/dashboard/trading' },
      { label: 'Wallet', url: '/dashboard/wallet' },
      { label: 'Transactions', url: '/dashboard/transactions' },
      { label: 'Receipts', url: '/dashboard/receipts' },
      { label: 'Disputes', url: '/dashboard/disputes' },
      { label: 'Security', url: '/dashboard/security' },
      { label: 'Risk Assessment', url: '/dashboard/risk' },
      { label: 'Referrals', url: '/dashboard/referral' },
      { label: 'Support', url: '/dashboard/support' },
      { label: 'Swap', url: '/dashboard/swap' },
      { label: 'P2P Trading', url: '/dashboard/p2p' },
      { label: 'Notifications', url: '/dashboard/notifications' },
      { label: 'Profile', url: '/dashboard/profile' },
      { label: 'Settings', url: '/dashboard/settings' },
    ];

    for (const route of routes) {
      // Click sidebar button by label
      const navButton = page.getByRole('button', { name: new RegExp(route.label, 'i') });
      await expect(navButton).toBeVisible();
      await navButton.click();

      // URL should update; allow sub-routes
      await page.waitForURL(new RegExp(route.url.replace('/', '\\/')));

      // Basic sanity: page should not be blank
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // 4. Logout and ensure we return to home
    await logout(page);
  });
});
