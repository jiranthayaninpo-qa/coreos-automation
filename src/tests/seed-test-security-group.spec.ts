import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LocationSecurityPage } from '../pages/LocationSecurityPage';
import { SecurityGroupPage } from '../pages/SecurityGroupPage';
import { getTranslations } from '../data/localization';

// ============================================================================
// E2E: Security Group — Create / Edit / Search / Filter / Reset / Revert
// ----------------------------------------------------------------------------
// Coverage (8 steps, ทุก step มี explicit assertion):
//   A. Create unique group with full permissions
//      → assert: toast "Created Successfully" + row ปรากฏใน Active list
//   B. Re-open Edit drawer → verify ข้อมูล pre-fill ตรงกับที่กรอกตอน Create
//      ครบ: name, homepage, description, active=on, permission counts (X/X full)
//      + checkbox state ของ permission ที่ติ๊กไว้
//   C. Search by full name → เจอ 1 row
//   D. Search by partial name (substring) → ต้องเจอ
//   E. Filter Status = Inactive → ต้องไม่เจอ row ใหม่ (เพราะยัง Active อยู่)
//   F. Toggle group เป็น Inactive ผ่าน edit drawer
//      → assert: Search ใน Active list ไม่เจอ, Search ใน Inactive list เจอ
//   G. Toggle กลับเป็น Active → assert: Search ใน Active list เจอ
//   H. Revert: edit name/homepage/description กลับเป็นเดิม (cleanup เพื่อ DB clean)
// ============================================================================

