import { test, expect, type Page } from '@playwright/test';
import { apiLogin, createLot, createLevel, createSpace, startSession } from './helpers/api';

const ADMIN_EMAIL = 'admin@metropolisparking.com';
const ADMIN_PASSWORD = 'admin123';

let lotName: string;
const EXIT_PLATE = `ANPR${Date.now().toString().slice(-6)}`;

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('name@company.com').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('ANPR / LPR Simulator User Flow', () => {
  test.beforeAll(async ({ request }) => {
    const token = await apiLogin(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    lotName = `ANPR E2E Lot ${Date.now()}`;
    const lot = await createLot(request, token, lotName, 'ANPR Zone');
    const level = await createLevel(request, token, lot.id, 1);
    await createSpace(request, token, lot.id, level.id, 'ANPR-ENTRY-01');
    const space2 = await createSpace(request, token, lot.id, level.id, 'ANPR-EXIT-01');
    await startSession(request, token, EXIT_PLATE, space2.id);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('anpr simulator page loads correctly', async ({ page }) => {
    await page.goto('/anpr-simulator');
    await expect(page.getByRole('heading', { name: /anpr|ocr|plate/i }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('allows license plate entry simulation', async ({ page }) => {
    await page.goto('/anpr-simulator');

    const lotSelect = page.getByTestId('lot-select');
    await expect(lotSelect).toBeVisible({ timeout: 8000 });
    await page.waitForFunction(
      el => (el as HTMLSelectElement).options.length > 1,
      await lotSelect.elementHandle()
    );
    await lotSelect.selectOption({ label: lotName });

    const plateInput = page.getByPlaceholder(/mh-12-ab-1234/i).first();
    await expect(plateInput).toBeVisible({ timeout: 5000 });

    const testPlate = `MH12ENT${Date.now().toString().slice(-4)}`;
    await plateInput.fill(testPlate);

    const entryButton = page.getByRole('button', { name: /simulate entry/i });
    await expect(entryButton).toBeVisible({ timeout: 5000 });
    await entryButton.click();

    await expect(page.getByText('Entry Gate Opened')).toBeVisible({ timeout: 10000 });
  });

  test('allows license plate exit simulation and payment calculation', async ({ page }) => {
    await page.goto('/anpr-simulator');

    const lotSelect = page.getByTestId('lot-select');
    await expect(lotSelect).toBeVisible({ timeout: 8000 });
    await page.waitForFunction(
      el => (el as HTMLSelectElement).options.length > 1,
      await lotSelect.elementHandle()
    );
    await lotSelect.selectOption({ label: lotName });

    const plateInput = page.getByPlaceholder(/mh-12-ab-1234/i).first();
    await expect(plateInput).toBeVisible({ timeout: 5000 });
    await plateInput.fill(EXIT_PLATE);

    const exitButton = page.getByRole('button', { name: /simulate exit/i });
    await expect(exitButton).toBeVisible({ timeout: 5000 });
    await exitButton.click();

    await expect(page.getByText(/exit gate|bill|settled|fee/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
