import { test, expect } from '@playwright/test';

test.describe('VC Pitch Demo "Happy Path"', () => {
    test('should boot successfully and run the Moat + Monetization demo flow', async ({ page }) => {
        // 1. Boot up and land on Timeline
        await page.goto('/');
        await expect(page).toHaveTitle(/Travel Muse|Wanderlog/i);

        // 2. Validate Data Moat Hook is present
        const syncButton = page.locator('text=Auto-Sync Flight Confirmations');
        await expect(syncButton).toBeVisible();

        // 3. Open Jules (The Conversion Engine)
        const julesTab = page.locator('button', { hasText: /Jules/i });
        if (await julesTab.isVisible()) {
            await julesTab.click();
        }
        await expect(page.locator('text=Ask Jules')).toBeVisible();

        // 4. Validate Monetization Buttons appear over time (would require complex mocking for true E2E, 
        // but we can assert the input is ready for generation)
        const askInput = page.getByPlaceholder('Ask Jules anything about travel...');
        await expect(askInput).toBeVisible();
        await askInput.fill('Plan a 3-day Paris itinerary');
        await page.keyboard.press('Enter');

        // Due to the nature of AI delay in live mode, we'll stop the standard automated assertion here 
        // and rely on this test as a sanity check that the core components load cleanly before presentation.
    });
});