test('Security Group CRUD + verify assertions for create/edit/search/filter', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  const locationSecurityPage = new LocationSecurityPage(page);
  const securityGroupPage = new SecurityGroupPage(page);

  const t = getTranslations();
  const isThai = (process.env.APP_LANG || 'en').toLowerCase() === 'th';

  // ============================================================
  // Test data setup
  // ============================================================
  // Unique name ตามเวลาไทย DDMMYYYYHHMM กัน collision เมื่อรันซ้ำ
  const thaiTimeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const stamp = ['day', 'month', 'year', 'hour', 'minute']
    .map((typ) => thaiTimeParts.find((p) => p.type === typ)?.value ?? '')
    .join('');
  const originalName = `QA Seed Group ${stamp}`;
  // Partial keyword ใช้เทส search by substring (เอา 4 ตัวกลางของ stamp)
  const partialKeyword = stamp.substring(2, 8);
  const description = isThai ? 'กลุ่มสำหรับทดสอบ' : 'Group for QA seeding';

  // Homepage: ตอน Create ใช้ Search Patient, ตอน Edit จะเปลี่ยน (ดู step H)
  const originalHomepage = isThai ? t.homepageSearchPatient : t.homepageSearchPatient;

  // เลือก category สำหรับ verify checkbox state — Alert ครบ 10/10
  const verifyCategory = isThai ? t.catAlert : t.catAlert;
  const verifyLabels = ['Manage Clinical', 'View Clinical', 'Manage Expiry', 'View Expiry'];

  // ============================================================
  // Login + navigate
  // ============================================================
  await loginPage.goto();
  await loginPage.login(process.env.SUPERADMIN_USER!, process.env.SUPERADMIN_PASS!);
  await locationSecurityPage.selectContext();
  await expect(page.getByRole('button', { name: t.addNewPatientBtn })).toBeVisible();
  await securityGroupPage.MapsToSecurityGroup();

  // ============================================================
  // Step A — Create group with ALL permissions checked
  // ============================================================
  await test.step('A. Create group with all permissions', async () => {
    await securityGroupPage.clickCreateNewGroup();
    await securityGroupPage.fillGroupDetails(originalName, originalHomepage, description);
    await securityGroupPage.selectAllPermissions();
    await securityGroupPage.clickSubmit();

    // Assert: toast "Created Successfully" ปรากฏ
    await securityGroupPage.expectCreateSuccessToast();

    // Assert: row ใหม่ปรากฏใน list (default = Active filter)
    await securityGroupPage.searchGroup(originalName);
    await securityGroupPage.expectRowVisible(originalName);
  });

  // ============================================================
  // Step B — Re-open Edit drawer, verify all field values + permissions
  // ============================================================
  await test.step('B. Verify data pre-filled correctly in edit drawer', async () => {
    await securityGroupPage.clickEditRow(originalName);

    // อ่าน snapshot ของ drawer แล้ว assert ครบทุก field
    const snapshot = await securityGroupPage.getDrawerSnapshot();

    expect(snapshot.name, 'Group name should match what was entered on create').toBe(
      originalName,
    );
    expect(snapshot.homepage, 'Homepage should match selected option').toBe(originalHomepage);
    expect(snapshot.description, 'Description should match').toBe(description);
    expect(snapshot.isActive, 'New group should default to Active').toBe(true);

    // Verify permission counts — ทุก category ต้อง X/X (ติ๊กเต็ม)
    // ตัวอย่าง: { Alert: '10/10', Appointment: '4/4', ... }
    for (const [category, count] of Object.entries(snapshot.permissionCounts)) {
      const [checked, total] = count.split('/');
      expect(
        checked,
        `Category "${category}" should have all permissions checked (got ${count})`,
      ).toBe(total);
    }

    // Verify specific permission checkbox states (Alert section)
    for (const label of verifyLabels) {
      await securityGroupPage.expectPermissionChecked(verifyCategory, label, true);
    }

    // ปิด drawer (cancel) — ไม่บันทึก
    await securityGroupPage.cancelButton.click();
    await securityGroupPage.groupNameInput.waitFor({ state: 'hidden' }).catch(() => {});
    await page.waitForTimeout(500);
  });

  // ============================================================
  // Step C — Search by full name → exactly 1 row
  // ============================================================
  await test.step('C. Search by full name returns the group', async () => {
    await securityGroupPage.clickReset();
    await securityGroupPage.searchGroup(originalName);
    await securityGroupPage.expectRowVisible(originalName);
    // เพิ่ม assert: count ของ row ที่ match ชื่อนี้ = 1
    await expect(securityGroupPage.tableBody.getByText(originalName, { exact: true })).toHaveCount(
      1,
    );
  });

  // ============================================================
  // Step D — Search by partial name (substring) → must find
  // ============================================================
  await test.step('D. Search by partial keyword still finds the group', async () => {
    await securityGroupPage.clickReset();
    await securityGroupPage.searchGroup(partialKeyword);
    // group ที่เพิ่งสร้างต้องอยู่ใน result (ชื่อเต็มมี substring นี้)
    await securityGroupPage.expectRowVisible(originalName);
  });

  // ============================================================
  // Step E — Filter Status=Inactive on a still-active group → should NOT appear
  // ============================================================
  await test.step('E. Filter Inactive on an active group → row not found', async () => {
    await securityGroupPage.clickReset();
    await securityGroupPage.searchGroup(originalName);
    await securityGroupPage.filterByStatus('Inactive');
    // group ยัง Active อยู่ → list ที่ filter Inactive ต้องไม่เจอ
    await securityGroupPage.expectRowNotVisible(originalName);
    // optional: assert empty state ปรากฏ (ถ้า keyword unique พอ)
    await securityGroupPage.expectEmptyState();
  });

  // ============================================================
  // Step F — Toggle group to Inactive
  //   F.1) เปิด edit แล้วปิด active toggle
  //   F.2) Search ใน Active list → ไม่เจอ
  //   F.3) Switch ไป Inactive list → เจอ
  // ============================================================
  await test.step('F. Toggle group to Inactive then verify filter behavior', async () => {
    // กลับมา Active list ก่อนเปิด edit
    await securityGroupPage.clickReset();
    await securityGroupPage.searchGroup(originalName);
    await securityGroupPage.expectRowVisible(originalName);

    // เปิด edit + toggle active=off
    await securityGroupPage.clickEditRow(originalName);
    await securityGroupPage.toggleGroupStatus(false);
    await securityGroupPage.clickUpdate();
    await securityGroupPage.expectUpdateSuccessToast();

    // Active list → ไม่เจอ
    await securityGroupPage.clickReset();
    await securityGroupPage.searchGroup(originalName);
    await securityGroupPage.expectRowNotVisible(originalName);
    await securityGroupPage.expectEmptyState();

    // Inactive list → เจอ
    await securityGroupPage.filterByStatus('Inactive');
    await securityGroupPage.expectRowVisible(originalName);
  });

  // ============================================================
  // Step G — Toggle back to Active, verify it shows up in Active list again
  // ============================================================
  await test.step('G. Revert to Active, verify search finds it in Active list', async () => {
    // ตอนนี้อยู่ใน Inactive list — เปิด edit
    await securityGroupPage.clickEditRow(originalName);
    await securityGroupPage.toggleGroupStatus(true);
    await securityGroupPage.clickUpdate();
    await securityGroupPage.expectUpdateSuccessToast();

    // Switch back to Active list → ต้องเจอ
    await securityGroupPage.clickReset();
    await securityGroupPage.searchGroup(originalName);
    await securityGroupPage.expectRowVisible(originalName);
  });

  // ============================================================
  // Step H — Verify final state: open edit drawer one more time,
  // ensure everything is still in the original state (name, homepage,
  // description, all permissions checked, isActive=true)
  // ============================================================
  await test.step('H. Final verification — drawer still shows original data', async () => {
    await securityGroupPage.clickEditRow(originalName);
    const finalSnapshot = await securityGroupPage.getDrawerSnapshot();

    expect(finalSnapshot.name).toBe(originalName);
    expect(finalSnapshot.homepage).toBe(originalHomepage);
    expect(finalSnapshot.description).toBe(description);
    expect(finalSnapshot.isActive, 'Group should be reverted to Active').toBe(true);
    for (const [category, count] of Object.entries(finalSnapshot.permissionCounts)) {
      const [checked, total] = count.split('/');
      expect(checked, `Category "${category}" should still be fully checked`).toBe(total);
    }

    await securityGroupPage.cancelButton.click();
  });
});