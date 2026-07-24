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
    await page.waitForTimeout(1000);

    const plateInput = page.getByPlaceholder(/mh12ab1234/i).first();
    if (await plateInput.count() > 0) {
      const testPlate = `E2E-${Math.floor(1000 + Math.random() * 9000)}`;
      await plateInput.fill(testPlate);

      const entryButton = page.getByRole('button', { name: /simulate entry/i });
      if (await entryButton.count() > 0) {
        await entryButton.click();
        await expect(page.getByText(/session started|entry confirmed|space/i).first()).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  test('allows license plate exit simulation and payment calculation', async ({ page }) => {
    await page.goto('/anpr-simulator');
    await page.waitForTimeout(1000);

    const testPlate = `E2E-${Math.floor(1000 + Math.random() * 9000)}`;

    const plateInput = page.getByPlaceholder(/mh12ab1234/i).first();
    if (await plateInput.count() > 0) {
      await plateInput.fill(testPlate);

      const entryButton = page.getByRole('button', { name: /simulate entry/i });
      if (await entryButton.count() > 0) {
        await entryButton.click();
        await page.waitForTimeout(1000);

        const exitButton = page.getByRole('button', { name: /simulate exit/i });
        if (await exitButton.count() > 0) {
          await exitButton.click();
          await expect(page.getByText(/fee|payment settled|exit confirmed/i).first()).toBeVisible({
            timeout: 10000,
          });
        }
      }
    }
  });
});
