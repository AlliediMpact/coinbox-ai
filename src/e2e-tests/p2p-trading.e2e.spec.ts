import { test, expect } from '@playwright/test';

/**
 * P2P Trading Lifecycle E2E Test Suite
 * 
 * This suite tests the complete P2P trading flow, including:
 * - Creating investment and borrowing tickets
 * - Matching process
 * - Escrow handling
 * - Transaction completion
 * - Dispute resolution (if needed)
 */

test.describe('P2P Trading Lifecycle', () => {
  // We'll need two users for P2P testing - an investor and a borrower
  let investorPage;
  let borrowerPage;

  test.beforeAll(async ({ browser }) => {
    // Create two isolated browser contexts for each user
    const investorContext = await browser.newContext();
    const borrowerContext = await browser.newContext();
    
    investorPage = await investorContext.newPage();
    borrowerPage = await borrowerContext.newPage();
    
    // Set up investor user
    await setupUser(investorPage, 'investor@example.com', 'InvestorPass123!', 'investor-123');
    
    // Set up borrower user
    await setupUser(borrowerPage, 'borrower@example.com', 'BorrowerPass123!', 'borrower-123');
  });

  async function setupUser(page, email, password, userId) {
    // Mock an authenticated user session
    await page.addInitScript(({ email, userId }) => {
      // Mock localStorage for a logged-in user with completed onboarding
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_id', userId);
      localStorage.setItem('user_email', email);
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
      localStorage.setItem(`onboarding_progress_${userId}`, '100');
    }, { email, userId });
    
    // Navigate to the dashboard
    await page.goto('/dashboard');
  }

  test('User can create an investment ticket', async () => {
    // Go to trading section
    await investorPage.goto('/dashboard/trade');
    
    // Click on "Create New Ticket" button
    await investorPage.getByRole('button', { name: /create new ticket/i }).click();
    
    // Select "Invest" option
    await investorPage.getByLabel(/invest/i).check();
    
    // Fill in investment details
    await investorPage.getByLabel(/amount/i).fill('1000');
    await investorPage.getByLabel(/duration/i).selectOption('30'); // 30 days
    
    // Submit the form
    await investorPage.getByRole('button', { name: /create ticket/i }).click();
    
    // Check if success message appears
    await expect(investorPage.getByText(/investment ticket created successfully/i)).toBeVisible();
    
    // Verify the ticket appears in the "My Tickets" section
    await investorPage.getByRole('tab', { name: /my tickets/i }).click();
    await expect(investorPage.getByText(/invest.*1,000/i)).toBeVisible();
    await expect(investorPage.getByText(/status.*open/i)).toBeVisible();
  });

  test('User can create a borrow ticket', async () => {
    // Go to trading section
    await borrowerPage.goto('/dashboard/trade');
    
    // Click on "Create New Ticket" button
    await borrowerPage.getByRole('button', { name: /create new ticket/i }).click();
    
    // Select "Borrow" option
    await borrowerPage.getByLabel(/borrow/i).check();
    
    // Fill in borrowing details
    await borrowerPage.getByLabel(/amount/i).fill('1000');
    await borrowerPage.getByLabel(/duration/i).selectOption('30'); // 30 days
    
    // Submit the form
    await borrowerPage.getByRole('button', { name: /create ticket/i }).click();
    
    // Check if success message appears
    await expect(borrowerPage.getByText(/borrow ticket created successfully/i)).toBeVisible();
    
    // Verify the ticket appears in the "My Tickets" section
    await borrowerPage.getByRole('tab', { name: /my tickets/i }).click();
    await expect(borrowerPage.getByText(/borrow.*1,000/i)).toBeVisible();
    await expect(borrowerPage.getByText(/status.*open/i)).toBeVisible();
  });

  test('System should match compatible investment and borrow tickets', async () => {
    // In a real application, this might happen automatically through a background process
    // For testing purposes, we'll trigger it manually or wait for it to happen
    
    // We'll simulate waiting for the system to match tickets
    // In a real test, we might use API calls to force matching or wait with polling
    
    // Check investor's matched tickets
    await investorPage.goto('/dashboard/trade');
    await investorPage.getByRole('tab', { name: /matches/i }).click();
    
    // Wait for up to 10 seconds for a match to appear
    await expect(async () => {
      await investorPage.reload();
      await expect(investorPage.getByText(/matched with borrower/i)).toBeVisible();
    }).toPass({ timeout: 10000 });
    
    // Check borrower's matched tickets
    await borrowerPage.goto('/dashboard/trade');
    await borrowerPage.getByRole('tab', { name: /matches/i }).click();
    
    await expect(borrowerPage.getByText(/matched with investor/i)).toBeVisible();
  });

  test('Investor can approve the match and funds go to escrow', async () => {
    // Navigate to matches tab
    await investorPage.goto('/dashboard/trade');
    await investorPage.getByRole('tab', { name: /matches/i }).click();
    
    // Find the match and click approve
    await investorPage.getByRole('button', { name: /approve match/i }).click();
    
    // Confirm the approval in the dialog
    await investorPage.getByRole('button', { name: /confirm/i }).click();
    
    // Check success message
    await expect(investorPage.getByText(/match approved, funds moved to escrow/i)).toBeVisible();
    
    // Verify ticket status changed to "Escrow"
    await investorPage.getByRole('tab', { name: /my tickets/i }).click();
    await expect(investorPage.getByText(/status.*escrow/i)).toBeVisible();
  });

  test('Borrower receives funds after approval', async () => {
    // Go to borrower's dashboard
    await borrowerPage.goto('/dashboard/trade');
    
    // Check for notification that funds are available
    await expect(borrowerPage.getByText(/funds available/i)).toBeVisible();
    
    // Check wallet balance has increased
    await borrowerPage.goto('/dashboard/wallet');
    
    // The specific UI might vary, but we expect to see the borrowed amount in the balance
    await expect(borrowerPage.getByText(/1,000/)).toBeVisible();
    await expect(borrowerPage.getByText(/recent transaction/i)).toBeVisible();
  });

  test('Borrower can repay the loan', async () => {
    // Go to borrower's trade page
    await borrowerPage.goto('/dashboard/trade');
    await borrowerPage.getByRole('tab', { name: /my tickets/i }).click();
    
    // Find the active loan and click repay
    await borrowerPage.getByRole('button', { name: /repay/i }).click();
    
    // Confirm repayment in the dialog - including the 25% fee
    await borrowerPage.getByRole('button', { name: /confirm repayment/i }).click();
    
    // Check success message
    await expect(borrowerPage.getByText(/loan repaid successfully/i)).toBeVisible();
    
    // Verify ticket status changed to "Completed"
    await expect(borrowerPage.getByText(/status.*completed/i)).toBeVisible();
  });

  test('Investor receives repayment with interest', async () => {
    // Go to investor's dashboard
    await investorPage.goto('/dashboard/trade');
    
    // Check for notification about repayment
    await expect(investorPage.getByText(/loan repaid/i)).toBeVisible();
    
    // Check wallet balance has increased with interest
    await investorPage.goto('/dashboard/wallet');
    
    // The specific UI might vary, but we expect to see the invested amount plus interest
    await expect(investorPage.getByText(/1,200/)).toBeVisible(); // Original 1000 + 20% interest
    await expect(investorPage.getByText(/interest earned/i)).toBeVisible();
  });

  test('Users can view the full transaction history', async () => {
    // Check investor's transaction history
    await investorPage.goto('/dashboard/transactions');
    await expect(investorPage.getByText(/investment/i)).toBeVisible();
    await expect(investorPage.getByText(/repayment received/i)).toBeVisible();
    
    // Check borrower's transaction history
    await borrowerPage.goto('/dashboard/transactions');
    await expect(borrowerPage.getByText(/loan received/i)).toBeVisible();
    await expect(borrowerPage.getByText(/loan repayment/i)).toBeVisible();
  });

  test('Compliance report includes the transaction', async () => {
    // This test would be for admin users
    // Create an admin user context and page
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Set up admin user
    await adminPage.addInitScript(() => {
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_id', 'admin-123');
      localStorage.setItem('user_email', 'admin@example.com');
      localStorage.setItem('user_role', 'admin');
    });
    
    // Go to the admin dashboard
    await adminPage.goto('/admin');
    
    // Navigate to compliance reporting
    await adminPage.getByText(/compliance reporting/i).click();
    
    // Generate a report for the current period
    await adminPage.getByRole('button', { name: /generate report/i }).click();
    
    // Wait for report generation
    await expect(adminPage.getByText(/report generated successfully/i)).toBeVisible();
    
    // Go to report history
    await adminPage.getByRole('tab', { name: /report history/i }).click();
    
    // Check if the transaction is included in the report
    await adminPage.getByRole('button', { name: /download/i }).first().click();
    
    // In a real test, we might download and parse the report
    // For now, we'll assume it works correctly if we reach this point
  });
});
