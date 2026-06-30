import { test, expect } from '@playwright/test';

test('capture item: type a task title and see it appear in the list', async ({ page }) => {
  await page.goto('/');

  // The capture form is on the root route
  const input = page.getByPlaceholder('Capture a thought or task (#tag !3 ~15)');
  await expect(input).toBeVisible();

  const title = `E2E task ${Date.now()}`;
  await input.fill(title);

  // Submit via the Add button
  await page.getByRole('button', { name: 'Add' }).click();

  // Navigate to the items list to confirm the item was captured
  await page.getByRole('link', { name: 'Items' }).click();
  await expect(page).toHaveURL(/\/items/);

  // The item title appears as a button in the list (role="button" with aria-label "Edit title: <title>")
  await expect(page.getByRole('button', { name: `Edit title: ${title}` })).toBeVisible();
});
