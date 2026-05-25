import { test, expect } from '@playwright/test';

test('Superadmin can log in to CoreOS', async ({ page }) => {
  await page.goto(process.env.BASE_URL!);

  await page.getByLabel('Username').fill(process.env.SUPERADMIN_USER!);
  await page.getByLabel('Password').fill(process.env.SUPERADMIN_PASS!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/dashboard|home/i);
});
