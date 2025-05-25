import { test, expect } from '@playwright/test';
import { 
  createMockUser, 
  loginAsMockUser,
  loginAsAdmin,
  clearMockUserData
} from '../test-helpers/auth-helpers';
import { 
  createMockDispute,
  submitDisputeEvidence,
  checkDisputeStatus,
  resolveDispute
} from '../test-helpers/dispute-helpers';

test.describe('Dispute Resolution System E2E Tests', () => {
  let mockUserId1: string;
  let mockUserId2: string;
  let disputeId: string;

  // Set up test users before tests
  test.beforeAll(async () => {
    // Create two mock users to simulate a dispute between them
    mockUserId1 = await createMockUser({
      displayName: 'Dispute User 1',
      email: 'dispute-test-1@example.com',
      password: 'TestPassword123!'
    });
    
    mockUserId2 = await createMockUser({
      displayName: 'Dispute User 2',
      email: 'dispute-test-2@example.com',
      password: 'TestPassword123!'
    });
  });

  // Clean up test users after tests
  test.afterAll(async () => {
    await clearMockUserData(mockUserId1);
    await clearMockUserData(mockUserId2);
  });

  test('should create a new dispute as a user', async ({ page }) => {
    // Login as first test user
    await loginAsMockUser(page, 'dispute-test-1@example.com', 'TestPassword123!');

    // Navigate to disputes page
    await page.goto('/dashboard/disputes');
    await expect(page).toHaveTitle(/Disputes | CoinBox AI/);

    // Start new dispute process
    await page.getByRole('button', { name: /new dispute/i }).click();

    // Wait for dispute form modal to open
    const disputeModal = page.getByRole('dialog').filter({ hasText: /create dispute/i });
    await expect(disputeModal).toBeVisible();

    // Fill out dispute form
    const mockDisputeData = {
      reason: 'Funds not received',
      description: 'I transferred funds but they were not received by the recipient',
      transactionId: `TRX-${Date.now()}`,
      counterpartyId: mockUserId2,
      amount: 500
    };

    await disputeModal.getByLabel(/reason/i).selectOption('Funds not received');
    await disputeModal.getByLabel(/description/i).fill(mockDisputeData.description);
    await disputeModal.getByLabel(/transaction id/i).fill(mockDisputeData.transactionId);
    await disputeModal.getByLabel(/amount/i).fill(mockDisputeData.amount.toString());

    // Submit the dispute
    await disputeModal.getByRole('button', { name: /submit/i }).click();

    // Wait for success confirmation
    await expect(page.getByText(/dispute submitted successfully/i)).toBeVisible();

    // Check if dispute appears in the list
    await expect(page.getByText(mockDisputeData.description)).toBeVisible();
    
    // Find dispute ID from the list
    const disputeElement = page.getByText(/dispute-/i).first();
    const disputeText = await disputeElement.textContent();
    disputeId = disputeText ? disputeText.match(/dispute-([a-zA-Z0-9]+)/i)?.[0] || '' : '';
    expect(disputeId).toBeTruthy();
    
    // Verify dispute status is "Open"
    await expect(page.getByText(/open/i).first()).toBeVisible();
  });

  test('should submit evidence for a dispute', async ({ page }) => {
    // Login as first test user
    await loginAsMockUser(page, 'dispute-test-1@example.com', 'TestPassword123!');

    // Navigate to disputes page
    await page.goto('/dashboard/disputes');
    
    // Open the created dispute
    await page.getByText(disputeId).click();
    
    // Switch to Evidence tab
    await page.getByRole('tab', { name: /evidence/i }).click();
    
    // Click submit evidence button
    await page.getByRole('button', { name: /submit evidence/i }).click();
    
    // Fill evidence form
    await page.getByLabel(/type of evidence/i).click();
    await page.getByText(/text/i).click();
    
    await page.getByLabel(/description/i).fill('Transaction confirmation screenshot');
    await page.getByLabel(/content/i).fill('This is evidence text showing that the transaction was completed from my side.');
    
    // Submit evidence
    await page.getByRole('button', { name: /submit evidence/i }).nth(1).click();
    
    // Verify evidence was submitted
    await expect(page.getByText(/evidence submitted/i)).toBeVisible();
    await expect(page.getByText(/transaction confirmation screenshot/i)).toBeVisible();
  });

  test('should allow admin to review and resolve a dispute', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to admin disputes page
    await page.goto('/admin/disputes');
    
    // Find and open the created dispute
    await page.getByText(disputeId).click();
    
    // Check the dispute details are visible
    await expect(page.getByText(/funds not received/i)).toBeVisible();
    
    // Add an admin comment
    await page.getByRole('tab', { name: /comments/i }).click();
    await page.getByPlaceholder(/type your comment here/i).fill('We have reviewed this case and confirmed that the payment was sent correctly.');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Verify comment was added
    await expect(page.getByText(/comment added/i)).toBeVisible();
    
    // Update dispute status to "Under Review"
    await page.getByRole('tab', { name: /details/i }).click();
    await page.getByRole('button', { name: /move to review/i }).click();
    
    // Check status was updated
    await expect(page.getByText(/status changed/i)).toBeVisible();
    await expect(page.getByText(/under review/i)).toBeVisible();
    
    // Resolve the dispute
    await page.getByRole('button', { name: /resolve dispute/i }).click();
    
    // Fill resolution form
    await page.getByLabel(/resolution status/i).click();
    await page.getByText('Resolved').click();
    await page.getByLabel(/resolution details/i).fill('After reviewing the evidence, we confirm the transaction was processed successfully. The recipient should check their account again.');
    
    // Submit resolution
    await page.getByRole('button', { name: /submit resolution/i }).click();
    
    // Verify resolution was applied
    await expect(page.getByText(/dispute has been resolved/i)).toBeVisible();
    
    // Check status is now "Resolved"
    await expect(page.getByRole('status', { name: /resolved/i })).toBeVisible();
  });

  test('should notify the user about dispute resolution', async ({ page }) => {
    // Login as first test user
    await loginAsMockUser(page, 'dispute-test-1@example.com', 'TestPassword123!');

    // Navigate to notifications page
    await page.goto('/dashboard/notifications');
    
    // Check for dispute resolution notification
    await expect(page.getByText(/your dispute .* has been resolved/i)).toBeVisible();
    
    // Navigate to disputes page to see resolved status
    await page.goto('/dashboard/disputes');
    
    // Find and open the dispute
    await page.getByText(disputeId).click();
    
    // Verify dispute shows resolved status
    await expect(page.getByRole('status', { name: /resolved/i })).toBeVisible();
    
    // Check resolution details
    await expect(page.getByText(/after reviewing the evidence/i)).toBeVisible();
  });
});
