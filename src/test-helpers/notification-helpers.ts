import { Page, expect } from '@playwright/test';

/**
 * Wait for a notification to appear
 */
export async function waitForNotification(page: Page, timeoutMs: number = 15000): Promise<void> {
  // Wait for toast notification
  const notification = page.getByRole('status').first();
  await expect(notification).toBeVisible({ timeout: timeoutMs });
}

/**
 * Check if notification content contains expected text
 */
export async function checkNotificationContent(page: Page, expectedText: string): Promise<boolean> {
  const notification = page.getByRole('status').first();
  const notificationText = await notification.innerText();
  return notificationText.includes(expectedText);
}

/**
 * Wait for a specific notification based on text content
 */
export async function waitForSpecificNotification(page: Page, text: string, timeoutMs: number = 15000): Promise<void> {
  // Wait for the specific notification text to appear
  const notificationWithText = page.getByRole('status').filter({ hasText: text }).first();
  await expect(notificationWithText).toBeVisible({ timeout: timeoutMs });
}

/**
 * Open notification center and verify notification exists
 */
export async function verifyNotificationInCenter(page: Page, expectedText: string): Promise<void> {
  // Open notification center
  await page.getByRole('button', { name: /notifications/i }).click();
  
  // Wait for notification panel to open
  const notificationPanel = page.getByRole('dialog', { name: /notifications/i });
  await expect(notificationPanel).toBeVisible();
  
  // Check if notification with expected text exists
  const notification = notificationPanel.getByText(expectedText).first();
  await expect(notification).toBeVisible();
}
