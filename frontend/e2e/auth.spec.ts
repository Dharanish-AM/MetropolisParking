import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@metropolisparking.com';
const ADMIN_PASSWORD = 'admin123';
const CUSTOMER_EMAIL = 'customer@metropolisparking.com';
const CUSTOMER_PASSWORD = 'customer123';

test.describe('Authentication & Navigation User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page renders branding and login controls', async ({ page }) => {
    await expect(page.getByText('Welcome to Metropolis')).toBeVisible();
    await expect(page.getByPlaceholder('name@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  test('redirects admin to dashboard on valid credentials', async ({ page }) => {
    await page.getByPlaceholder('name@company.com').fill(ADMIN_EMAIL);
    await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test('redirects customer to dashboard on valid credentials', async ({ page }) => {
    await page.getByPlaceholder('name@company.com').fill(CUSTOMER_EMAIL);
    await page.getByPlaceholder('••••••••').fill(CUSTOMER_PASSWORD);
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByPlaceholder('name@company.com').fill('invalid@user.com');
    await page.getByPlaceholder('••••••••').fill('invalidpass');
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText(/invalid|failed|unauthorized/i)).toBeVisible({
      timeout: 8000,
    });
    await expect(page).toHaveURL('/login');
  });

  test('redirects unauthenticated users to login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('user profile navigation and logout flow', async ({ page }) => {
    await page.getByPlaceholder('name@company.com').fill(ADMIN_EMAIL);
    await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await page.goto('/profile');
    await expect(page.getByText(/admin@metropolisparking.com/i)).toBeVisible({ timeout: 8000 });

    const logoutButton = page.getByRole('button', { name: /log out|logout/i }).first();
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();
    await expect(page).toHaveURL('/login', { timeout: 8000 });
  });
});
