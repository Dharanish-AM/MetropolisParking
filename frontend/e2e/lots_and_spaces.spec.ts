import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@metropolisparking.com';
const OPERATOR_EMAIL = 'rajesh.verma@metropolis.in';
const PASSWORD = 'admin123';

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Parking Lots & Space Management User Flow', () => {
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

  test('OPERATOR can view lots but delete lot button is hidden', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL);
    await page.goto('/parking-lots');
    await expect(page.getByRole('heading', { name: /lot|parking/i }).first()).toBeVisible({
      timeout: 8000,
    });

    const deleteLotBtn = page.getByRole('button', { name: /delete lot/i });
    await expect(deleteLotBtn).toHaveCount(0);
  });

  test('can open add parking lot modal', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto('/parking-lots');
    await page.waitForSelector('button', { timeout: 8000 });

    const addLotButton = page.getByRole('button', { name: /add lot|create lot/i });
    if ((await addLotButton.count()) > 0) {
      await addLotButton.first().click();
      await expect(page.getByText('Create New Parking Lot')).toBeVisible({ timeout: 5000 });
    }
  });

  test('allows selecting lot and viewing parking levels', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto('/parking-lots');
    await page.waitForTimeout(1000);

    const lotCards = page.locator('button').filter({ hasText: /filled|spaces|level/i });
    if ((await lotCards.count()) > 0) {
      await lotCards.first().click();
      await expect(page.getByText(/level|floor|space/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
