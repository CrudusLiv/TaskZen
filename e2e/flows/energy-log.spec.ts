import { test, expect } from '@playwright/test';

test('energy log: select energy level 3 and add a log entry', async ({ page }) => {
  await page.goto('/energy');

  // Wait for the energy tracking section to be visible
  await expect(page.getByRole('region', { name: 'Energy tracking' })).toBeVisible();

  // Select energy level 3 using the radio button aria-label
  const level3 = page.getByRole('radio', { name: 'Energy level 3' });
  await expect(level3).toBeVisible();
  await level3.click();

  // Confirm it is now checked
  await expect(level3).toHaveAttribute('aria-checked', 'true');

  // Click the Add button to log the entry
  await page.getByRole('button', { name: 'Add' }).click();

  // A log entry with level badge 3 should now appear in the logs section
  await expect(page.locator('.badge').filter({ hasText: '3' })).toBeVisible();
});
