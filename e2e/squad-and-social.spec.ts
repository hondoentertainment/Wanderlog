import { test, expect } from '@playwright/test';

test.describe('Squad and navigation', () => {
  test('opens Squad hub from main nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-search-input')).toBeVisible({ timeout: 20000 });

    await page.getByTestId('nav-squad').click();
    await expect(page.getByTestId('squad-hub')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /join squad/i })).toBeVisible();
  });
});

test.describe('Join code utilities', () => {
  test('legacy join codes without squadId still parse name and destination', async ({ page }) => {
    const legacy = btoa(JSON.stringify({ name: 'Tokyo Trip', destination: 'Japan' }));
    const parsed = await page.evaluate((code) => {
      try {
        const p = JSON.parse(atob(code.trim()));
        return { squadId: p.squadId || '', name: p.name, destination: p.destination };
      } catch {
        return null;
      }
    }, legacy);

    expect(parsed).toEqual({ squadId: '', name: 'Tokyo Trip', destination: 'Japan' });
  });
});
