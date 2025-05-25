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
    if (mockPaymentData.recipient) {
      await page.getByLabel(/recipient/i).fill(mockPaymentData.recipient);
    }

    // Select payment method
    await page.getByRole('button', { name: /select payment method/i }).click();
    await page.getByText('Credit Card').click();

    // Submit the payment
    await page.getByRole('button', { name: /submit payment/i }).click();

    // Wait for processing overlay
    await expect(page.getByText(/processing payment/i)).toBeVisible();

    // Verify payment was successful
    const paymentSuccess = await verifyPaymentSuccess(page);
    expect(paymentSuccess).toBeTruthy();

    // Check that a receipt was generated
    const receipt = await verifyReceiptGenerated(page);
    expect(receipt).toBeTruthy();
    expect(receipt.id).toBeDefined();
    expect(receipt.amount).toEqual(mockPaymentData.amount);

    // Verify that a notification was sent
    const notification = await waitForNotification(page);
    expect(notification).toBeTruthy();

    // Check notification content
    const hasCorrectContent = await checkNotificationContent(
      page, 
      notification.id, 
      { 
        type: 'payment', 
        contains: ['successful', 'payment', receipt.id.substring(0, 8)] 
      }
    );
    expect(hasCorrectContent).toBeTruthy();

    // Navigate to receipts page and check if the new receipt appears
    await page.goto('/dashboard/receipts');
    await expect(page.getByText(mockPaymentData.description)).toBeVisible();
    await expect(page.getByText(receipt.id.substring(0, 8))).toBeVisible();

    // Open receipt details
    await page.getByRole('button', { name: /view/i }).first().click();
    
    // Verify receipt viewer shows correct information
    const receiptViewer = page.getByRole('dialog').filter({ hasText: /receipt details/i });
    await expect(receiptViewer).toBeVisible();
    await expect(receiptViewer.getByText(mockPaymentData.description)).toBeVisible();
    await expect(receiptViewer.getByText(`R${mockPaymentData.amount.toFixed(2)}`)).toBeVisible();
    await expect(receiptViewer.getByText(/paid/i)).toBeVisible();
  });

  test('should handle failed payments correctly', async ({ page }) => {
    // Login as test user
    await loginAsMockUser(page, 'test-payment-e2e@example.com', 'TestPassword123!');

    // Navigate to payment page
    await page.goto('/dashboard/payments');

    // Start new payment process
    await page.getByRole('button', { name: /make payment/i }).click();

    // Fill out payment form with a known-to-fail amount (e.g., specific test amount)
    await page.getByLabel(/amount/i).fill('0.01'); // Specific amount that will trigger a failure
    await page.getByLabel(/description/i).fill('Test Failed Payment');
    
    // Select payment method
    await page.getByRole('button', { name: /select payment method/i }).click();
    await page.getByText('Credit Card').click();

    // Submit the payment
    await page.getByRole('button', { name: /submit payment/i }).click();

    // Verify error message appears
    await expect(page.getByText(/payment failed/i)).toBeVisible();
    await expect(page.getByText(/unable to process your payment/i)).toBeVisible();

    // Check error notification was received
    const notification = await waitForNotification(page);
    expect(notification).toBeTruthy();
    
    const hasErrorContent = await checkNotificationContent(
      page, 
      notification.id, 
      { 
        type: 'payment_error', 
        contains: ['failed', 'payment', 'error'] 
      }
    );
    expect(hasErrorContent).toBeTruthy();
  });

  test('should allow downloading payment receipts as PDF', async ({ page }) => {
    // Login as test user
    await loginAsMockUser(page, 'test-payment-e2e@example.com', 'TestPassword123!');

    // Navigate to receipts page
    await page.goto('/dashboard/receipts');

    // Click on view for the first receipt
    await page.getByRole('button', { name: /view/i }).first().click();
    
    // Verify receipt viewer appears
    const receiptViewer = page.getByRole('dialog').filter({ hasText: /receipt details/i });
    await expect(receiptViewer).toBeVisible();

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click download PDF button
    await receiptViewer.getByRole('button', { name: /download pdf/i }).click();
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify downloaded file has expected format
    expect(download.suggestedFilename()).toMatch(/receipt-.*\.pdf$/i);
  });
});
