import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LocationSecurityPage } from '../pages/LocationSecurityPage';
import { SecurityGroupPage } from '../pages/SecurityGroupPage';
import { getTranslations } from '../data/localization';

// ============================================================================
// Security Group flows — รัน 3 tests ต่อเนื่องใน browser session เดียว
// Login + navigate ทำครั้งเดียวใน beforeAll, แล้วทุก test ใช้ page ร่วมกัน:
//   1. CRUD + Revert ของ admin group (selectAllPermissions)
//   2. Create Medical Record (specific perms)
//   3. Create Nurse (specific perms)
// ============================================================================
test.describe.serial('Security Group flows', () => {
  const t      = getTranslations();
  const isThai = (process.env.APP_LANG || 'en').toLowerCase() === 'th';

  // Shared resources — สร้างใน beforeAll ใช้ร่วมกันทุก test ในไฟล์นี้
  let page: Page;
  let loginPage: LoginPage;
  let locationPage: LocationSecurityPage;
  let securityGroupPage: SecurityGroupPage;

  test.beforeAll(async ({ browser }) => {
    // เปิด browser context + page ใหม่ (ใช้ ต่อเนื่องทุก test)
    page              = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    loginPage         = new LoginPage(page);
    locationPage      = new LocationSecurityPage(page);
    securityGroupPage = new SecurityGroupPage(page);

    // Login + เลือก context + ไปหน้า Security Group list — ทำครั้งเดียว
    await loginPage.goto();
    await loginPage.login(process.env.SUPERADMIN_USER!, process.env.SUPERADMIN_PASS!);
    await locationPage.selectContext();
    await expect(page.getByRole('button', { name: t.addNewPatientBtn })).toBeVisible();
    await securityGroupPage.navigateToSecurityGroup();
  });

  test.afterAll(async () => {
    await page.close();
  });

// ============================================================================
// E2E: Security Group — Create / Verify Edit / Search / Filter / Inactive / Revert
// ----------------------------------------------------------------------------
// Test Steps:
//   A. Create — สร้าง group ใหม่พร้อม permissions ครบ → assert toast + row ใน list
//   B. Verify Edit drawer — เปิด edit แล้วตรวจว่า pre-fill ข้อมูลถูกต้องทุก field
//                           รวม permission counts X/X และ checkbox states
//   C. Search full name — ค้นชื่อเต็ม → เจอ exactly 1 row
//   D. Search partial name — ค้นบางคำ → ต้องเจอ row
//   E. Filter Inactive (group ยัง Active) → ต้องไม่เจอ + empty state
//   F. Set Inactive → Search Active ไม่เจอ / Search Inactive เจอ
//   G. Revert Active → Search Active เจอคืน / Search Inactive ไม่เจอ
// ============================================================================

test('Security Group: Create / Verify / Search / Filter / Inactive / Revert', async () => {
  // ============================================================
  // Test data
  // ============================================================
  // Unique timestamp (DDMMYYYYHHMMSS) — Asia/Bangkok
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const stamp = ['day', 'month', 'year', 'hour', 'minute', 'second']
    .map(typ => parts.find(p => p.type === typ)?.value ?? '').join('');

  const groupName      = `QA Seed Group ${stamp}`;
  const partialKeyword = stamp.substring(0, 10);   // DDMMYYYYHH
  const description    = isThai
    ? `กลุ่มสำหรับทดสอบ ${stamp}`
    : `Security group with all permissions for testing ${stamp}`;
  const homepage = t.homepageSearchPatient;

  // Permission categories ที่จะ verify checkbox state ใน step B
  const verifyCategory = t.catAlert;   // 'Alert' / 'การแจ้งเตือน'
  const verifyLabels   = ['Manage Clinical', 'View Clinical'];

  // Reset list state — ก่อนเริ่ม test แรก เผื่อ search/filter ค้างจาก test ก่อนหน้า
  await securityGroupPage.clickReset();

  // ============================================================
  // STEP A — Create group with all permissions
  // ============================================================
  await test.step('A. Create group with all permissions', async () => {
    await securityGroupPage.openCreateDrawer();
    await securityGroupPage.fillGroupInfo(groupName, homepage, description);
    await securityGroupPage.selectAllPermissions();
    await securityGroupPage.clickCreate();

    // Assert: toast สำเร็จ
    await securityGroupPage.expectCreateSuccessToast();

    // Assert: row ใหม่ปรากฏใน Active list
    await securityGroupPage.searchByName(groupName);
    await securityGroupPage.expectRowVisible(groupName);
  });

  // ============================================================
  // STEP B — Verify pre-filled data in Edit drawer
  // ============================================================
  await test.step('B. Verify pre-filled data in Edit drawer', async () => {
    await securityGroupPage.openEditDrawer(groupName);

    const snap = await securityGroupPage.getDrawerSnapshot();

    // ตรวจ Information fields
    expect(snap.name,        'Name should match').toBe(groupName);
    expect(snap.homepage,    'Homepage should match').toBe(homepage);
    expect(snap.description, 'Description should match').toBe(description);
    expect(snap.isActive,    'New group should be Active').toBe(true);

    // ตรวจ permission counts — ทุก category ต้อง X/X (ติ๊กเต็ม)
    const entries = Object.entries(snap.permissionCounts);
    expect(entries.length, 'Should find at least 1 permission category').toBeGreaterThan(0);

    for (const [category, count] of entries) {
      const [checked, total] = count.split('/');
      if (!total) continue;   // skip ถ้า format ผิด
      expect(
        checked,
        `Category "${category}" should be fully checked (got ${count})`,
      ).toBe(total);
    }

    // ตรวจ checkbox state ของ permission labels ที่ระบุ
    for (const label of verifyLabels) {
      await securityGroupPage.expectPermissionChecked(verifyCategory, label, true);
    }

    // ปิด drawer โดยไม่บันทึก
    await securityGroupPage.cancelButton.click();
    await securityGroupPage.groupNameInput.waitFor({ state: 'hidden' }).catch(() => {});
    await page.waitForTimeout(500);
  });

  // ============================================================
  // STEP C — Search by full name → exactly 1 row
  // ============================================================
  await test.step('C. Search full name returns exactly 1 row', async () => {
    await securityGroupPage.clickReset();
    await securityGroupPage.searchByName(groupName);
    await securityGroupPage.expectRowVisible(groupName);
    await expect(
      securityGroupPage.tableBody.getByText(groupName, { exact: true })
    ).toHaveCount(1);
  });

  // ============================================================
  // STEP D — Search by partial keyword → must find
  // ============================================================
  await test.step('D. Search partial keyword still finds the group', async () => {
    await securityGroupPage.clickReset();
    await securityGroupPage.searchByName(partialKeyword);
    await securityGroupPage.expectRowVisible(groupName);
  });

  // ============================================================
  // STEP E — Filter Inactive on an Active group → not found
  // ============================================================
  await test.step('E. Filter Inactive on Active group → not found', async () => {
    await securityGroupPage.clickReset();
    await securityGroupPage.searchByName(groupName);
    await securityGroupPage.filterByStatus('Inactive');
    await securityGroupPage.expectRowNotVisible(groupName);
    await securityGroupPage.expectEmptyState();
  });

  // ============================================================
  // STEP F — Set group Inactive → verify Active list / Inactive list
  // ============================================================
  await test.step('F. Set Inactive: not in Active list, found in Inactive list', async () => {
    // กลับมา Active list
    await securityGroupPage.clickReset();
    await securityGroupPage.searchByName(groupName);
    await securityGroupPage.expectRowVisible(groupName);

    // เปิด edit → toggle inactive → update
    await securityGroupPage.openEditDrawer(groupName);
    await securityGroupPage.setActiveStatus(false);
    await securityGroupPage.clickUpdate();
    await securityGroupPage.expectUpdateSuccessToast();

    // Active list → ไม่เจอ
    await securityGroupPage.clickReset();
    await securityGroupPage.searchByName(groupName);
    await securityGroupPage.expectRowNotVisible(groupName);
    await securityGroupPage.expectEmptyState();

    // Inactive list → เจอ
    await securityGroupPage.filterByStatus('Inactive');
    await securityGroupPage.expectRowVisible(groupName);
  });

  // ============================================================
  // STEP G — Revert Active → found in Active list, not in Inactive list
  // ============================================================
  await test.step('G. Revert Active: found in Active list, not in Inactive list', async () => {
    // ตอนนี้อยู่ใน Inactive list อยู่แล้ว — เปิด edit → toggle active
    await securityGroupPage.openEditDrawer(groupName);
    await securityGroupPage.setActiveStatus(true);
    await securityGroupPage.clickUpdate();
    await securityGroupPage.expectUpdateSuccessToast();

    // Active list → เจอ
    await securityGroupPage.clickReset();
    await securityGroupPage.searchByName(groupName);
    await securityGroupPage.expectRowVisible(groupName);

    // Inactive list → ไม่เจอ
    await securityGroupPage.filterByStatus('Inactive');
    await securityGroupPage.expectRowNotVisible(groupName);
    await securityGroupPage.expectEmptyState();
  });
});

// ============================================================================
// E2E: สร้าง Security Group ชื่อ "Medical Record DDMMYYYYHHMMSS" พร้อม specific permissions
// - Alert (View Clinical, View Expiry, View Financial, Manage Notify All, View Notify All, View Pharmacy)
// - Registration (Manage Registration, View Registration)
// ============================================================================
test('Create Medical Record Security Group with specific permissions', async () => {
  // === Test data ===
  // Unique name ตามเวลาไทย DDMMYYYYHHMMSS (รวมวินาที กัน collision เวลารันซ้ำในนาทีเดียวกัน)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const stamp = ['day', 'month', 'year', 'hour', 'minute', 'second']
    .map((typ) => parts.find((p) => p.type === typ)?.value ?? '')
    .join('');
  const groupName = `Medical Record ${stamp}`;
  const homepage = t.homepageSearchPatient;
  const description = isThai ? 'กลุ่มเวชระเบียน' : 'Medical Record group';

  // permission labels เป็น EN ทั้งสองภาษา (ระบบไม่แปล label ของ checkbox)
  const alertLabels = [
    'View Clinical',
    'View Expiry',
    'View Financial',
    'Manage Notify All',
    'View Notify All',
    'View Pharmacy',
  ];
  const registrationLabels = ['Manage Registration', 'View Registration'];

  // Reset list state — test ก่อนหน้าอาจค้าง search/filter
  await securityGroupPage.clickReset();

  // === Create group ===
  await securityGroupPage.openCreateDrawer();
  await securityGroupPage.fillGroupInfo(groupName, homepage, description);
  await securityGroupPage.selectPermissionsByLabel(t.catAlert, alertLabels);
  await securityGroupPage.selectPermissionsByLabel(t.catRegistration, registrationLabels);
  await securityGroupPage.clickCreate();

  // === Verify ===
  await securityGroupPage.expectCreateSuccessToast();
  await securityGroupPage.searchByName(groupName);
  await securityGroupPage.expectRowVisible(groupName);
});

// ============================================================================
// E2E: สร้าง Security Group ชื่อ "Nurse DDMMYYYYHHMMSS" พร้อม specific permissions
// - Alert: Manage Clinical, View Clinical, View Expiry, View Financial,
//          Manage Notify All, View Notify All, View Pharmacy
// - Appointment: Manage Appointment, View Appointment,
//                Manage Appointment Setup, View Appointment Setup
// - CPOE: Manage Order CPOE, View Order CPOE, Order CPOE Lab, Order CPOE Pharmacy,
//         Order CPOE procedure,service,DF, Order CPOE Supply, Order CPOE X-ray
// - EMR: View All Visit History, Manage Appointment, View Appointment,
//        View Chief Complain Doctor, Manage Chief Complain Nurse,
//        View Chief Complain Nurse, View Chief Complain Registration,
//        View Diagnosis (ICD-10), Manage Note, View Note, View Only Visit History,
//        Manage Allergy Patient History, View Patient History,
//        Manage Drug Allergy Patient History (Doctor), View Physical Examination,
//        View Present Illness, View Procedures (ICD-9), Manage Refer Out,
//        View Refer Out, View Result, Manage Vital sign, View Vital sign
// - OPD: Manage Nurse Worklist, View Nurse Worklist
// - Registration: View Registration
// Homepage = OPD Nurse Worklist (EN) / เวิร์กลิสต์พยาบาลผู้ป่วยนอก (TH)
// ============================================================================
test('Create Nurse Security Group with specific permissions', async () => {
  // === Test data ===
  // Unique name ตามเวลาไทย DDMMYYYYHHMMSS (รวมวินาที กัน collision เวลารันซ้ำในนาทีเดียวกัน)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const stamp = ['day', 'month', 'year', 'hour', 'minute', 'second']
    .map((typ) => parts.find((p) => p.type === typ)?.value ?? '')
    .join('');
  const groupName = `Nurse ${stamp}`;
  // Homepage = OPD Nurse Worklist — language-aware ผ่าน localization
  const homepage = t.homepageOPDNurseWorklist;
  const description = isThai ? 'กลุ่มพยาบาล' : 'Nurse group';

  // === Permission labels (เป็น EN ทั้ง 2 ภาษา ระบบไม่แปล label ของ checkbox) ===
  const alertLabels = [
    'Manage Clinical',
    'View Clinical',
    'View Expiry',
    'View Financial',
    'Manage Notify All',
    'View Notify All',
    'View Pharmacy',
  ];
  const appointmentLabels = [
    'Manage Appointment',
    'View Appointment',
    'Manage Appointment Setup',
    'View Appointment Setup',
  ];
  const cpoeLabels = [
    'Manage Order CPOE',
    'View Order CPOE',
    'Order CPOE Lab',
    'Order CPOE Pharmacy',
    'Order CPOE procedure,service,DF',
    'Order CPOE Supply',
    'Order CPOE X-ray',
  ];
  const emrLabels = [
    'View All Visit History',
    'Manage Appointment',
    'View Appointment',
    'View Chief Complain Doctor',
    'Manage Chief Complain Nurse',
    'View Chief Complain Nurse',
    'View Chief Complain Registration',
    'View Diagnosis (ICD-10)',
    'Manage Note',
    'View Note',
    'View Only Visit History',
    'Manage Allergy Patient History',
    'View Patient History',
    'Manage Drug Allergy Patient History (Doctor)',
    'View Physical Examination',
    'View Present Illness',
    'View Procedures (ICD-9)',
    'Manage Refer Out',
    'View Refer Out',
    'View Result',
    'Manage Vital sign',
    'View Vital sign',
  ];
  const opdLabels = ['Manage Nurse Worklist', 'View Nurse Worklist'];
  const registrationLabels = ['View Registration'];

  // Reset list state — test ก่อนหน้าอาจค้าง search/filter
  await securityGroupPage.clickReset();

  // === Create group ===
  await securityGroupPage.openCreateDrawer();
  await securityGroupPage.fillGroupInfo(groupName, homepage, description);
  await securityGroupPage.selectPermissionsByLabel(t.catAlert, alertLabels);
  await securityGroupPage.selectPermissionsByLabel(t.catAppointment, appointmentLabels);
  await securityGroupPage.selectPermissionsByLabel(t.catCPOE, cpoeLabels);
  await securityGroupPage.selectPermissionsByLabel(t.catEMR, emrLabels);
  await securityGroupPage.selectPermissionsByLabel(t.catOPD, opdLabels);
  await securityGroupPage.selectPermissionsByLabel(t.catRegistration, registrationLabels);
  await securityGroupPage.clickCreate();

  // === Verify ===
  await securityGroupPage.expectCreateSuccessToast();
  await securityGroupPage.searchByName(groupName);
  await securityGroupPage.expectRowVisible(groupName);
});
}); // end test.describe.serial('Security Group flows')
