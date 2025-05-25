import { Page, expect } from '@playwright/test';

/**
 * Navigate to the trading dashboard
 */
export async function navigateToTrading(page: Page): Promise<void> {
  await page.goto('/dashboard/trade');
  await page.waitForSelector('[data-testid="trading-dashboard"]', { state: 'visible' });
}

/**
 * Create a new trading ticket
 * @param page Playwright page
 * @param options Trading ticket options
 * @returns The ID of the created ticket
 */
export async function createTradingTicket(
  page: Page,
  options: {
    type: 'Borrow' | 'Invest',
    amount: number,
    interest?: number,
    description?: string
  }
): Promise<string> {
  await navigateToTrading(page);

  // Click create new ticket button
  await page.click('[data-testid="create-ticket-btn"]');

  // Select ticket type
  await page.selectOption('[data-testid="ticket-type"]', options.type);

  // Enter amount
  await page.fill('[data-testid="ticket-amount"]', options.amount.toString());

  // Set interest rate if provided
  if (options.interest) {
    await page.fill('[data-testid="ticket-interest"]', options.interest.toString());
  }

  // Enter description if provided
  if (options.description) {
    await page.fill('[data-testid="ticket-description"]', options.description);
  }

  // Submit the form
  await page.click('[data-testid="submit-ticket-btn"]');

  // Wait for success message
  await page.waitForSelector('[data-testid="ticket-success-message"]', { state: 'visible' });

  // Extract ticket ID from success message or URL
  const ticketUrl = page.url();
  const ticketId = ticketUrl.split('/').pop();

  return ticketId;
}

/**
 * Find matching tickets for a given ticket
 */
export async function findMatchingTicket(page: Page, ticketId: string): Promise<string | null> {
  await page.goto(`/dashboard/trade/ticket/${ticketId}`);
  
  // Click find match button
  await page.click('[data-testid="find-match-btn"]');
  
  // Wait for result (either match found or no match)
  try {
    await page.waitForSelector('[data-testid="match-found-message"]', { state: 'visible', timeout: 5000 });
    
    // Extract matched ticket ID
    const matchElement = await page.$('[data-testid="matched-ticket-id"]');
    if (matchElement) {
      return await matchElement.innerText();
    }
    return null;
  } catch {
    // No match found
    return null;
  }
}

/**
 * Complete an escrow process for a matched ticket
 * @param page Playwright page
 * @param ticketId Optional ticket ID (if not provided, will use the first active escrow)
 */
export async function completeEscrow(page: Page, ticketId?: string): Promise<void> {
  if (ticketId) {
    await page.goto(`/dashboard/trade/ticket/${ticketId}`);
  } else {
    await page.goto('/dashboard/trade/active');
    // Click on the first escrow ticket
    await page.click('[data-testid="escrow-ticket"]');
  }
  
  // Verify escrow page is loaded
  await page.waitForSelector('[data-testid="escrow-details"]', { state: 'visible' });
  
  // Confirm the escrow
  await page.click('[data-testid="confirm-escrow-btn"]');
  
  // Wait for confirmation dialog
  await page.waitForSelector('[data-testid="confirmation-dialog"]', { state: 'visible' });
  
  // Confirm the action
  await page.click('[data-testid="confirm-action-btn"]');
  
  // Wait for success message
  await page.waitForSelector('[data-testid="escrow-success-message"]', { state: 'visible' });
}

/**
 * Cancel an open trading ticket
 */
export async function cancelTicket(page: Page, ticketId: string): Promise<void> {
  await page.goto(`/dashboard/trade/ticket/${ticketId}`);
  
  // Click cancel button
  await page.click('[data-testid="cancel-ticket-btn"]');
  
  // Wait for confirmation dialog
  await page.waitForSelector('[data-testid="confirmation-dialog"]', { state: 'visible' });
  
  // Confirm the cancellation
  await page.click('[data-testid="confirm-action-btn"]');
  
  // Wait for success message
  await page.waitForSelector('[data-testid="cancel-success-message"]', { state: 'visible' });
}

/**
 * Get a list of user's active tickets
 * Returns an array of ticket IDs
 */
export async function getActiveTickets(page: Page): Promise<string[]> {
  await page.goto('/dashboard/trade/active');
  await page.waitForSelector('[data-testid="active-tickets-list"]', { state: 'visible' });
  
  // Get all ticket elements
  const ticketElements = await page.$$('[data-testid="ticket-item"]');
  
  // Extract ticket IDs
  const ticketIds = [];
  for (const element of ticketElements) {
    const idElement = await element.$('[data-testid="ticket-id"]');
    if (idElement) {
      const id = await idElement.innerText();
      ticketIds.push(id);
    }
  }
  
  return ticketIds;
}

/**
 * Get a list of user's completed trades
 * Returns an array of ticket IDs
 */
export async function getCompletedTrades(page: Page): Promise<string[]> {
  await page.goto('/dashboard/trade/completed');
  await page.waitForSelector('[data-testid="completed-tickets-list"]', { state: 'visible' });
  
  // Get all ticket elements
  const ticketElements = await page.$$('[data-testid="ticket-item"]');
  
  // Extract ticket IDs
  const ticketIds = [];
  for (const element of ticketElements) {
    const idElement = await element.$('[data-testid="ticket-id"]');
    if (idElement) {
      const id = await idElement.innerText();
      ticketIds.push(id);
    }
  }
  
  return ticketIds;
}

/**
 * Get details of a specific trading ticket
 */
export async function getTicketDetails(page: Page, ticketId: string): Promise<any> {
  await page.goto(`/dashboard/trade/ticket/${ticketId}`);
  await page.waitForSelector('[data-testid="ticket-details"]', { state: 'visible' });
  
  // Extract ticket details
  const type = await page.$eval('[data-testid="ticket-type"]', el => el.innerText);
  const amount = await page.$eval('[data-testid="ticket-amount"]', el => el.innerText);
  const status = await page.$eval('[data-testid="ticket-status"]', el => el.innerText);
  const createdAt = await page.$eval('[data-testid="ticket-created-at"]', el => el.innerText);
  
  // Get matched ticket ID if available
  let matchedTicketId = null;
  try {
    matchedTicketId = await page.$eval('[data-testid="matched-ticket-id"]', el => el.innerText);
  } catch {
    // No matched ticket
  }
  
  return {
    id: ticketId,
    type,
    amount: parseFloat(amount.replace(/[^0-9.]/g, '')),
    status,
    createdAt,
    matchedTicketId
  };
}
