import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LocationSecurityPage } from '../pages/LocationSecurityPage';
import { getTranslations } from '../data/localization';

// E2E test: ทดสอบ flow login ของ Superadmin
// Login Screen -> Location/Security Screen -> Register Landing Page
test('Superadmin completes login + context selection', async ({ page }) => {
  test.setTimeout(60000);
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
  await locationSecurityPage.selectContext();

  // ตรวจสอบว่ามาถึงหน้า Register Landing Page แล้ว
  // เช็คภาษาตาม APP_LANG: en -> 'Patients' / '+ Add New', th -> 'ผู้ป่วย' / 'เพิ่มผู้ป่วยใหม่'
  const t = getTranslations();
  // SPA ใช้เวลา navigate + render หลังกด Continue เกิน default 5s ของ expect ยืด timeout เป็น 7s
  await expect(
    page.getByRole('button', { name: t.addNewPatientBtn }),
  ).toBeVisible({ timeout: 7000 });
});
