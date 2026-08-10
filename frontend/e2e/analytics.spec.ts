import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@metropolisparking.com';
const ADMIN_PASSWORD = 'admin123';
const CUSTOMER_EMAIL = 'customer@metropolisparking.com';
const CUSTOMER_PASSWORD = 'customer123';

async function login(page: Page, email: string, pass: string) {
  await page.goto('/login');
  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(pass);
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Analytics & Revenue Reporting User Flow', () => {
  test('ADMIN can navigate to analytics dashboard and view metrics', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: /analytics|revenue|occupancy/i }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('CUSTOMER is blocked from visiting analytics page', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto('/analytics');
    await expect(page).not.toHaveURL('/analytics', { timeout: 8000 });
  });
});
