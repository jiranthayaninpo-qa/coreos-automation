import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LocationSecurityPage } from '../pages/LocationSecurityPage';
import { SecurityGroupPage } from '../pages/SecurityGroupPage';
import { getTranslations } from '../data/localization';

// E2E test: seed Security Group ที่จำเป็นต่อ flow สร้าง test users
// Login -> Location/Security -> Sidebar Setup -> User management -> Security Group -> + Create -> กรอก -> Create
test('Seed Security Group via Setup > User management', async ({ page }) => {
  // ติ๊ก permission ครบทุกหมวด (~156 checkbox) ใช้เวลานานกว่าปกติ — เพิ่ม timeout เป็น 3 นาที
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const locationSecurityPage = new LocationSecurityPage(page);
  const securityGroupPage = new SecurityGroupPage(page);

  // ดึง dictionary ตามภาษาที่ตั้งไว้ใน APP_LANG เพื่อเลือกค่าที่จะใช้กรอก / assert
  const t = getTranslations();

  // ภาษาไทย / อังกฤษ ใช้คำใน UI ต่างกัน — เลือก default per-language ของ Homepage และ description
  // Homepage default ต้องตรงกับ option จริงใน dropdown (ตรวจ verify จากการ run จริง)
  const isThai = (process.env.APP_LANG || 'en').toLowerCase() === 'th';
  // ใช้ timestamp suffix เพื่อกันชนเมื่อ test รันซ้ำในวันเดียว (ระบบไม่ยอมให้ชื่อซ้ำ)
  const groupName = process.env.SEED_SG_NAME || `QA Seed Group ${Date.now()}`;
  const homepage = process.env.SEED_SG_HOMEPAGE || (isThai ? 'ค้นหาผู้ป่วย' : 'Search Patient');
  const description =
    process.env.SEED_SG_DESC || (isThai ? 'กลุ่มสำหรับทดสอบ' : 'Group for QA seeding');
  // permission categories: ถ้าตั้ง SEED_SG_PERMISSIONS=ALL จะติ๊กทุกหมวดอัตโนมัติ
  //   ไม่ใส่ -> default = ALL (ติ๊กทุกหมวด ทุก permission)
  //   ใส่ comma-separated list -> ติ๊กเฉพาะหมวดที่ระบุ (เช่น 'Alert,Appointment,EMR')
  const permissionsEnv = (process.env.SEED_SG_PERMISSIONS || 'ALL').trim();
  const selectAll = permissionsEnv.toUpperCase() === 'ALL';
  const permissions = selectAll
    ? []
    : permissionsEnv.split(',').map((s) => s.trim()).filter(Boolean);

  // 1) Login ด้วย Superadmin จาก .env
  await loginPage.goto();
  await loginPage.login(
    process.env.SUPERADMIN_USER!,
    process.env.SUPERADMIN_PASS!,
  );

  // 2) เลือก Location / Security Group default ตามภาษา แล้วกด Continue
  await locationSecurityPage.selectContext();

  // 3) ยืนยันว่ามาถึงหน้า Register Landing แล้ว (sidebar render พร้อมใช้งาน)
  await expect(
    page.getByRole('button', { name: t.addNewPatientBtn }),
  ).toBeVisible({ timeout: 15000 });

  // 4) เข้า flow Setup -> User management -> Security Group
  await securityGroupPage.MapsToSecurityGroup();

  // 5) เปิด drawer สร้าง group ใหม่
  await securityGroupPage.clickCreateNewGroup();

  // 6) กรอกฟอร์ม + เลือก permission categories ที่ต้องการ
  await securityGroupPage.fillGroupDetails(groupName, homepage, description);
  if (selectAll) {
    await securityGroupPage.selectAllPermissions();
  } else {
    await securityGroupPage.selectPermissions(permissions);
  }

  // 7) Submit สร้าง group
  await securityGroupPage.clickSubmit();

  // 8) Verify ว่า group ใหม่โผล่ใน list — ใช้ชื่อที่เพิ่งสร้างเป็น smoke check
  await expect(page.getByText(groupName, { exact: true })).toBeVisible({
    timeout: 15000,
  });
});
