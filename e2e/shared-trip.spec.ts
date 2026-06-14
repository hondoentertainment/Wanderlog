import { test, expect } from '@playwright/test';

test.describe('Shared trip deep link', () => {
  test('loads SPA shell for /shared/:tripId routes', async ({ page }) => {
    await page.goto('/shared/e2e-test-trip-id');

    await expect(page.getByRole('heading', { name: 'Trip Not Found' })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('button', { name: /return home/i })).toBeVisible();
  });
});
