import { test, expect } from '@playwright/test';

test.describe('Companion filter on World view', () => {
  test('filters memories by companion type', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-search-input')).toBeVisible({ timeout: 20000 });

    await expect(page.getByTestId('memories-count')).toContainText('2 Memories');

    await page.getByTestId('companion-filter-family').click();
    await expect(page.getByTestId('memories-count')).toContainText('1 Memories');
    await expect(page.getByTestId('memories-count')).toContainText('family');

    await page.getByTestId('companion-filter-solo').click();
    await expect(page.getByTestId('memories-count')).toContainText('1 Memories');

    await page.getByTestId('companion-filter-solo').click();
    await expect(page.getByTestId('memories-count')).toContainText('2 Memories');
  });
});
