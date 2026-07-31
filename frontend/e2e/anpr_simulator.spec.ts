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

test.describe('ANPR / LPR Simulator User Flow', () => {
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

    const lotSelect = page.locator('select').first();
    await expect(lotSelect).toBeVisible({ timeout: 8000 });
    await lotSelect.selectOption({ index: 1 });

    const plateInput = page.getByPlaceholder(/mh-12-ab-1234/i).first();
    await expect(plateInput).toBeVisible({ timeout: 5000 });

    const testPlate = `E2EENTR${Date.now().toString().slice(-4)}`;
    await plateInput.fill(testPlate);

    const entryButton = page.getByRole('button', { name: /simulate entry/i });
    await expect(entryButton).toBeVisible({ timeout: 5000 });
    await entryButton.click();

    await expect(page.getByText(/entry gate opened|parking space/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('allows license plate exit simulation and payment calculation', async ({ page }) => {
    await page.goto('/anpr-simulator');

    const lotSelect = page.locator('select').first();
    await expect(lotSelect).toBeVisible({ timeout: 8000 });
    await lotSelect.selectOption({ index: 1 });

    const plateInput = page.getByPlaceholder(/mh-12-ab-1234/i).first();
    await expect(plateInput).toBeVisible({ timeout: 5000 });

    const testPlate = `E2EEXITX${Date.now().toString().slice(-4)}`;
    await plateInput.fill(testPlate);

    const entryButton = page.getByRole('button', { name: /simulate entry/i });
    await expect(entryButton).toBeVisible({ timeout: 5000 });
    await entryButton.click();

    await expect(page.getByText(/entry gate opened|parking space/i).first()).toBeVisible({
      timeout: 10000,
    });

    const exitButton = page.getByRole('button', { name: /simulate exit/i });
    await expect(exitButton).toBeVisible({ timeout: 5000 });
    await exitButton.click();

    await expect(page.getByText(/exit gate bill|bill summary/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
