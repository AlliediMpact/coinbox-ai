import { Page } from '@playwright/test';

/**
 * Navigate to the memberships page
 */
export async function navigateToMemberships(page: Page): Promise<void> {
  await page.goto('/dashboard/membership');
  await page.waitForSelector('[data-testid="membership-tiers"]', { state: 'visible' });
}

/**
 * Purchase a membership
 * @param page Playwright page
 * @param tierName The membership tier to purchase ('Basic', 'Ambassador', 'VIP', or 'Business')
 * @param referralCode Optional referral code
 */
export async function purchaseMembership(
  page: Page, 
  tierName: 'Basic' | 'Ambassador' | 'VIP' | 'Business',
  referralCode?: string
): Promise<void> {
  // Select membership tier
  await page.click(`[data-testid="tier-${tierName.toLowerCase()}"]`);
  
  // Click the purchase button
  await page.click('[data-testid="purchase-membership-btn"]');
  
  // Fill in referral code if provided
  if (referralCode) {
    await page.fill('[data-testid="referral-code"]', referralCode);
  }
  
  // Continue to payment
  await page.click('[data-testid="continue-to-payment"]');
  
  // Fill in payment details (using test card)
  await page.fill('[data-testid="card-number"]', '4242424242424242');
  await page.fill('[data-testid="card-expiry"]', '12/25');
  await page.fill('[data-testid="card-cvc"]', '123');
  
  // Submit payment
  await page.click('[data-testid="submit-payment"]');
  
  // Wait for payment processing
  await page.waitForSelector('[data-testid="payment-success"]', { state: 'visible', timeout: 10000 });
}

/**
 * Navigate to the user's membership details
 */
export async function navigateToMembershipDetails(page: Page): Promise<void> {
  await page.goto('/dashboard/membership/details');
  await page.waitForSelector('[data-testid="membership-details"]', { state: 'visible' });
}

/**
 * Upgrade a membership
 * @param page Playwright page
 * @param newTierName The new membership tier to upgrade to
 */
export async function upgradeMembership(
  page: Page,
  newTierName: 'Ambassador' | 'VIP' | 'Business'
): Promise<void> {
  await navigateToMembershipDetails(page);
  
  // Click the upgrade button
  await page.click('[data-testid="upgrade-membership-btn"]');
  
  // Select the new tier
  await page.click(`[data-testid="tier-${newTierName.toLowerCase()}"]`);
  
  // Confirm upgrade
  await page.click('[data-testid="confirm-upgrade-btn"]');
  
  // Fill in payment details for the upgrade fee
  await page.fill('[data-testid="card-number"]', '4242424242424242');
  await page.fill('[data-testid="card-expiry"]', '12/25');
  await page.fill('[data-testid="card-cvc"]', '123');
  
  // Submit payment
  await page.click('[data-testid="submit-payment"]');
  
  // Wait for upgrade processing
  await page.waitForSelector('[data-testid="upgrade-success"]', { state: 'visible', timeout: 10000 });
}

/**
 * Generate a referral code
 */
export async function generateReferralCode(page: Page): Promise<string> {
  await navigateToMembershipDetails(page);
  
  // Check if referral code already exists
  const existingCodeElement = await page.$('[data-testid="referral-code"]');
  
  if (existingCodeElement) {
    const existingCode = await existingCodeElement.innerText();
    if (existingCode && existingCode.trim() !== '') {
      return existingCode;
    }
  }
  
  // Generate a new referral code
  await page.click('[data-testid="generate-referral-code-btn"]');
  await page.waitForSelector('[data-testid="referral-code"]', { state: 'visible' });
  
  // Get the generated code
  const codeElement = await page.$('[data-testid="referral-code"]');
  const referralCode = await codeElement.innerText();
  
  return referralCode;
}

/**
 * Check membership statistics
 * Returns basic info about the membership
 */
export async function getMembershipInfo(page: Page): Promise<{
  tier: string;
  status: string;
  loanLimit: number;
  investmentLimit: number;
}> {
  await navigateToMembershipDetails(page);
  
  // Get tier name
  const tierElement = await page.$('[data-testid="membership-tier"]');
  const tier = await tierElement.innerText();
  
  // Get status
  const statusElement = await page.$('[data-testid="membership-status"]');
  const status = await statusElement.innerText();
  
  // Get loan limit
  const loanLimitElement = await page.$('[data-testid="loan-limit"]');
  const loanLimitText = await loanLimitElement.innerText();
  const loanLimit = parseInt(loanLimitText.replace(/[^0-9]/g, ''));
  
  // Get investment limit
  const investmentLimitElement = await page.$('[data-testid="investment-limit"]');
  const investmentLimitText = await investmentLimitElement.innerText();
  const investmentLimit = parseInt(investmentLimitText.replace(/[^0-9]/g, ''));
  
  return {
    tier,
    status,
    loanLimit,
    investmentLimit
  };
}
