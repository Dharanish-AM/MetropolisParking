import { test, expect, type Page } from '@playwright/test';
import { apiLogin, createLot, createLevel, createSpace, createReservation } from './helpers/api';

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
  test.beforeAll(async ({ request }) => {
    const token = await apiLogin(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    const lot = await createLot(request, token, 'Reservations E2E Lot', 'Test Zone');
    const level = await createLevel(request, token, lot.id, 1);
    const space = await createSpace(request, token, lot.id, level.id, 'RES-E2E-01');
    await createReservation(request, token, space.id);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('reservations page loads header and list', async ({ page }) => {
    await page.goto('/reservations');
    await expect(
      page.getByRole('heading', { name: /reservation|pre-booking/i }).first()
    ).toBeVisible({
      timeout: 8000,
    });
  });

  test('opens new reservation modal', async ({ page }) => {
    await page.goto('/reservations');

    const reserveButton = page.getByRole('button', { name: /new reservation|reserve space/i });
    await expect(reserveButton.first()).toBeVisible({ timeout: 8000 });
    await reserveButton.first().click();
    await expect(page.getByText(/select lot|vehicle plate|start time/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('digital gate pass qr button opens qr pass modal', async ({ page }) => {
    await page.goto('/reservations');

    const qrPassButton = page
      .getByRole('button', { name: /qr pass|view pass|gate pass/i })
      .first();
    await expect(qrPassButton).toBeVisible({ timeout: 10000 });
    await qrPassButton.click();
    await expect(page.getByText(/gate pass|scan at gate/i).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
