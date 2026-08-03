import { test, expect } from '@playwright/test';

test.describe('Error States & Resiliency User Flow', () => {
  test('unauthorized route access redirects to login or unauthorized page', async ({ page }) => {
    await page.goto('/sessions');
    await expect(page).toHaveURL(/\/login|\/unauthorized/, { timeout: 10000 });
  });

  test('invalid login credentials display clear error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('name@company.com').fill('nonexistent@metropolisparking.com');
    await page.getByPlaceholder('••••••••').fill('invalidpass123');
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText(/invalid|failed|unauthorized|error/i).first()).toBeVisible({
      timeout: 8000,
    });
  });
});
