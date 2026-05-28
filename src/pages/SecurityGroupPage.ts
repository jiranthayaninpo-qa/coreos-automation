import { Page, Locator, expect } from '@playwright/test';
import { getTranslations } from '../data/localization';

// ============================================================================
// SecurityGroupPage — Page Object สำหรับ flow Security Group ของ CoreOS
// ----------------------------------------------------------------------------
// DOM notes (จาก inspection จริง):
//   • Active toggle  = Ant Design Switch: button[role="switch"].ant-switch
//                      อ่านสถานะ: getAttribute('aria-checked') === 'true'
//   • Search button  = MUI IconButton: button:has(svg path[d^="M15.5 14h-.79"])
//   • Reset button   = MUI IconButton: button:has(svg path[d^="M17.65 6.35"])
//   • Drawer panel   = .MuiDrawer-anchorRight (slide-in panel ด้านขวา)
//   • Homepage select = .MuiDrawer-anchorRight .MuiSelect-select (ไม่ใช่ Status dropdown)
//   • Permission h6  = อยู่ใน Permissions section ใต้ drawer — ต้อง scope กัน drawer title
//   • Browser autocomplete = ขึ้นมาตอนพิมพ์ชื่อ → ต้อง press Escape ก่อน interact อื่น
// ============================================================================

// Snapshot ของ drawer ที่ใช้ assert ว่าข้อมูลตรงตามที่กรอกตอน Create
export interface DrawerSnapshot {
  name: string;
  homepage: string;
  description: string;
  isActive: boolean;
  // Map category name -> "checked/total" เช่น { Alert: '10/10' }
  permissionCounts: Record<string, string>;
}

export class SecurityGroupPage {
  readonly page: Page;

  // ---------- List page ----------
  readonly searchInput: Locator;
  readonly searchSubmitButton: Locator;
  readonly resetButton: Locator;
  readonly statusDropdown: Locator;
  readonly createButton: Locator;
  readonly tableBody: Locator;
  readonly emptyStateHeading: Locator;

  // ---------- Drawer fields ----------
  readonly drawerPanel: Locator;
  readonly drawerActiveToggle: Locator;
  readonly groupNameInput: Locator;
  readonly homepageSelect: Locator;
  readonly descriptionInput: Locator;
  readonly permissionSearchInput: Locator;
  readonly submitButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const t = getTranslations();

    // === List page ===
    this.searchInput = page.getByPlaceholder(t.searchPlaceholder);

    // Search / Reset = MUI IconButton ที่ไม่มี aria-label — ใช้ SVG path จาก DOM จริง
    this.searchSubmitButton = page.locator('button:has(svg path[d^="M15.5 14h-.79"])');
    this.resetButton        = page.locator('button:has(svg path[d^="M17.65 6.35"])');

    // Status dropdown = MUI Select combobox ใน list page
    this.statusDropdown = page
      .locator('.MuiInputBase-root')
      .filter({ hasNot: page.locator('.MuiDrawer-anchorRight') })
      .locator('[role="combobox"]')
      .first();

    this.createButton = page.getByRole('button', { name: t.submitGroupBtn === 'สร้าง' ? 'สร้าง' : 'Create' });
    this.tableBody    = page.locator('table tbody');
    this.emptyStateHeading = page.getByText(t.emptyStateHeading, { exact: true });

    // === Drawer (Create / Edit) ===
    // Drawer = panel ที่ slide-in จากขวา — class: MuiDrawer-anchorRight
    this.drawerPanel = page.locator('.MuiDrawer-anchorRight');

    // Active toggle = Ant Design Switch (button[role="switch"])
    // ใช้ page-level ไม่ scope ใน drawer เพราะ toggle อยู่นอก scrollable content
    this.drawerActiveToggle = page.locator('button[role="switch"].ant-switch').first();

    // Group name input — placeholder ต่างกันตามภาษา
    this.groupNameInput = page.getByPlaceholder(t.groupNamePlaceholder);

    // Homepage = MUI Select ใน drawer — scope ผ่าน drawer paper เพื่อกัน Status combo ใน list page
    // (รองรับทั้ง Create drawer ที่แสดง "Select Homepage" และ Edit drawer ที่แสดงค่า saved)
    this.homepageSelect = page
      .locator('.MuiDrawer-paperAnchorRight')
      .getByRole('combobox')
      .first();

