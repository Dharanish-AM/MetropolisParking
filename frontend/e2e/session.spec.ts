import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@metropolisparking.com';
const ADMIN_PASSWORD = 'admin123';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('name@company.com').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Sessions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('sessions page loads and shows header', async ({ page }) => {
    await page.goto('/sessions');
    await expect(page.getByRole('heading', { name: /session/i }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('sessions page shows filter tabs', async ({ page }) => {
    await page.goto('/sessions');
    await expect(page.getByRole('button', { name: /all/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /active/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /completed/i })).toBeVisible();
  });

  test('can open start session modal', async ({ page }) => {
    await page.goto('/sessions');
    await page.getByRole('button', { name: 'Start Session' }).first().click();
    await expect(page.getByPlaceholder('e.g. MH12AB1234')).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error for invalid plate number', async ({ page }) => {
    await page.goto('/sessions');
    await page.getByRole('button', { name: 'Start Session' }).first().click();

    await page.getByPlaceholder('e.g. MH12AB1234').fill('AB');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(
      page.getByText(/plate number must be|alphanumeric|4 to 15/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
