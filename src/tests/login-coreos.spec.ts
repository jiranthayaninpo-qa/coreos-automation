import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LocationSecurityPage } from '../pages/LocationSecurityPage';

// E2E test: ทดสอบ flow login ของ Superadmin ครบทุกขั้นตอน
// Login Screen -> Location/Security Screen -> Dashboard
test('Superadmin completes login + context selection', async ({ page }) => {
  // สร้าง Page Object สำหรับหน้าจอที่จะใช้ในเทสนี้
  const loginPage = new LoginPage(page);
  const locationSecurityPage = new LocationSecurityPage(page);

  // เปิดหน้า Login ที่ BASE_URL ที่ตั้งไว้ใน .env
  await loginPage.goto();

  // กรอก username / password ของ Superadmin (จาก .env) แล้วกดปุ่ม Login
  await loginPage.login(
    (globalThis as any).process?.env?.SUPERADMIN_USER!,
    (globalThis as any).process?.env?.SUPERADMIN_PASS!,
  );

  // หลัง login สำเร็จ จะมาที่หน้าจอที่ 2 — เลือก Location และ Security Group แล้วกด Continue
  // ไม่ส่ง argument เพื่อให้ POM ใช้ default ตาม APP_LANG (en -> '1001 | MED', th -> '1001 | อายุรกรรม')
  await locationSecurityPage.selectContext();

  // ตรวจสอบว่ามาถึงหน้า Register Landing Page แล้ว: เช็คว่ามีข้อความ 'Patients' หรือปุ่ม '+ Add New' โผล่ขึ้นมา
  await expect(
    page.getByText('Patients').or(page.getByRole('button', { name: '+ Add New' })),
  ).toBeVisible();
});
