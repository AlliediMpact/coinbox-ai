import { test, expect } from '@playwright/test';
import { 
  createMockUser, 
  loginAsMockUser,
  clearMockUserData
} from '../test-helpers/auth-helpers';
import { 
  generateMockPayment,
  verifyPaymentSuccess,
  verifyReceiptGenerated
} from '../test-helpers/payment-helpers';
import { 
  waitForNotification, 
  checkNotificationContent 
} from '../test-helpers/notification-helpers';

test.describe('Payment System and Notification E2E Tests', () => {
  let mockUserId: string;

  // Set up test user before tests
  test.beforeAll(async () => {
    mockUserId = await createMockUser({
      displayName: 'Test User',
      email: 'test-payment-e2e@example.com',
      password: 'TestPassword123!'
    });
  });

  // Clean up test user after tests
  test.afterAll(async () => {
    await clearMockUserData(mockUserId);
  });

  test('should process a payment and generate a receipt', async ({ page }) => {
    // Login as test user
    await loginAsMockUser(page, 'test-payment-e2e@example.com', 'TestPassword123!');

    // Navigate to payment page
    await page.goto('/dashboard/payments');
    await expect(page).toHaveTitle(/Payments | CoinBox AI/);

    // Start new payment process
    await page.getByRole('button', { name: /make payment/i }).click();

    // Wait for payment modal to open
    const paymentModal = page.getByRole('dialog').filter({ hasText: /payment details/i });
    await expect(paymentModal).toBeVisible();

    // Fill out payment form
    const mockPaymentData = generateMockPayment();
    await page.getByLabel(/amount/i).fill(mockPaymentData.amount.toString());
    await page.getByLabel(/description/i).fill(mockPaymentData.description);

    // Submit payment form
    await page.getByRole('button', { name: /pay now/i }).click();

    // Wait for payment processing and success
    await page.waitForTimeout(1000); // Wait for payment processing
    const paymentId = await verifyPaymentSuccess(page);

    // Verify that a notification appears for successful payment
    await waitForNotification(page);
    expect(await checkNotificationContent(page, 'Payment successful')).toBeTruthy();

    // Verify that a receipt was generated
    const receiptId = await verifyReceiptGenerated(page, paymentId);
    expect(receiptId).toBeTruthy();

    // Check receipt details
    expect(page.getByText(mockPaymentData.amount.toString())).toBeVisible();
    expect(page.getByText(mockPaymentData.description)).toBeVisible();
  });

  test('should receive payment notification in notification center', async ({ page }) => {
    // Login as test user
    await loginAsMockUser(page, 'test-payment-e2e@example.com', 'TestPassword123!');

    // Navigate to payment page
    await page.goto('/dashboard/payments');

    // Make a payment
    await page.getByRole('button', { name: /make payment/i }).click();
    const mockPaymentData = generateMockPayment();
    await page.getByLabel(/amount/i).fill(mockPaymentData.amount.toString());
    await page.getByLabel(/description/i).fill(mockPaymentData.description);
    await page.getByRole('button', { name: /pay now/i }).click();

    // Wait for payment to complete
    await verifyPaymentSuccess(page);

    // Check notification center
    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page.getByRole('dialog', { name: /notifications/i })).toBeVisible();

    // Verify payment notification is in the list
    const paymentNotification = page.getByText(/payment successful/i).first();
    await expect(paymentNotification).toBeVisible();

    // Verify receipt notification is in the list
    const receiptNotification = page.getByText(/receipt generated/i).first();
    await expect(receiptNotification).toBeVisible();
  });

  test('should navigate to receipt viewer from notification', async ({ page }) => {
    // Login as test user
    await loginAsMockUser(page, 'test-payment-e2e@example.com', 'TestPassword123!');

    // Navigate to payment page
    await page.goto('/dashboard/payments');

    // Make a payment
    await page.getByRole('button', { name: /make payment/i }).click();
    const mockPaymentData = generateMockPayment();
    await page.getByLabel(/amount/i).fill(mockPaymentData.amount.toString());
    await page.getByLabel(/description/i).fill(mockPaymentData.description);
    await page.getByRole('button', { name: /pay now/i }).click();

    // Wait for payment to complete
    await verifyPaymentSuccess(page);

    // Open notification center
    await page.getByRole('button', { name: /notifications/i }).click();

    // Click on receipt notification
    await page.getByText(/receipt generated/i).first().click();

    // Verify we're on the receipt viewer page
    await expect(page).toHaveURL(/receipts/);
    
    // Verify receipt details are visible
    await expect(page.getByText(mockPaymentData.amount.toString())).toBeVisible();
    await expect(page.getByText(mockPaymentData.description)).toBeVisible();
  });
});
