import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@metropolisparking.com';
const ADMIN_PASSWORD = 'admin123';
const CUSTOMER_EMAIL = 'customer@metropolisparking.com';
const CUSTOMER_PASSWORD = 'customer123';

test.describe('Role-Based Access Control (RBAC) Verification', () => {
  test('ADMIN has access to all navigation links and administrative routes', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('name@company.com').fill(ADMIN_EMAIL);
    await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    const adminRoutes = [
      '/',
      '/parking-lots',
      '/sessions',
      '/anpr-simulator',
      '/qr-scanner',
      '/reservations',
      '/payments',
      '/vehicles',
      '/profile',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      await expect(page).not.toHaveURL('/unauthorized');
      await expect(page).not.toHaveURL('/login');
    }
  });

  test('CUSTOMER has access only to customer routes and is blocked from management routes', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByPlaceholder('name@company.com').fill(CUSTOMER_EMAIL);
    await page.getByPlaceholder('••••••••').fill(CUSTOMER_PASSWORD);
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    const allowedRoutes = ['/', '/vehicles', '/reservations', '/qr-scanner', '/profile'];
    for (const route of allowedRoutes) {
      await page.goto(route);
      await expect(page).not.toHaveURL('/unauthorized');
      await expect(page).not.toHaveURL('/login');
    }

    const restrictedRoutes = ['/parking-lots', '/sessions', '/payments', '/anpr-simulator'];
    for (const route of restrictedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/unauthorized');
      await expect(page.getByText(/403 - Access Denied/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
