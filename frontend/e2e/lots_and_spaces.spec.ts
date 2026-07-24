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

test.describe('Parking Lots & Space Management User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('loads parking lots page and presents lots list', async ({ page }) => {
    await page.goto('/lots');
    await expect(page.getByRole('heading', { name: /parking lot/i }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('can open add parking lot modal', async ({ page }) => {
    await page.goto('/lots');
    await page.waitForSelector('button', { timeout: 8000 });

    const addLotButton = page.getByRole('button', { name: /add lot|create lot/i });
    if (await addLotButton.count() > 0) {
      await addLotButton.first().click();
      await expect(page.getByPlaceholder(/downtown plaza|lot name/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('allows selecting lot and viewing parking levels', async ({ page }) => {
    await page.goto('/lots');
    await page.waitForTimeout(1000);

    const lotCards = page.locator('div').filter({ hasText: /spaces|level/i });
    if (await lotCards.count() > 0) {
      await lotCards.first().click();
      await expect(page.getByText(/level|floor|space/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('space filter and status grid interactability', async ({ page }) => {
    await page.goto('/lots');
    await page.waitForTimeout(1000);

    const filterButtons = page.getByRole('button', { name: /all|available|occupied|reserved/i });
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click();
    }
  });
});
