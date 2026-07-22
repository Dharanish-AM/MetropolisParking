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

test.describe('Payments', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('payments page loads and shows header', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.getByRole('heading', { name: /payment/i }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('payments page shows the ledger table', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.getByRole('table').first()).toBeVisible({ timeout: 8000 });
  });

  test('payments table contains expected columns', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForSelector('table', { timeout: 8000 });

    const headerText = await page.locator('thead').textContent();
    expect(headerText?.toLowerCase()).toContain('amount');
    expect(headerText?.toLowerCase()).toContain('status');
  });

  test('settle modal opens when settle button is clicked', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForSelector('table', { timeout: 8000 });

    const settleButtons = page.getByRole('button', { name: /settle/i });
    const settleCount = await settleButtons.count();

    if (settleCount > 0) {
      await settleButtons.first().click();
      await expect(page.getByText(/payment method|pay now|process/i).first()).toBeVisible({
        timeout: 5000,
      });
    } else {
      console.log('No pending payments to settle — skipping settle modal test.');
    }
  });
});
