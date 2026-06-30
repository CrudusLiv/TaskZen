import { test, expect } from '@playwright/test';

test('focus session: start a focus sprint and see the timer appear', async ({ page }) => {
  await page.goto('/focus');

  // Wait for the focus page to load — the picker is shown when no session is active
  const picker = page.locator('.picker');
  await expect(picker).toBeVisible();

  // Verify the "Choose Focus Sprint" heading is present
  await expect(page.getByRole('heading', { name: 'Choose Focus Sprint' })).toBeVisible();

  // Click the Start button to begin a session
  await page.getByRole('button', { name: 'Start' }).click();

  // After starting, the session panel (with the timer ring) should appear
  const session = page.locator('.session');
  await expect(session).toBeVisible({ timeout: 5000 });

  // The Pause button is present for a running session
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
});
