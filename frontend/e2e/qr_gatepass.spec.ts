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

test.describe('QR Gate Pass Scanner User Flow', () => {
  test.beforeAll(async ({ request }) => {
    // Create a confirmed reservation for the admin user so the "My Passes" tab has data
    const token = await apiLogin(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    const lot = await createLot(request, token, 'QR E2E Lot', 'Gate Zone');
    const level = await createLevel(request, token, lot.id, 1);
    const space = await createSpace(request, token, lot.id, level.id, 'QR-E2E-01');
    await createReservation(request, token, space.id);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('qr scanner page loads correctly', async ({ page }) => {
    await page.goto('/qr-scanner');
    await expect(page.getByRole('heading', { name: /qr|gate pass|scanner/i }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('qr passes tab displays active digital passes', async ({ page }) => {
    await page.goto('/qr-scanner');

    const passesTab = page.getByRole('button', { name: /my passes|digital passes/i });
    await expect(passesTab).toBeVisible({ timeout: 5000 });
    await passesTab.click();

    // The reservation created in beforeAll appears as a CONFIRMED pass
    await expect(page.getByText(/reservation|session|active/i).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('manual token entry validates invalid token', async ({ page }) => {
    await page.goto('/qr-scanner');

    const tokenInput = page.getByPlaceholder(/paste qr token|enter pass code/i);
    await expect(tokenInput).toBeVisible({ timeout: 8000 });
    await tokenInput.fill('INVALID-TOKEN-12345');

    const verifyBtn = page.getByRole('button', { name: /verify|scan pass/i });
    await expect(verifyBtn).toBeVisible({ timeout: 5000 });
    await verifyBtn.click();

    await expect(page.getByText(/invalid|error|expired/i).first()).toBeVisible({
      timeout: 8000,
    });
  });
});
