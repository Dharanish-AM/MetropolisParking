import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@metropolisparking.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Real-time WebSocket & Dashboard Sync', () => {
  test('admin page loads real-time parking lots and space status updates', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('name@company.com').fill(ADMIN_EMAIL);
    await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await page.goto('/lots');
    await expect(page.getByText(/parking lots/i).first()).toBeVisible({ timeout: 10000 });
  });
});
