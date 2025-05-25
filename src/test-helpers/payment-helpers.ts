import { Page, expect } from '@playwright/test';

/**
 * Generate mock payment data
 */
export function generateMockPayment() {
  return {
    amount: 1000 + Math.floor(Math.random() * 9000), // Between 1000 and 10000
    currency: 'ZAR',
    description: `Test Payment ${Date.now()}`,
    reference: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    metadata: {
      source: 'e2e-test',
      testId: `test-${Date.now()}`
    }
  };
}

/**
 * Verify that payment was successful
 */
export async function verifyPaymentSuccess(page: Page): Promise<string> {
  // Wait for payment success message
  const successMessage = page.getByText(/payment successful/i);
  await expect(successMessage).toBeVisible({ timeout: 10000 });
  
  // Extract payment ID from success message
  // Example format: "Payment successful! ID: PAY-1234567"
  const paymentText = await successMessage.innerText();
  const match = paymentText.match(/ID:\s+([A-Z0-9-]+)/i);
  
  if (!match || !match[1]) {
    throw new Error('Could not find payment ID in success message');
  }
  
  return match[1];
}

/**
 * Verify that a receipt was generated for the payment
 */
export async function verifyReceiptGenerated(page: Page, paymentId: string): Promise<string> {
  // Navigate to receipts
  await page.goto('/dashboard/receipts');
  
  // Look for receipt with payment ID
  const receiptRow = page.getByText(paymentId).first();
  await expect(receiptRow).toBeVisible({ timeout: 5000 });
  
  // Click on view receipt button
  await page.getByRole('button', { name: /view receipt/i }).first().click();
  
  // Wait for receipt modal
  const receiptModal = page.getByRole('dialog').filter({ hasText: /receipt details/i });
  await expect(receiptModal).toBeVisible();
  
  // Extract receipt ID
  const receiptIdElement = receiptModal.getByText(/receipt id/i).first();
  const receiptIdText = await receiptIdElement.innerText();
  const match = receiptIdText.match(/ID:\s+([A-Z0-9-]+)/i);
  
  if (!match || !match[1]) {
    throw new Error('Could not find receipt ID in modal');
  }
  
  return match[1];
}
