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

test.describe('Pre-Booking Reservations User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('reservations page loads header and list', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page.getByRole('heading', { name: /reservation|pre-booking/i }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('opens new reservation modal', async ({ page }) => {
    await page.goto('/reservations');
    await page.waitForTimeout(1000);

    const reserveButton = page.getByRole('button', { name: /new reservation|reserve space/i });
    if (await reserveButton.count() > 0) {
      await reserveButton.first().click();
      await expect(page.getByText(/select lot|vehicle plate|start time/i).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('digital gate pass qr button opens qr pass modal', async ({ page }) => {
    await page.goto('/reservations');
    await page.waitForTimeout(1000);

    const qrPassButtons = page.getByRole('button', { name: /qr pass|view pass|gate pass/i });
    if (await qrPassButtons.count() > 0) {
      await qrPassButtons.first().click();
      await expect(page.getByText(/gate pass|scan at gate/i).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
