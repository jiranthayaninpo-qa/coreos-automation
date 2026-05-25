import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LocationSecurityPage } from '../pages/LocationSecurityPage';
import { getTranslations } from '../data/localization';

// E2E test: ทดสอบ flow login ของ Superadmin ครบทุกขั้นตอน
// Login Screen -> Location/Security Screen -> Dashboard
test('Superadmin completes login + context selection', async ({ page }) => {
  // SPA โหลด React app + navigate หลาย step ใช้เวลามากกว่า default 30s ขยายเป็น 60s
  test.setTimeout(60000);

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

  // ตรวจสอบว่ามาถึงหน้า Register Landing Page แล้ว
  // เช็คภาษาตาม APP_LANG: en -> 'Patients' / '+ Add New', th -> 'ผู้ป่วย' / 'เพิ่มผู้ป่วยใหม่'
  // ใช้ getByRole('heading') แทน getByText เพื่อให้ match เฉพาะ heading หลัก
  // (text 'ผู้ป่วย' โผล่ใน search placeholder ด้วย ทำให้ getByText จะ match หลายตัว)
  const t = getTranslations();
  // SPA ใช้เวลา navigate + render หลังกด Continue เกิน default 5s ของ expect ยืด timeout เป็น 15s
  // เช็คเฉพาะปุ่ม Add New Patient เพราะมี accessible name ที่ unique และตรง (ไม่ทับกับ text อื่นใน UI)
  await expect(
    page.getByRole('button', { name: t.addNewPatientBtn }),
  ).toBeVisible({ timeout: 15000 });
});
