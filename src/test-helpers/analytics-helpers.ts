import { Page } from '@playwright/test';

/**
 * Navigate to the analytics dashboard
 */
export async function navigateToAnalytics(page: Page): Promise<void> {
  // Click the analytics link in the sidebar
  await page.click('text=Analytics');
  
  // Wait for the page to load
  await page.waitForURL('**/dashboard/analytics');
}

/**
 * Select export format from the dropdown
 */
export async function selectExportFormat(page: Page, format: 'csv' | 'json' | 'pdf' | 'excel'): Promise<void> {
  // Open the export format dropdown
  await page.click('[data-testid="export-format-select"]');
  
  // Select the format
  await page.click(`[data-testid="export-format-${format}"]`);
}

/**
 * Trigger export for a specific data type
 */
export async function triggerExport(
  page: Page, 
  dataType: 'transactions' | 'users' | 'revenue' | 'system'
): Promise<void> {
  // Find the export button for the specified data type
  await page.click(`[data-testid="export-${dataType}-button"]`);
}

/**
 * Verify that the export success toast appears
 */
export async function verifyExportSuccess(page: Page): Promise<void> {
  await page.waitForSelector('text=Export Complete', { state: 'visible' });
}

/**
 * Change the time period for the analytics data
 */
export async function changeTimePeriod(page: Page, period: 'week' | 'month' | 'quarter'): Promise<void> {
  // Open the period selector dropdown
  await page.click('[data-testid="period-select"]');
  
  // Select the period
  await page.click(`[data-testid="period-${period}"]`);
  
  // Wait for data to reload
  await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' });
}

/**
 * Switch between analytics tabs
 */
export async function switchToAnalyticsTab(
  page: Page, 
  tab: 'overview' | 'transactions' | 'users' | 'revenue' | 'system'
): Promise<void> {
  // Click the tab
  await page.click(`[data-testid="tab-${tab}"]`);
  
  // Wait for the tab content to load
  await page.waitForSelector(`[data-testid="${tab}-content"]`, { state: 'visible' });
}

/**
 * Refresh analytics data
 */
export async function refreshAnalyticsData(page: Page): Promise<void> {
  await page.click('[data-testid="refresh-button"]');
  await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' });
}

/**
 * Wait for chart data to load
 */
export async function waitForChartData(page: Page, chartTestId: string): Promise<void> {
  await page.waitForSelector(`[data-testid="${chartTestId}"] .recharts-surface`, { state: 'visible' });
}
