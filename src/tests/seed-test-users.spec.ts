import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { SecurityGroupPage } from '../pages/SecurityGroupPage';

// Test workflow สำหรับ seed ผู้ใช้ทดสอบเข้าระบบ
// flow: Login เป็น Superadmin -> สร้าง user ใหม่ -> กำหนดสิทธิ์ให้ role ของ user นั้น
test('Superadmin seeds a test user with role and permissions', async ({ page }) => {
  // สร้าง Page Object ของแต่ละหน้าจอที่จะใช้ในเทสนี้
  const loginPage = new LoginPage(page);
  const userManagementPage = new UserManagementPage(page);
  const securityGroupPage = new SecurityGroupPage(page);

  // เปิดหน้า Login แล้ว login ด้วยบัญชี Superadmin จาก .env
  await loginPage.goto();
  await loginPage.login(
    process.env.SUPERADMIN_USER!,
    process.env.SUPERADMIN_PASS!,
  );

  // เข้าหน้า User Management แล้วสร้างผู้ใช้ใหม่ชื่อ 'test.nurse01' role 'Nurse'
  await userManagementPage.navigateToUserManagement();   // คลิกเมนู User Management
  await userManagementPage.clickCreateNewUser();         // เปิดฟอร์มสร้าง user ใหม่
  await userManagementPage.fillUserDetails('test.nurse01', 'Nurse');   // กรอกข้อมูล + กด Save

  // เข้าหน้า Security Group แล้วกำหนดสิทธิ์ให้ role 'Nurse'
  // สิทธิ์ที่ให้: view_patient (ดูข้อมูลผู้ป่วย), edit_vitals (แก้ไขสัญญาณชีพ)
  await securityGroupPage.navigateToSecurityGroup();
  await securityGroupPage.assignPermissions('Nurse', [
    'view_patient',
    'edit_vitals',
  ]);
});
