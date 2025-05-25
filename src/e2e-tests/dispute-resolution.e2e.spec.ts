import { test, expect } from '@playwright/test';
import { 
  createMockUser, 
  loginAsMockUser,
  clearMockUserData
} from '../test-helpers/auth-helpers';
import { waitForNotification } from '../test-helpers/notification-helpers';

// Helper functions specific to dispute testing
async function createMockTradeTicket(page) {
  await page.goto('/dashboard/trading');
  await page.getByRole('button', { name: /create ticket/i }).click();
  
  await page.getByLabel(/type/i).selectOption('Loan');
  await page.getByLabel(/amount/i).fill('5000');
  await page.getByLabel(/interest rate/i).fill('5');
  await page.getByLabel(/duration/i).fill('30');
  
  await page.getByRole('button', { name: /create/i }).click();
  
  // Wait for success notification
  await waitForNotification(page);
  
  // Get ticket ID from the newly created ticket
  const ticketElement = page.getByText(/ticket id/i).first();
  const ticketText = await ticketElement.innerText();
  const match = ticketText.match(/ID:\s+([A-Z0-9-]+)/i);
  
  if (!match || !match[1]) {
    throw new Error('Could not find ticket ID');
  }
  
  return match[1];
}

async function createDispute(page, ticketId, reason = 'Payment not received') {
  // Navigate to the trade ticket
  await page.goto('/dashboard/trading');
  await page.getByText(ticketId).click();
  
  // Open dispute form
  await page.getByRole('button', { name: /report issue/i }).click();
  
  // Fill dispute form
  await page.getByLabel(/reason/i).fill(reason);
  await page.getByLabel(/description/i).fill('Detailed explanation of the issue for testing purposes.');
  
  // Submit the dispute
  await page.getByRole('button', { name: /submit dispute/i }).click();
  
  // Wait for success notification
  await waitForNotification(page);
  
  // Return to disputes page and get the dispute ID
  await page.goto('/dashboard/disputes');
  
  // Get first dispute ID
  const disputeElement = page.getByText(/dispute/i).first();
  const disputeText = await disputeElement.innerText();
  const match = disputeText.match(/#([A-Za-z0-9-]+)/);
  
  if (!match || !match[1]) {
    throw new Error('Could not find dispute ID');
  }
  
  return match[1];
}

test.describe('Dispute Resolution System E2E Tests', () => {
  let buyerUserId: string;
  let sellerUserId: string;
  let adminUserId: string;
  
  test.beforeAll(async () => {
    // Create test users
    buyerUserId = await createMockUser({
      displayName: 'Dispute Buyer',
      email: 'dispute-buyer@example.com',
      password: 'TestPassword123!'
    });
    
    sellerUserId = await createMockUser({
      displayName: 'Dispute Seller',
      email: 'dispute-seller@example.com',
      password: 'TestPassword123!'
    });
    
    adminUserId = await createMockUser({
      displayName: 'Admin User',
      email: 'dispute-admin@example.com',
      password: 'AdminPass123!'
    });
    
    // Set admin role manually in the database
    // This would typically be done through admin service but for testing we'll mock it
    const { getFirestore } = require('firebase/firestore');
    const { doc, updateDoc } = require('firebase/firestore');
    const { app } = require('../../config/firebase');
    
    const db = getFirestore(app);
    await updateDoc(doc(db, 'users', adminUserId), {
      role: 'admin'
    });
  });
  
  test.afterAll(async () => {
    // Clean up test users
    await Promise.all([
      clearMockUserData(buyerUserId),
      clearMockUserData(sellerUserId),
      clearMockUserData(adminUserId)
    ]);
  });

  test('should create and view dispute', async ({ page }) => {
    // Login as buyer
    await loginAsMockUser(page, 'dispute-buyer@example.com', 'TestPassword123!');
    
    // Create a trade ticket
    const ticketId = await createMockTradeTicket(page);
    
    // Create a dispute for that ticket
    const disputeId = await createDispute(page, ticketId);
    
    // Navigate to disputes page
    await page.goto('/dashboard/disputes');
    
    // Verify dispute is listed
    await expect(page.getByText(disputeId)).toBeVisible();
    
    // Open dispute details
    await page.getByText(disputeId).click();
    
    // Verify dispute details
    const disputeDetails = page.getByRole('dialog').filter({ hasText: /dispute details/i });
    await expect(disputeDetails).toBeVisible();
    await expect(page.getByText(/payment not received/i)).toBeVisible();
  });

  test('should submit evidence for dispute', async ({ page }) => {
    // Login as buyer
    await loginAsMockUser(page, 'dispute-buyer@example.com', 'TestPassword123!');
    
    // Navigate to disputes page
    await page.goto('/dashboard/disputes');
    
    // Open first dispute
    await page.getByRole('button', { name: /view details/i }).first().click();
    
    // Wait for dispute details dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Switch to evidence tab
    await page.getByRole('tab', { name: /evidence/i }).click();
    
    // Submit text evidence
    await page.getByLabel(/evidence type/i).selectOption('text');
    await page.getByLabel(/evidence description/i).fill('Screenshot of payment confirmation');
    await page.getByLabel(/evidence content/i).fill('This is a text description of evidence for testing purposes');
    
    // Submit evidence
    await page.getByRole('button', { name: /submit evidence/i }).click();
    
    // Wait for success notification
    await waitForNotification(page);
    
    // Verify evidence is now listed
    await expect(page.getByText(/screenshot of payment confirmation/i)).toBeVisible();
  });

  test('should add comment to dispute thread', async ({ page }) => {
    // Login as buyer
    await loginAsMockUser(page, 'dispute-buyer@example.com', 'TestPassword123!');
    
    // Navigate to disputes page
    await page.goto('/dashboard/disputes');
    
    // Open first dispute
    await page.getByRole('button', { name: /view details/i }).first().click();
    
    // Wait for dispute details dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Switch to comments tab
    await page.getByRole('tab', { name: /comments/i }).click();
    
    // Add a comment
    const commentText = `Test comment ${Date.now()}`;
    await page.getByLabel(/comment/i).fill(commentText);
    await page.getByRole('button', { name: /post comment/i }).click();
    
    // Wait for comment to appear
    await expect(page.getByText(commentText)).toBeVisible();
  });

  test('should resolve dispute as admin', async ({ page }) => {
    // Login as admin
    await loginAsMockUser(page, 'dispute-admin@example.com', 'AdminPass123!');
    
    // Navigate to admin dispute management
    await page.goto('/dashboard/admin/disputes');
    
    // Open first dispute for review
    await page.getByRole('button', { name: /review/i }).first().click();
    
    // Wait for dispute review modal
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Select resolution status
    await page.getByLabel(/resolution status/i).selectOption('Resolved');
    
    // Enter resolution details
    const resolutionText = `Resolved in favor of buyer. Funds to be returned. ${Date.now()}`;
    await page.getByLabel(/resolution details/i).fill(resolutionText);
    
    // Submit resolution
    await page.getByRole('button', { name: /submit resolution/i }).click();
    
    // Wait for success notification
    await waitForNotification(page);
    
    // Verify status change
    await expect(page.getByText(/resolved/i)).toBeVisible();
    
    // Login as buyer to verify they can see resolution
    await loginAsMockUser(page, 'dispute-buyer@example.com', 'TestPassword123!');
    
    // Navigate to disputes page
    await page.goto('/dashboard/disputes');
    
    // Check status is updated
    await expect(page.getByText(/resolved/i)).toBeVisible();
    
    // Open dispute details
    await page.getByRole('button', { name: /view details/i }).first().click();
    
    // Verify resolution is visible
    await expect(page.getByText(resolutionText)).toBeVisible();
  });
});