    this.descriptionInput    = page.getByPlaceholder(t.descriptionPlaceholder);
    this.permissionSearchInput = page.getByPlaceholder(t.permissionSearchPlaceholder);

    this.submitButton = this.drawerPanel.getByRole('button', { name: t.submitGroupBtn, exact: true });
    this.updateButton = this.drawerPanel.getByRole('button', { name: t.updateBtn, exact: true });
    this.cancelButton = this.drawerPanel.getByRole('button', { name: t.cancelBtn, exact: true });
  }

  // ==========================================================================
  // Navigation — ไปหน้า Security Group list
  // ==========================================================================
  async navigateToSecurityGroup(): Promise<void> {
    const t = getTranslations();

    // Hover sidebar เพื่อ expand (ถ้า collapsed)
    await this.page.locator('.MuiDrawer-docked, nav').first().hover().catch(() => {});
    await this.page.waitForTimeout(300);

    // คลิก Setup → รอ submenu → คลิก User management
    await this.page.getByRole('button', { name: t.setupMenu, exact: true }).click();
    await this.page.getByRole('button', { name: t.userMgmtSubMenu, exact: true })
      .waitFor({ state: 'visible' });
    await this.page.waitForTimeout(200);
    await this.page.getByRole('button', { name: t.userMgmtSubMenu, exact: true }).click();

    // รอหน้า User Management cards
    await this.page.getByText(t.securityGroupCard, { exact: true }).first()
      .waitFor({ state: 'visible' });

    // คลิกการ์ด Security Group
    await this.page.getByText(t.securityGroupCard, { exact: true }).first().click();

    // รอหน้า list load
    await this.searchInput.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(500);
  }

  // ==========================================================================
  // Create drawer
  // ==========================================================================
  async openCreateDrawer(): Promise<void> {
    await this.createButton.click();
    await this.groupNameInput.waitFor({ state: 'visible' });
    // รอ Permissions loading เสร็จก่อน interact
    await this._waitForPermissionsLoaded();
  }

  // กรอกข้อมูลใน drawer: name, homepage, description
  async fillGroupInfo(name: string, homepage: string, description: string): Promise<void> {
    // กรอก name — เลี่ยง keyboard.press('Escape') เพราะ MUI Drawer ปิดเมื่อกด Escape
    // (ทำให้ Homepage combobox หายไปก่อน select)
    // วิธีปิด browser autocomplete: เลือกข้อความทั้งหมดแล้วพิมพ์แทน + ย้าย focus ไปช่องอื่นด้วย Tab
    await this.groupNameInput.click();
    await this.groupNameInput.fill(name);
    await this.page.waitForTimeout(150);

    // เลือก Homepage
    await this.selectHomepage(homepage);

    // กรอก Description
    if (description) {
      await this.descriptionInput.fill(description);
    }
  }

  async selectHomepage(option: string): Promise<void> {
    await this.homepageSelect.click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
    await this.page.waitForTimeout(200);
  }

  // ติ๊ก permission ทุก checkbox ของ category ที่ระบุ
  async selectAllPermissionsInCategory(categoryName: string): Promise<void> {
    const heading = this.drawerPanel
      .getByRole('heading', { level: 6, name: categoryName, exact: true })
      .first();
    await heading.scrollIntoViewIfNeeded();

    // expand section ถ้ายังไม่ expand
    const section = heading.locator('xpath=ancestor::div[3]');
    const firstLabel = section.locator('label.MuiFormControlLabel-root').first();
    if (!(await firstLabel.isVisible().catch(() => false))) {
      await heading.click();
      await this.page.waitForTimeout(300);
    }

    // ติ๊กทุก label ที่ยังไม่ checked
    const labels = section.locator('label.MuiFormControlLabel-root');
    const count  = await labels.count();
    for (let i = 0; i < count; i++) {
      const input = labels.nth(i).locator('input[type="checkbox"]');
      if (!(await input.isChecked())) {
        await labels.nth(i).click();
        await this.page.waitForTimeout(50);
      }
    }
  }

  // ติ๊ก permission ทุก category ใน drawer (auto-discover จาก h6 ใน Permissions section)
  // Filter: เก็บเฉพาะ h6 ที่ ancestor::div[3] เป็น "section container ของ category เดียว"
  //   เงื่อนไข: มี checkbox >= 1 ตัว AND มี h6 อยู่เพียง 1 ตัว (ตัวมันเอง)
  //   กัน h6 อย่าง "Security Group" (drawer title) ที่ ancestor scope ครอบทั้ง drawer ทำให้ h6 อื่นปนเข้ามา
  async selectAllPermissions(): Promise<void> {
    const allHeadingTexts = await this.drawerPanel
      .getByRole('heading', { level: 6 })
      .allTextContents();
    const candidates = Array.from(
      new Set(allHeadingTexts.map((s) => s.trim()).filter((s) => s.length > 0)),
    );

    for (const name of candidates) {
      const heading = this.drawerPanel.getByRole('heading', { level: 6, name, exact: true });
      const section = heading.first().locator('xpath=ancestor::div[3]');
      const cbCount = await section.locator('input[type="checkbox"]').count();
      const h6Count = await section.locator('h6').count();
      if (cbCount > 0 && h6Count === 1) {
        await this.selectAllPermissionsInCategory(name);
      }
    }
  }

  // กดปุ่ม Create
  async clickCreate(): Promise<void> {
    await this.submitButton.click();
    // รอ drawer ปิด
    await this.groupNameInput.waitFor({ state: 'hidden' }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  // ==========================================================================
  // Edit drawer
  // ==========================================================================

  // เปิด Edit drawer โดยคลิกที่ Name cell ของ row นั้น
  async openEditDrawer(groupName: string): Promise<void> {
    const row = this.tableBody.locator('tr').filter({ hasText: groupName });
    await row.locator('td').nth(1).click();
    await this.groupNameInput.waitFor({ state: 'visible' });
    await this._waitForPermissionsLoaded();
  }

  // กดปุ่ม Update
  async clickUpdate(): Promise<void> {
    await this.updateButton.click();
    await this.groupNameInput.waitFor({ state: 'hidden' }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  // Toggle Active/Inactive — Ant Design Switch ใช้ aria-checked
  async setActiveStatus(isActive: boolean): Promise<void> {
    const current = (await this.drawerActiveToggle.getAttribute('aria-checked')) === 'true';
    if (current !== isActive) {
      await this.drawerActiveToggle.click();
      await this.page.waitForTimeout(300);
    }
  }

  // ==========================================================================
  // Search / Filter / Reset
  // ==========================================================================

  // พิมพ์ keyword แล้วกดปุ่ม Search (🔍 purple)
  async searchByName(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(200);
    await this.searchSubmitButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  // เลือก Status filter แล้วกดปุ่ม Search เพื่อ apply
  async filterByStatus(status: 'Active' | 'Inactive' | 'All'): Promise<void> {
    const t = getTranslations();
    const optMap = { Active: t.activeOpt, Inactive: t.inactiveOpt, All: t.allOpt };
    await this.statusDropdown.click();
    await this.page.getByRole('option', { name: optMap[status], exact: true }).click();
    await this.page.waitForTimeout(300);
    await this.searchSubmitButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  // กดปุ่ม Reset (🔄)
  async clickReset(): Promise<void> {
    await this.resetButton.first().click();
    await this.page.waitForTimeout(800);
  }

  // ==========================================================================
  // Assertions
  // ==========================================================================

  async expectCreateSuccessToast(): Promise<void> {
    const t = getTranslations();
    await expect(
      this.page.getByText(t.createSuccessToastHeading).or(
        this.page.getByText(t.createSuccessSnackbar)
      ).first()
    ).toBeVisible({ timeout: 5000 });
  }

  async expectUpdateSuccessToast(): Promise<void> {
    const t = getTranslations();
    await expect(
      this.page.getByText(t.updateSuccessToastHeading).or(
        this.page.getByText(t.updateSuccessSnackbar)
      ).first()
    ).toBeVisible({ timeout: 5000 });
  }

  async expectRowVisible(name: string): Promise<void> {
    await expect(this.tableBody.getByText(name, { exact: true })).toBeVisible();
  }

  async expectRowNotVisible(name: string): Promise<void> {
    await expect(this.tableBody.getByText(name, { exact: true })).toHaveCount(0);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyStateHeading).toBeVisible();
  }

  // ==========================================================================
  // Snapshot helpers (สำหรับ verify pre-filled data ใน Edit drawer)
  // ==========================================================================

  // อ่านค่าทั้งหมดจาก Edit drawer ที่กำลังเปิดอยู่
  async getDrawerSnapshot(): Promise<DrawerSnapshot> {
    const name        = (await this.groupNameInput.inputValue()).trim();
    const homepage    = (await this.homepageSelect.innerText()).trim();
    const description = (await this.descriptionInput.inputValue()).trim();
    const isActive    = (await this.drawerActiveToggle.getAttribute('aria-checked')) === 'true';

    // อ่าน permission counts — เก็บเฉพาะ h6 ที่เป็น category จริง
    // Filter เดียวกับ selectAllPermissions: ancestor::div[3] มี checkbox >= 1 AND มี h6 = 1
    //   (กัน drawer title อย่าง "Edit Security Group" หรือ section header "Information")
    const permissionCounts: Record<string, string> = {};
    const allHeadingTexts = await this.drawerPanel
      .getByRole('heading', { level: 6 })
      .allTextContents();
    const candidates = Array.from(
      new Set(allHeadingTexts.map((s) => s.trim()).filter((s) => s.length > 0)),
    );

    for (const text of candidates) {
      const heading = this.drawerPanel.getByRole('heading', { level: 6, name: text, exact: true });
      const section = heading.first().locator('xpath=ancestor::div[3]');
      const cbCount = await section.locator('input[type="checkbox"]').count();
      const h6Count = await section.locator('h6').count();
      if (cbCount === 0 || h6Count !== 1) continue;
      // หา "X/Y" pattern ใน row ของ h6 นี้
      const row = heading.first().locator('xpath=ancestor::div[2]');
      const rowText = await row.innerText().catch(() => '');
      const matches = [...rowText.matchAll(/(\d+)\s*\/\s*(\d+)/g)];
      if (matches.length > 0) {
        const last = matches[matches.length - 1];
        permissionCounts[text] = `${last[1]}/${last[2]}`;
      }
    }

    return { name, homepage, description, isActive, permissionCounts };
  }

  // Verify checkbox state ของ permission label ใน category
  async expectPermissionChecked(
    category: string,
    label: string,
    checked: boolean,
  ): Promise<void> {
    const heading = this.drawerPanel
      .getByRole('heading', { level: 6, name: category, exact: true })
      .first();
    await heading.scrollIntoViewIfNeeded();

    // expand ถ้ายังไม่ expand
    const section    = heading.locator('xpath=ancestor::div[3]');
    const firstLabel = section.locator('label.MuiFormControlLabel-root').first();
    if (!(await firstLabel.isVisible().catch(() => false))) {
      await heading.click();
      await this.page.waitForTimeout(300);
    }

    const target = section
      .locator('label.MuiFormControlLabel-root')
      .filter({ hasText: new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) });

    if (checked) {
      await expect(target.locator('input[type="checkbox"]')).toBeChecked();
    } else {
      await expect(target.locator('input[type="checkbox"]')).not.toBeChecked();
    }
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  // รอจน drawer ใน DOM stable (ไม่มี re-render ต่อเนื่อง)
  // poll ขนาด DOM ของ drawer paper — ถ้าค่าเท่ากัน 3 รอบติด แปลว่า render เสร็จ
  private async _waitForPermissionsLoaded(timeout = 15000): Promise<void> {
    await this.page.waitForFunction(
      () => !document.body?.textContent?.includes('Loading permissions...') &&
            !document.body?.textContent?.includes('กำลังโหลด'),
      { timeout: 3000 },
    ).catch(() => {});

    // poll DOM size ของ drawer paper จน stable (ขนาดไม่เปลี่ยน 3 รอบติด)
    await this.page.waitForFunction(
      () => {
        const w = window as any;
        const paper = document.querySelector('.MuiDrawer-paperAnchorRight');
        if (!paper) return false;
        const size = paper.innerHTML.length;
        w.__paperSize ??= [];
        w.__paperSize.push(size);
        if (w.__paperSize.length > 3) w.__paperSize.shift();
        return w.__paperSize.length === 3 &&
               w.__paperSize[0] === w.__paperSize[1] &&
               w.__paperSize[1] === w.__paperSize[2];
      },
      { timeout, polling: 300 },
    ).catch(() => {});
    await this.page.waitForTimeout(300);
  }
}