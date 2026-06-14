import { test, expect } from '@playwright/test';

test.describe('Wanderlog E2E Flows', () => {
    test('Unauthenticated user sees main shell and omnibox', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByText('Travel Muse', { exact: true })).toBeVisible({ timeout: 20000 });
        await expect(page.getByRole('button', { name: /join wanderlog/i })).toBeVisible();
        await expect(page.locator('#main-search-input')).toBeVisible();
    });

    test('App recovers after brief offline / online cycle', async ({ page, context }) => {
        await page.goto('/');
        await expect(page.locator('#main-search-input')).toBeVisible({ timeout: 20000 });

        await context.setOffline(true);
        await page.waitForTimeout(500);

        await context.setOffline(false);
        await page.reload();
        await expect(page.locator('#main-search-input')).toBeVisible({ timeout: 20000 });
    });
});
