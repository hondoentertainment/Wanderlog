import { test, expect } from '@playwright/test';

test.describe('App smoke', () => {
    test('loads shell, omnibox, and opens Jules via ? ask shortcut', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/Travel Muse/i);

        await expect(page.getByText('Travel Muse')).toBeVisible({ timeout: 20000 });

        await expect(page.locator('#main-search-input')).toBeVisible();
        await expect(page.locator('#main-search-input')).toHaveAttribute('placeholder', /Explore your journey/i);

        /** Anonymous or signed-in header */
        await expect(page.getByRole('button', { name: /Join Wanderlog/i }).or(page.getByRole('button', { name: /Logout/i }))).toBeVisible({
            timeout: 20000,
        });

        /** Omni "ask Jules" shortcut (see App.tsx handleOmniAsk — leading ?) */
        const omni = page.locator('#main-search-input');
        await omni.fill('?Plan a weekend in Lisbon');
        await omni.press('Enter');

        await expect(page.getByRole('heading', { name: 'Ask Jules' })).toBeVisible({ timeout: 20000 });
        await expect(page.getByPlaceholder('Ask Jules anything about travel...')).toBeVisible();
    });
});
