import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { SecurityGroupPage } from '../pages/SecurityGroupPage';

test('Superadmin seeds a test user with role and permissions', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const userManagementPage = new UserManagementPage(page);
  const securityGroupPage = new SecurityGroupPage(page);

  await loginPage.goto();
  await loginPage.login(
    process.env.SUPERADMIN_USER!,
    process.env.SUPERADMIN_PASS!,
  );

  await userManagementPage.navigateToUserManagement();
  await userManagementPage.clickCreateNewUser();
  await userManagementPage.fillUserDetails('test.nurse01', 'Nurse');

  await securityGroupPage.navigateToSecurityGroup();
  await securityGroupPage.assignPermissions('Nurse', [
    'view_patient',
    'edit_vitals',
  ]);
});
