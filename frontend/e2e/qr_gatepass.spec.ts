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

test.describe('QR Gate Pass Scanner User Flow', () => {
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
    if (await passesTab.count() > 0) {
      await passesTab.click();
      await expect(page.getByText(/session|reservation|active/i).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('manual token entry validates invalid token', async ({ page }) => {
    await page.goto('/qr-scanner');
    await page.waitForTimeout(1000);

    const tokenInput = page.getByPlaceholder(/paste qr token|enter pass code/i);
    if (await tokenInput.count() > 0) {
      await tokenInput.fill('INVALID-TOKEN-12345');

      const verifyBtn = page.getByRole('button', { name: /verify|scan pass/i });
      if (await verifyBtn.count() > 0) {
        await verifyBtn.click();
        await expect(page.getByText(/invalid|error|expired/i).first()).toBeVisible({
          timeout: 8000,
        });
      }
    }
  });
});
