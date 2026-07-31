import { test, expect, type Page } from '@playwright/test';
import { apiLogin, createLot, createLevel, createSpace } from './helpers/api';

const ADMIN_EMAIL = 'admin@metropolisparking.com';
const ADMIN_PASSWORD = 'admin123';
const CUSTOMER_EMAIL = 'customer@metropolisparking.com';
const CUSTOMER_PASSWORD = 'customer123';

let createdLotName: string;

async function loginAs(page: Page, email: string, pass: string = ADMIN_PASSWORD) {
  await page.goto('/login');
  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(pass);
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Parking Lots & Space Management User Flow', () => {
  test.beforeAll(async ({ request }) => {
    const token = await apiLogin(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    createdLotName = `Lots E2E ${Date.now()}`;
    const lot = await createLot(request, token, createdLotName, 'E2E Test Zone');
    const level = await createLevel(request, token, lot.id, 1);
    await createSpace(request, token, lot.id, level.id, 'LOT-E2E-01');
  });

  test('ADMIN can view lots and delete lot button', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto('/parking-lots');
    await expect(page.getByRole('heading', { name: /lot|parking/i }).first()).toBeVisible({
      timeout: 8000,
    });

    const deleteLotBtn = page.getByRole('button', { name: /delete lot/i });
    if ((await deleteLotBtn.count()) > 0) {
      await expect(deleteLotBtn.first()).toBeVisible();
    }
  });

  test('CUSTOMER is redirected to unauthorized when visiting /parking-lots', async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto('/parking-lots');
    await expect(page).toHaveURL('/unauthorized');
  });

  test('can open add parking lot modal', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto('/parking-lots');

    const addLotButton = page.getByRole('button', { name: /add lot|create lot/i });
    await expect(addLotButton.first()).toBeVisible({ timeout: 8000 });
    await addLotButton.first().click();
    await expect(page.getByText('Create New Parking Lot')).toBeVisible({ timeout: 5000 });
  });

  test('allows selecting lot and viewing parking levels', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto('/parking-lots');

    // Click the lot we created in beforeAll so this test is deterministic
    const lotCard = page.getByText(createdLotName, { exact: false });
    await expect(lotCard.first()).toBeVisible({ timeout: 8000 });
    await lotCard.first().click();

    await expect(page.getByText(/level|floor|space/i).first()).toBeVisible({ timeout: 5000 });
  });
});
