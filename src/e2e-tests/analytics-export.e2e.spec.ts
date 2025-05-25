import { test, expect } from '@playwright/test';
import { 
  navigateToAnalytics, 
  selectExportFormat, 
  triggerExport, 
  verifyExportSuccess 
} from '../test-helpers/analytics-helpers';
import { login } from '../test-helpers/auth-helpers';

test.describe('Analytics Export', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a user with access to analytics
    await login(page, 'admin@coinbox.ai', 'TestPassword123!');
    
    // Navigate to the analytics dashboard
    await navigateToAnalytics(page);
    
    // Wait for the analytics data to load
    await page.waitForSelector('[data-testid="analytics-overview"]', { state: 'visible' });
  });
  
  test('should export transaction data as CSV', async ({ page, context }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Select CSV export format and export transactions
    await selectExportFormat(page, 'csv');
    await triggerExport(page, 'transactions');
    
    // Wait for the download to start
    const download = await downloadPromise;
    
    // Verify the file name
    expect(download.suggestedFilename()).toContain('coinbox-transactions');
    expect(download.suggestedFilename()).toContain('.csv');
    
    // Verify export success toast appears
    await verifyExportSuccess(page);
  });
  
  test('should export user growth data as JSON', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Select JSON export format and export user growth data
    await selectExportFormat(page, 'json');
    await triggerExport(page, 'users');
    
    // Wait for the download to start
    const download = await downloadPromise;
    
    // Verify the file name
    expect(download.suggestedFilename()).toContain('coinbox-user-growth');
    expect(download.suggestedFilename()).toContain('.json');
    
    // Verify export success toast appears
    await verifyExportSuccess(page);
  });
  
  test('should export revenue data as PDF', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Select PDF export format and export revenue data
    await selectExportFormat(page, 'pdf');
    await triggerExport(page, 'revenue');
    
    // Wait for the download to start
    const download = await downloadPromise;
    
    // Verify the file name
    expect(download.suggestedFilename()).toContain('coinbox-revenue');
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // Verify export success toast appears
    await verifyExportSuccess(page);
  });
  
  test('should export system performance data as Excel', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Select Excel export format and export system performance data
    await selectExportFormat(page, 'excel');
    await triggerExport(page, 'system');
    
    // Wait for the download to start
    const download = await downloadPromise;
    
    // Verify the file name
    expect(download.suggestedFilename()).toContain('coinbox-system-performance');
    expect(download.suggestedFilename()).toContain('.xlsx');
    
    // Verify export success toast appears
    await verifyExportSuccess(page);
  });
  
  test('should show error toast when export fails', async ({ page }) => {
    // Force the export to fail by disconnecting network
    await page.route('**/api/analytics/export**', route => route.abort());
    
    // Select JSON export format and attempt to export data
    await selectExportFormat(page, 'json');
    await triggerExport(page, 'transactions');
    
    // Verify error toast appears
    await expect(page.getByText('Export Failed')).toBeVisible();
    await expect(page.getByText('Failed to generate export')).toBeVisible();
  });
});
