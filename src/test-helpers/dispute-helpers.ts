import { Page } from '@playwright/test';

/**
 * Navigate to the disputes dashboard
 */
export async function navigateToDisputes(page: Page): Promise<void> {
  await page.goto('/dashboard/disputes');
  await page.waitForSelector('[data-testid="disputes-dashboard"]', { state: 'visible' });
}

/**
 * Create a new dispute
 * @param page Playwright page
 * @param options Dispute details
 * @returns The ID of the created dispute
 */
export async function createDispute(
  page: Page,
  options: {
    type: string,
    description: string,
    ticketId?: string
  }
): Promise<string> {
  // If ticketId is provided, navigate directly to that ticket
  if (options.ticketId) {
    await page.goto(`/dashboard/trade/ticket/${options.ticketId}`);
  } else {
    // Otherwise, go to completed tickets and select the first one
    await page.goto('/dashboard/trade/completed');
    await page.click('[data-testid="ticket-item"]');
  }
  
  // Click create dispute button
  await page.click('[data-testid="create-dispute-btn"]');
  
  // Fill in dispute details
  await page.selectOption('[data-testid="dispute-type"]', options.type);
  await page.fill('[data-testid="dispute-description"]', options.description);
  
  // Submit dispute
  await page.click('[data-testid="submit-dispute-btn"]');
  
  // Wait for success message
  await page.waitForSelector('[data-testid="dispute-success-message"]', { state: 'visible' });
  
  // Extract dispute ID from success message or URL
  const disputeUrl = page.url();
  const disputeId = disputeUrl.split('/').pop();
  
  return disputeId;
}

/**
 * Submit evidence for a dispute
 * @param page Playwright page
 * @param disputeId The ID of the dispute
 * @param options Evidence details
 */
export async function submitEvidence(
  page: Page,
  disputeId: string,
  options: {
    type: string,
    description: string,
    filePath?: string
  }
): Promise<void> {
  await page.goto(`/dashboard/disputes/${disputeId}`);
  
  // Click submit evidence button
  await page.click('[data-testid="submit-evidence-btn"]');
  
  // Fill in evidence details
  await page.selectOption('[data-testid="evidence-type"]', options.type);
  await page.fill('[data-testid="evidence-description"]', options.description);
  
  // Upload file if provided
  if (options.filePath) {
    await page.setInputFiles('[data-testid="evidence-file-input"]', options.filePath);
  }
  
  // Submit evidence
  await page.click('[data-testid="submit-evidence-form-btn"]');
  
  // Wait for success message
  await page.waitForSelector('[data-testid="evidence-success-message"]', { state: 'visible' });
}

/**
 * Get a list of user's active disputes
 * Returns an array of dispute IDs
 */
export async function getActiveDisputes(page: Page): Promise<string[]> {
  await navigateToDisputes(page);
  
  // Get all dispute elements
  const disputeElements = await page.$$('[data-testid="dispute-item"]');
  
  // Extract dispute IDs
  const disputeIds = [];
  for (const element of disputeElements) {
    const idElement = await element.$('[data-testid="dispute-id"]');
    if (idElement) {
      const id = await idElement.innerText();
      disputeIds.push(id);
    }
  }
  
  return disputeIds;
}

/**
 * Get details of a specific dispute
 */
export async function getDisputeDetails(page: Page, disputeId: string): Promise<any> {
  await page.goto(`/dashboard/disputes/${disputeId}`);
  await page.waitForSelector('[data-testid="dispute-details"]', { state: 'visible' });
  
  // Extract dispute details
  const type = await page.$eval('[data-testid="dispute-type"]', el => el.innerText);
  const status = await page.$eval('[data-testid="dispute-status"]', el => el.innerText);
  const description = await page.$eval('[data-testid="dispute-description"]', el => el.innerText);
  const createdAt = await page.$eval('[data-testid="dispute-created-at"]', el => el.innerText);
  
  // Get resolution details if available
  let resolution = null;
  try {
    resolution = await page.$eval('[data-testid="dispute-resolution"]', el => el.innerText);
  } catch {
    // No resolution yet
  }
  
  // Get evidence list
  const evidenceElements = await page.$$('[data-testid="evidence-item"]');
  const evidence = [];
  
  for (const element of evidenceElements) {
    const evidenceType = await element.$eval('[data-testid="evidence-type"]', el => el.innerText);
    const evidenceDesc = await element.$eval('[data-testid="evidence-description"]', el => el.innerText);
    evidence.push({ type: evidenceType, description: evidenceDesc });
  }
  
  return {
    id: disputeId,
    type,
    status,
    description,
    createdAt,
    resolution,
    evidence
  };
}

/**
 * Respond to a dispute (as counterparty)
 */
export async function respondToDispute(
  page: Page,
  disputeId: string,
  response: string
): Promise<void> {
  await page.goto(`/dashboard/disputes/${disputeId}`);
  
  // Click respond button
  await page.click('[data-testid="respond-dispute-btn"]');
  
  // Fill in response
  await page.fill('[data-testid="dispute-response"]', response);
  
  // Submit response
  await page.click('[data-testid="submit-response-btn"]');
  
  // Wait for success message
  await page.waitForSelector('[data-testid="response-success-message"]', { state: 'visible' });
}

/**
 * Resolve a dispute (as admin)
 */
export async function resolveDispute(
  page: Page,
  disputeId: string,
  options: {
    resolution: string,
    details: string
  }
): Promise<void> {
  await page.goto(`/admin/disputes/${disputeId}`);
  
  // Click resolve dispute button
  await page.click('[data-testid="resolve-dispute-btn"]');
  
  // Fill in resolution details
  await page.selectOption('[data-testid="resolution-type"]', options.resolution);
  await page.fill('[data-testid="resolution-details"]', options.details);
  
  // Submit resolution
  await page.click('[data-testid="submit-resolution-btn"]');
  
  // Wait for success message
  await page.waitForSelector('[data-testid="resolution-success-message"]', { state: 'visible' });
}
