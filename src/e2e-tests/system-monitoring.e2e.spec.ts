import { test, expect } from '@playwright/test';

/**
 * System Monitoring and Reliability E2E Test Suite
 * 
 * This suite tests the system monitoring, alerting, and backup/restore functionality
 * which are critical for platform reliability and administration.
 */

test.describe('System Monitoring and Reliability', () => {
  test.beforeEach(async ({ page }) => {
    // Mock an admin user session
    await page.addInitScript(() => {
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_id', 'admin-123');
      localStorage.setItem('user_email', 'admin@example.com');
      localStorage.setItem('user_role', 'admin');
    });
    
    // Navigate to admin dashboard
    await page.goto('/admin');
  });

  test('Admin can access system monitoring dashboard', async ({ page }) => {
    // Navigate to monitoring page
    await page.getByText(/system monitoring/i).click();
    
    // Check if the monitoring dashboard loads
    await expect(page.getByRole('heading', { name: /system monitoring dashboard/i })).toBeVisible();
    
    // Check if key monitoring widgets are displayed
    await expect(page.getByText(/system health status/i)).toBeVisible();
    await expect(page.getByText(/active alerts/i)).toBeVisible();
    await expect(page.getByText(/recent logs/i)).toBeVisible();
  });

  test('System health status displays component statuses', async ({ page }) => {
    // Navigate to monitoring page
    await page.goto('/admin/monitoring');
    
    // Check if component statuses are displayed
    await expect(page.getByText(/authentication system/i)).toBeVisible();
    await expect(page.getByText(/transaction system/i)).toBeVisible();
    await expect(page.getByText(/database/i)).toBeVisible();
    await expect(page.getByText(/api services/i)).toBeVisible();
    
    // Ensure there are status indicators (like "Operational", "Degraded", etc.)
    await expect(page.getByText(/operational/i)).toBeVisible();
  });

  test('Admin can view and filter system logs', async ({ page }) => {
    // Navigate to monitoring page
    await page.goto('/admin/monitoring');
    
    // Click on the logs tab
    await page.getByRole('tab', { name: /logs/i }).click();
    
    // Check if logs are displayed
    await expect(page.getByText(/log level/i)).toBeVisible();
    
    // Filter logs by level
    await page.getByRole('combobox', { name: /log level/i }).selectOption('error');
    await page.getByRole('button', { name: /apply filters/i }).click();
    
    // Check if filtered logs are displayed
    await expect(page.getByText(/error/i)).toBeVisible();
    
    // Check if timestamp and component information is displayed
    await expect(page.getByText(/timestamp/i)).toBeVisible();
    await expect(page.getByText(/component/i)).toBeVisible();
  });

  test('Admin can view and acknowledge alerts', async ({ page }) => {
    // Navigate to monitoring page
    await page.goto('/admin/monitoring');
    
    // Click on the alerts tab
    await page.getByRole('tab', { name: /alerts/i }).click();
    
    // Check if alerts are displayed
    await expect(page.getByText(/severity/i)).toBeVisible();
    
    // Acknowledge an alert (if there are any)
    const alertExists = await page.getByRole('button', { name: /acknowledge/i }).count() > 0;
    
    if (alertExists) {
      await page.getByRole('button', { name: /acknowledge/i }).first().click();
      await page.getByRole('button', { name: /confirm/i }).click();
      
      // Check if alert status is updated
      await expect(page.getByText(/acknowledged/i)).toBeVisible();
    } else {
      // If no alerts, check for "no alerts" message
      await expect(page.getByText(/no active alerts/i)).toBeVisible();
    }
  });

  test('Admin can configure backup settings', async ({ page }) => {
    // Navigate to backup management page
    await page.goto('/admin/backups');
    
    // Check if backup configuration options are displayed
    await expect(page.getByText(/backup schedule/i)).toBeVisible();
    
    // Change backup frequency
    await page.getByLabel(/backup frequency/i).selectOption('daily');
    
    // Set backup time
    await page.getByLabel(/backup time/i).fill('02:00');
    
    // Save changes
    await page.getByRole('button', { name: /save configuration/i }).click();
    
    // Check for success message
    await expect(page.getByText(/backup configuration updated/i)).toBeVisible();
  });

  test('Admin can view backup history', async ({ page }) => {
    // Navigate to backup management page
    await page.goto('/admin/backups');
    
    // Click on the history tab
    await page.getByRole('tab', { name: /history/i }).click();
    
    // Check if backup history is displayed
    await expect(page.getByText(/backup date/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
    await expect(page.getByText(/size/i)).toBeVisible();
  });

  test('Admin can initiate manual backup', async ({ page }) => {
    // Navigate to backup management page
    await page.goto('/admin/backups');
    
    // Click manual backup button
    await page.getByRole('button', { name: /manual backup/i }).click();
    
    // Confirm the action
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Check for progress indicator
    await expect(page.getByText(/backup in progress/i)).toBeVisible();
    
    // Wait for backup to complete (or timeout after 10s for testing)
    await expect(async () => {
      const successVisible = await page.getByText(/backup completed successfully/i).isVisible();
      if (!successVisible) {
        await page.reload();
      }
      await expect(page.getByText(/backup completed successfully/i)).toBeVisible();
    }).toPass({ timeout: 10000 });
  });

  test('Public system status page is accessible', async ({ page }) => {
    // Clear admin session
    await page.context().clearCookies();
    
    // Go to public system status page (should be accessible without login)
    await page.goto('/system-status');
    
    // Check if the page loads with system information
    await expect(page.getByRole('heading', { name: /system status/i })).toBeVisible();
    
    // Ensure there are status indicators for core components
    await expect(page.getByText(/all systems operational/i)).toBeVisible();
    
    // Check if scheduled maintenance information is displayed (if any)
    const hasMaintenance = await page.getByText(/scheduled maintenance/i).count() > 0;
    if (hasMaintenance) {
      await expect(page.getByText(/scheduled maintenance/i)).toBeVisible();
    }
  });

  test('System performance metrics are displayed', async ({ page }) => {
    // Navigate to monitoring page performance section
    await page.goto('/admin/monitoring/performance');
    
    // Check if performance metrics are displayed
    await expect(page.getByText(/response time/i)).toBeVisible();
    await expect(page.getByText(/database queries/i)).toBeVisible();
    await expect(page.getByText(/api calls/i)).toBeVisible();
    
    // Check if charts are displayed
    // Note: This is a simplified test that just checks for chart elements
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
