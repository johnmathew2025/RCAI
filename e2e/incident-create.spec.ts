import { test, expect } from '@playwright/test';

test('create flow is blank across new tab / refresh', async ({ page, context }) => {
  // Navigate to incident reporting page
  await page.goto('/incident-reporting');
  
  // Assert all main fields are blank
  await expect(page.locator('[data-testid="input-incidentDetails"]')).toHaveValue('');
  await expect(page.locator('[data-testid="textarea-initialObservations"]')).toHaveValue('');
  
  // Open new tab to same page
  const page2 = await context.newPage();
  await page2.goto('/incident-reporting');
  
  // Assert new tab also has blank fields
  await expect(page2.locator('[data-testid="input-incidentDetails"]')).toHaveValue('');
  await expect(page2.locator('[data-testid="textarea-initialObservations"]')).toHaveValue('');
  
  // Test back/forward navigation doesn't restore values
  await page2.goBack();
  await page2.goForward();
  
  // Assert fields remain blank after navigation
  await expect(page2.locator('[data-testid="input-incidentDetails"]')).toHaveValue('');
  await expect(page2.locator('[data-testid="textarea-initialObservations"]')).toHaveValue('');
  
  // Test page refresh
  await page2.reload();
  
  // Assert fields remain blank after refresh
  await expect(page2.locator('[data-testid="input-incidentDetails"]')).toHaveValue('');
  await expect(page2.locator('[data-testid="textarea-initialObservations"]')).toHaveValue('');
  
  // Close the second page
  await page2.close();
});