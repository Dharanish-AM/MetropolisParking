import { test, expect, type Page } from '@playwright/test';
import {
  apiLogin,
  createLot,
  createLevel,
  createSpace,
  startSession,
  endSession,
} from './helpers/api';

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
  test.beforeAll(async ({ request }) => {
    // Create a completed parking session so the payments page has a PENDING payment to settle
    const token = await apiLogin(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    const lot = await createLot(request, token, 'Payment E2E Lot', 'Finance Zone');
    const level = await createLevel(request, token, lot.id, 1);
    const space = await createSpace(request, token, lot.id, level.id, 'PAY-E2E-01');
    const plate = `PAYE2E${Date.now().toString().slice(-4)}`;
    await startSession(request, token, plate, space.id);
    await endSession(request, token, plate);
  });

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

    // The PENDING payment created in beforeAll guarantees a settle button is present
    const settleButton = page.getByRole('button', { name: /settle/i }).first();
    await expect(settleButton).toBeVisible({ timeout: 10000 });
    await settleButton.click();

    await expect(page.getByText(/payment method|pay now|process/i).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
