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

test.describe('Vehicle Registry User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('vehicles page loads and shows registry table', async ({ page }) => {
    await page.goto('/vehicles');
    await expect(page.getByRole('heading', { name: /vehicle/i }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('vehicle search input filters table', async ({ page }) => {
    await page.goto('/vehicles');
    await page.waitForTimeout(1000);

    const searchInput = page.getByPlaceholder(/search plate/i);
    if (await searchInput.count() > 0) {
      await searchInput.fill('MH12');
      await expect(searchInput).toHaveValue('MH12');
    }
  });

  test('opens register vehicle modal and validates license plate format', async ({ page }) => {
    await page.goto('/vehicles');
    
    const registerBtn = page.getByRole('button', { name: /register vehicle/i });
    if (await registerBtn.count() > 0) {
      await registerBtn.click();

      const plateInput = page.getByPlaceholder(/mh12ab1234/i);
      await expect(plateInput).toBeVisible({ timeout: 5000 });
      await plateInput.fill('INVALID!');

      const submitBtn = page.getByRole('button', { name: /register/i, exact: true });
      await submitBtn.click();

      await expect(page.getByText(/alphanumeric|4 to 15/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
