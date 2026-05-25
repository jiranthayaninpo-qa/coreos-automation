import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LocationSecurityPage } from '../pages/LocationSecurityPage';

test('Superadmin completes login + context selection and lands on dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const locationSecurityPage = new LocationSecurityPage(page);

  await loginPage.goto();
  await loginPage.login(
    (globalThis as any).process?.env?.SUPERADMIN_USER!,
    (globalThis as any).process?.env?.SUPERADMIN_PASS!,
  );

  await locationSecurityPage.selectContext('1001 | MED', 'Super Admin');

  await expect(
    page.getByText('Patients').or(page.getByRole('button', { name: '+ Add New' })),
  ).toBeVisible();
});
