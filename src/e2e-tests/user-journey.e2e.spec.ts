import { test, expect } from '@playwright/test';
import { login, register, logout } from '../test-helpers/auth-helpers';
import { navigateToMemberships, purchaseMembership } from '../test-helpers/membership-helpers';
import { createTradingTicket, findMatchingTicket, completeEscrow } from '../test-helpers/trading-helpers';
import { createDispute, submitEvidence } from '../test-helpers/dispute-helpers';
import { checkNotifications } from '../test-helpers/notification-helpers';
import { navigateToAnalytics, exportData } from '../test-helpers/analytics-helpers';

test.describe('End-to-End User Journey', () => {
  // User credentials for our test
  const testUser = {
    email: `test-user-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Test User'
  };
  
  const testInvestor = {
    email: `test-investor-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Test Investor'
  };
  
  const adminUser = {
    email: 'admin@coinbox.ai',
    password: 'Admin@123456'
  };

  test('Complete user journey: Registration → Membership → Trading → Dispute → Resolution', async ({ page, context }) => {
    // 1. User Registration
    test.step('Register a new user', async () => {
      await page.goto('/');
      await register(page, testUser.email, testUser.password, testUser.name);
      
      // Verify registration was successful
      await expect(page.getByText('Welcome to CoinBox AI')).toBeVisible();
      await expect(page.getByText(testUser.name)).toBeVisible();
    });
    
    // 2. Purchase Membership
    test.step('Purchase a Basic membership', async () => {
      await navigateToMemberships(page);
      await purchaseMembership(page, 'Basic');
      
      // Verify membership purchase was successful
      await expect(page.getByText('Membership activated successfully')).toBeVisible();
      await expect(page.getByText('Basic Membership')).toBeVisible();
    });
    
    // 3. Create a Borrow Ticket
    let ticketId;
    test.step('Create a borrow ticket', async () => {
      await page.goto('/dashboard/trade');
      ticketId = await createTradingTicket(page, {
        type: 'Borrow',
        amount: 400,
        interest: 25,
        description: 'Need funds for personal expenses'
      });
      
      // Verify ticket creation was successful
      await expect(page.getByText('Ticket created successfully')).toBeVisible();
      await expect(page.getByText('R400')).toBeVisible();
      await expect(page.getByText('Borrow')).toBeVisible();
    });
    
    // 4. Logout and login as an investor
    test.step('Switch to investor account', async () => {
      await logout(page);
      
      // Register the investor
      await register(page, testInvestor.email, testInvestor.password, testInvestor.name);
      
      // Purchase membership for investor
      await navigateToMemberships(page);
      await purchaseMembership(page, 'Basic');
    });
    
    // 5. Create a matching investment ticket
    test.step('Create a matching investment ticket', async () => {
      await page.goto('/dashboard/trade');
      await createTradingTicket(page, {
        type: 'Invest',
        amount: 400,
        interest: 25,
        description: 'Investment funds available'
      });
      
      // Verify ticket creation was successful
      await expect(page.getByText('Ticket created successfully')).toBeVisible();
      await expect(page.getByText('R400')).toBeVisible();
      await expect(page.getByText('Invest')).toBeVisible();
      
      // Wait for matching to occur
      await page.waitForTimeout(2000);
      
      // Verify match was found
      await expect(page.getByText('Match found')).toBeVisible();
    });
    
    // 6. Complete the escrow process
    test.step('Complete the escrow process', async () => {
      await page.goto('/dashboard/trade/active');
      await completeEscrow(page);
      
      // Verify escrow completion was successful
      await expect(page.getByText('Trade completed successfully')).toBeVisible();
    });
    
    // 7. Logout and login as original user
    test.step('Switch back to borrower account', async () => {
      await logout(page);
      await login(page, testUser.email, testUser.password);
    });
    
    // 8. Check notifications
    test.step('Check for trade notifications', async () => {
      await checkNotifications(page);
      
      // Verify notifications are present
      await expect(page.getByText('Your trade has been matched')).toBeVisible();
      await expect(page.getByText('Escrow completed')).toBeVisible();
    });
    
    // 9. Create a dispute
    let disputeId;
    test.step('Create a dispute for the trade', async () => {
      await page.goto('/dashboard/trade/completed');
      disputeId = await createDispute(page, {
        type: 'Other issue',
        description: 'There was an issue with this transaction'
      });
      
      // Verify dispute creation was successful
      await expect(page.getByText('Dispute created successfully')).toBeVisible();
    });
    
    // 10. Submit evidence for the dispute
    test.step('Submit evidence for the dispute', async () => {
      await page.goto('/dashboard/disputes');
      await submitEvidence(page, disputeId, {
        type: 'Text description',
        description: 'Detailed explanation of the issue'
      });
      
      // Verify evidence submission was successful
      await expect(page.getByText('Evidence submitted successfully')).toBeVisible();
    });
    
    // 11. Logout and login as admin
    test.step('Login as admin to resolve the dispute', async () => {
      await logout(page);
      await login(page, adminUser.email, adminUser.password);
    });
    
    // 12. Resolve the dispute as admin
    test.step('Resolve the dispute', async () => {
      await page.goto('/admin/disputes');
      
      // Find and click on the dispute
      await page.getByText(disputeId).click();
      
      // Resolve the dispute
      await page.getByText('Resolve Dispute').click();
      await page.getByLabel('Resolution').selectOption('In favor of complainant');
      await page.getByLabel('Resolution Details').fill('After reviewing the evidence, the dispute is resolved in favor of the complainant');
      await page.getByText('Submit Resolution').click();
      
      // Verify dispute resolution was successful
      await expect(page.getByText('Dispute resolved successfully')).toBeVisible();
    });
    
    // 13. Check analytics data as admin
    test.step('Check analytics data', async () => {
      await navigateToAnalytics(page);
      
      // Verify analytics page loads correctly
      await expect(page.getByText('Platform Analytics')).toBeVisible();
      
      // Export analytics data
      await exportData(page, 'transactions', 'csv');
      
      // Verify export was successful
      await expect(page.getByText('Export Complete')).toBeVisible();
    });
  });
});
