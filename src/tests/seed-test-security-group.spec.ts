import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LocationSecurityPage } from '../pages/LocationSecurityPage';
import { SecurityGroupPage } from '../pages/SecurityGroupPage';
import { getTranslations } from '../data/localization';

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

test('Security Group: Create / Verify / Search / Filter / Inactive / Revert', async ({ page }) => {
  const loginPage          = new LoginPage(page);
  const locationPage       = new LocationSecurityPage(page);
  const securityGroupPage  = new SecurityGroupPage(page);
  const t                  = getTranslations();
  const isThai             = (process.env.APP_LANG || 'en').toLowerCase() === 'th';

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
  const homepage = isThai ? t.homepageSearchPatient : t.homepageSearchPatient;

  // Permission categories ที่จะ verify checkbox state ใน step B
  const verifyCategory = isThai ? t.catAlert : t.catAlert;   // 'Alert' / 'การแจ้งเตือน'
  const verifyLabels   = ['Manage Clinical', 'View Clinical'];

  // ============================================================
  // Login + Navigate
  // ============================================================
  await loginPage.goto();
  await loginPage.login(process.env.SUPERADMIN_USER!, process.env.SUPERADMIN_PASS!);
  await locationPage.selectContext();
  // ยืนยันว่า login สำเร็จ
  await expect(page.getByRole('button', { name: t.addNewPatientBtn })).toBeVisible();
  await securityGroupPage.navigateToSecurityGroup();

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