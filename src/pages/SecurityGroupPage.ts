import { Page, Locator, expect } from '@playwright/test';
import { getTranslations } from '../data/localization';

// ============================================================================
// SecurityGroupPage — Page Object สำหรับ flow Security Group ของ CoreOS
// ----------------------------------------------------------------------------
// ครอบคลุม:
//   • Navigate Setup -> User management -> Security Group
//   • Create drawer (Information, Permissions, Access Profile)
//   • Edit drawer (toggle Active, แก้ field, ติ๊ก/uncheck permissions)
//   • List page: Search by name, Status filter (All/Active/Inactive), Reset
//   • Assertion helpers: toast, empty state, row visibility, permission counts,
//     drawer field values, checkbox states, active toggle state
// ----------------------------------------------------------------------------
// รองรับสองภาษา (en/th) ผ่าน APP_LANG env + dictionary ใน localization.ts
// ============================================================================

// ผลลัพธ์ของการอ่านค่าจาก Edit drawer — ใช้สำหรับ assert ว่าค่าตรงตามตอน Create
export interface DrawerSnapshot {
  name: string;
  homepage: string;
  description: string;
  isActive: boolean;
  // Map ของ category name -> "checked count / total count" เช่น { Alert: '10/10' }
  permissionCounts: Record<string, string>;
}

export class SecurityGroupPage {
  readonly page: Page;

  // ---------- Sidebar navigation ----------
  readonly setupMenu: Locator;
  readonly userMgmtSubMenu: Locator;
  readonly securityGroupCard: Locator;

  // ---------- List page ----------
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly searchSubmitButton: Locator;     // ปุ่ม 🔍 ที่กดเพื่อ submit (ต่างจาก icon ใน input)
  readonly resetButton: Locator;            // ปุ่ม 🔄 reset filter/search
  readonly statusDropdown: Locator;         // combobox Status (Active/Inactive/All)
  readonly emptyStateHeading: Locator;      // "Data not found"
  readonly tableBody: Locator;
  readonly listRows: Locator;

  // ---------- Drawer (shared by Create / Edit) ----------
  readonly drawer: Locator;
  readonly drawerActiveToggle: Locator;     // <input type=checkbox role=switch> ที่หัว drawer
  readonly groupNameInput: Locator;
  readonly homepageInput: Locator;          // MUI Select combobox
  readonly descriptionInput: Locator;
  readonly permissionSearchInput: Locator;
  readonly accessProfileSearchInput: Locator;
  readonly addAccessProfileButton: Locator;
  readonly submitButton: Locator;           // "Create" ใน Create drawer
  readonly updateButton: Locator;           // "Update" ใน Edit drawer
  readonly cancelButton: Locator;
  readonly drawerCloseButton: Locator;      // ปุ่ม X มุมขวาบน drawer

  constructor(page: Page) {
    this.page = page;
    const t = getTranslations();

    // === Sidebar items ===
    // Sidebar items render เป็น <button> ที่มี aria-label ตามชื่อเมนู แม้ตอน sidebar collapse
    this.setupMenu = page.getByRole('button', { name: t.setupMenu, exact: true });
    this.userMgmtSubMenu = page.getByRole('button', { name: t.userMgmtSubMenu, exact: true });
    this.securityGroupCard = page.getByText(t.securityGroupCard, { exact: true });

    // === List page ===
    this.createButton = page.getByRole('button', { name: t.createBtn });
    this.searchInput = page.getByPlaceholder(t.searchPlaceholder);

    // ปุ่ม Search กับ Reset อยู่ติดกันบนหัว toolbar — match ด้วย icon ผ่าน aria-label หรือ title
    //   หมายเหตุ: ปุ่ม Search ในที่นี้คือปุ่ม "submit search" ที่อยู่ขวาของ input
    //   (ไม่ใช่ icon ภายใน input field ทางซ้าย)
    //   วิธี: locator แบบ scope: section ที่มี Search label, แล้วหาปุ่ม icon
    //
    // กลยุทธ์ที่ stable ที่สุด: filter ปุ่มจาก SVG icon role
    //   - resetButton  : button ที่มี svg มี title/data-testid 'reset' หรืออยู่ใน toolbar
    //   - searchSubmitButton: button ที่มี svg 'search' และอยู่ใน toolbar
    //
    // เนื่องจาก app นี้ใช้ MUI IconButton ที่ไม่มี aria-label เป็น default
    // วิธีที่ stable: scope จาก position หลัง searchInput และก่อน createButton
    //   - ปุ่ม Search submit = ปุ่ม IconButton ที่มี data-testid="SearchIcon" หรือ svg ใน purple background
    //
    // ทางเลือกที่ทนทาน: ใช้ tooltip ที่ตั้งใน app — ถ้าทีม UI ใส่ title attr ไว้
    //   page.getByRole('button', { name: 'Search' })  // tooltip-based
    //
    // ใน script นี้ Rex เลือก: ใช้ title/aria-label ก่อน, มี fallback เป็น position
    this.searchSubmitButton = page
      .getByRole('button', { name: t.searchTooltip, exact: true })
      .or(page.locator('[data-testid="SearchIcon"]').locator('xpath=ancestor::button[1]'));
    this.resetButton = page
      .getByRole('button', { name: t.resetTooltip, exact: true })
      .or(page.locator('[data-testid="RefreshIcon"], [data-testid="RestartAltIcon"]').locator('xpath=ancestor::button[1]'));

    // Status combobox — text ปัจจุบันต้องเป็นหนึ่งใน Active/Inactive/All ของภาษานั้นๆ
    this.statusDropdown = page
      .getByRole('combobox')
      .filter({ hasText: new RegExp(`^(${t.activeOpt}|${t.inactiveOpt}|${t.allOpt})$`) })
      .first();

    // Empty state heading + subtext
    this.emptyStateHeading = page.getByText(t.emptyStateHeading, { exact: true });

    // Table body (table tbody) — scope row assertions
    this.tableBody = page.locator('table tbody');
    this.listRows = this.tableBody.locator('tr');

    // === Drawer (shared by Create / Edit) ===
    // Drawer คือ MUI Drawer หรือ role=dialog ที่ contain field "Security Group Name"
    this.drawer = page.locator('.MuiDrawer-root, [role="dialog"]').filter({
      has: page.getByPlaceholder(t.groupNamePlaceholder),
    });

    this.drawerActiveToggle = this.drawer
      .locator('input[type="checkbox"][role="switch"]')
      .first();
    this.groupNameInput = page.getByPlaceholder(t.groupNamePlaceholder);
    // Homepage = MUI combobox — filter ด้วย hasText เป็น placeholder OR option name
    //   ตอน Create: trigger แสดง placeholder "Select Homepage"
    //   ตอน Edit:   trigger แสดงชื่อ option ปัจจุบัน (เช่น "Search Patient")
    //   วิธี: scope ใน drawer แล้วเอา MuiSelect-select ตัวแรก (Homepage อยู่บนสุดของ form)
    this.homepageInput = this.drawer.locator('.MuiSelect-select').first();
    this.descriptionInput = page.getByPlaceholder(t.descriptionPlaceholder);
    this.permissionSearchInput = page.getByPlaceholder(t.permissionSearchPlaceholder);
    this.accessProfileSearchInput = page.getByPlaceholder(t.accessProfileSearchPlaceholder);
    this.addAccessProfileButton = page.getByRole('button', { name: t.addAccessProfileBtn });

    this.submitButton = page.getByRole('button', { name: t.submitGroupBtn, exact: true });
    this.updateButton = page.getByRole('button', { name: t.updateBtn, exact: true });
    this.cancelButton = page.getByRole('button', { name: t.cancelBtn, exact: true });
    // ปุ่ม X ปิด drawer = button ที่มี svg "Close" หรือ aria-label "close"
    this.drawerCloseButton = this.drawer.getByRole('button').filter({ hasText: '' }).last();
  }

  // ==========================================================================
  // Navigation
  // ==========================================================================

  // นำทางจาก Register Landing -> หน้า list ของ Security Group
  async MapsToSecurityGroup(): Promise<void> {
    // 1) เปิด sidebar drawer (เผื่อ collapsed)
    const openDrawerBtn = this.page.getByRole('button', { name: 'open drawer' });
    if (await openDrawerBtn.isVisible().catch(() => false)) {
      await openDrawerBtn.click();
      await this.page.waitForTimeout(500);
    }

    // 2) คลิก Setup -> รอ MUI Collapse animation -> คลิก User management
    await this.setupMenu.click();
    await this.userMgmtSubMenu.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(300);
    await this.userMgmtSubMenu.click();

    // 3) คลิกการ์ด Security Group
    await this.securityGroupCard.first().waitFor({ state: 'visible' });
    await this.securityGroupCard.first().click();

    // 4) รอ list page render เสร็จ — search input ต้องปรากฏ
    await this.searchInput.waitFor({ state: 'visible' });
  }

  // ==========================================================================
  // Create drawer
  // ==========================================================================

  async clickCreateNewGroup(): Promise<void> {
    await this.createButton.click();
    // รอ drawer mount + animation
    await this.groupNameInput.waitFor({ state: 'visible' });
  }

  // กรอกข้อมูลใน drawer: ชื่อกลุ่ม, Homepage, Description
  async fillGroupDetails(name: string, homepage: string, description: string): Promise<void> {
    await this.groupNameInput.fill(name);
    await this.selectHomepage(homepage);
    if (description) {
      await this.descriptionInput.fill(description);
    }
  }

  // เลือก option ใน Homepage dropdown (ทำงานทั้ง Create + Edit drawer)
  async selectHomepage(option: string): Promise<void> {
    await this.homepageInput.click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
    // รอ option text update บน trigger
    await this.page.waitForTimeout(200);
  }

  // ติ๊ก permission ทุก checkbox ของหมวด category ที่ระบุ
  async selectPermissions(categories: string[]): Promise<void> {
    for (const category of categories) {
      const heading = this.page.getByRole('heading', { level: 6, name: category, exact: true });
      await heading.first().scrollIntoViewIfNeeded();
      await heading.first().click();

      // section container = ancestor div[3] ของ h6
      const section = heading.first().locator('xpath=ancestor::div[3]');
      const labels = section.locator('label.MuiFormControlLabel-root');
      await labels.first().waitFor({ state: 'visible' });

      const labelCount = await labels.count();
      for (let i = 0; i < labelCount; i++) {
        const lbl = labels.nth(i);
        const input = lbl.locator('input[type="checkbox"]');
        if (!(await input.isChecked())) {
          await lbl.click();
        }
      }
    }
  }

  // ติ๊ก permission ทุก checkbox ของทุก category ใน drawer (auto-discover)
  async selectAllPermissions(): Promise<void> {
    const allHeadingTexts = await this.page.getByRole('heading', { level: 6 }).allTextContents();
    const candidates = Array.from(
      new Set(allHeadingTexts.map((s) => s.trim()).filter((s) => s.length > 0)),
    );

    const categories: string[] = [];
    for (const name of candidates) {
      const heading = this.page.getByRole('heading', { level: 6, name, exact: true });
      const section = heading.first().locator('xpath=ancestor::div[3]');
      const cbCount = await section.locator('input[type="checkbox"]').count();
      const h6Count = await section.locator('h6').count();
      // section ของ category เดียวต้องมี checkbox >=1 และ h6 เพียงตัวเดียว
      if (cbCount > 0 && h6Count === 1) categories.push(name);
    }

    await this.selectPermissions(categories);
  }

  // คลิกปุ่ม Create — รอ drawer ปิดและ list refresh
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
    await this.groupNameInput.waitFor({ state: 'hidden' }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  // ==========================================================================
  // Edit drawer
  // ==========================================================================

  // เปิด drawer edit ของ row ที่มีชื่อ group ตามที่ระบุ — คลิก name cell (td[1])
  async clickEditRow(groupName: string): Promise<void> {
    const row = this.page.locator('tr').filter({ hasText: groupName });
    await row.locator('td').nth(1).click();
    // รอ drawer เปิดและ field name visible
    await this.groupNameInput.waitFor({ state: 'visible' });
  }

  // คลิกปุ่ม Update — รอ drawer ปิดและ list refresh
  async clickUpdate(): Promise<void> {
    await this.updateButton.click();
    await this.groupNameInput.waitFor({ state: 'hidden' }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  // เปลี่ยนสถานะ Active/Inactive ผ่าน toggle switch ที่หัว drawer edit
  async toggleGroupStatus(isActive: boolean): Promise<void> {
    const current = await this.drawerActiveToggle.isChecked();
    if (current !== isActive) {
      // คลิกผ่าน wrapper เพราะ input MUI Switch มี opacity:0
      const wrapper = this.drawerActiveToggle.locator(
        'xpath=ancestor::span[contains(@class,"MuiSwitch-root")][1]',
      );
      await wrapper.click();
    }
  }

  // Toggle ติ๊ก/uncheck permission labels (คลิก label เพื่อ flip state ปัจจุบัน)
  async togglePermissionLabels(category: string, labels: string[]): Promise<void> {
    const heading = this.page.getByRole('heading', { level: 6, name: category, exact: true });
    await heading.first().scrollIntoViewIfNeeded();
    await heading.first().click();
    await this.page.waitForTimeout(300);

    const section = heading.first().locator('xpath=ancestor::div[3]');
    for (const labelText of labels) {
      const escaped = labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const label = section.locator('label.MuiFormControlLabel-root').filter({
        hasText: new RegExp(`^\\s*${escaped}\\s*$`),
      });
      await label.first().click();
    }
  }

  // ==========================================================================
  // Search / Filter / Reset
  // ==========================================================================

  // ค้นหาด้วยการพิมพ์ keyword แล้วคลิกปุ่ม Search (🔍 purple)
  // หมายเหตุ: ในระบบนี้ Enter ใน input ไม่ trigger search — ต้องคลิกปุ่ม Search submit
  async searchGroup(keyword: string): Promise<void> {
    await this.searchInput.click();
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(200);
    await this.searchSubmitButton.first().click();
    // รอ list refresh (debounce + server response)
    await this.page.waitForTimeout(1000);
  }

  // กรองตามสถานะ — คลิก dropdown แล้วเลือก option แล้วกด search button เพื่อ apply filter
  // หมายเหตุ: บาง build ของ app filter ทันทีเมื่อเลือก option, บาง build รอกด search
  //   วิธีนี้ปลอดภัยที่สุดคือเลือก option แล้วกด search button หลังเสมอ
  async filterByStatus(status: 'Active' | 'Inactive' | 'All'): Promise<void> {
    const t = getTranslations();
    const optMap: Record<typeof status, string> = {
      Active: t.activeOpt,
      Inactive: t.inactiveOpt,
      All: t.allOpt,
    };
    await this.statusDropdown.click();
    await this.page.getByRole('option', { name: optMap[status], exact: true }).click();
    await this.page.waitForTimeout(500);
    // กด search button เพื่อ apply filter (กันกรณีที่ select alone ไม่ trigger)
    await this.searchSubmitButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  // คลิกปุ่ม Reset (🔄) เพื่อเคลียร์ search + filter (status กลับเป็น Active)
  async clickReset(): Promise<void> {
    await this.resetButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  // ==========================================================================
  // Assertion helpers — Toast / Empty state / Rows
  // ==========================================================================

  // Verify toast หลังสร้าง Security Group สำเร็จ
  async expectCreateSuccessToast(): Promise<void> {
    const t = getTranslations();
    // มี 2 ระดับ: top-right "Created Successfully" และ snackbar ล่างขวา
    // อย่างน้อยหนึ่งใน 2 ต้องปรากฏ
    const topRight = this.page.getByText(t.createSuccessToastHeading, { exact: true });
    const snackbar = this.page.getByText(t.createSuccessSnackbar, { exact: true });
    await expect(topRight.or(snackbar).first()).toBeVisible({ timeout: 5000 });
  }

  // Verify toast หลัง Update สำเร็จ
  async expectUpdateSuccessToast(): Promise<void> {
    const t = getTranslations();
    const topRight = this.page.getByText(t.updateSuccessToastHeading, { exact: true });
    const snackbar = this.page.getByText(t.updateSuccessSnackbar, { exact: true });
    await expect(topRight.or(snackbar).first()).toBeVisible({ timeout: 5000 });
  }

  // Verify list แสดง empty state ("Data not found")
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyStateHeading).toBeVisible();
  }

  // Verify มี row ใน table ที่มี name ตามที่ระบุ
  async expectRowVisible(name: string): Promise<void> {
    await expect(this.tableBody.getByText(name, { exact: true })).toBeVisible();
  }

  // Verify ไม่มี row ใน table ที่มี name ตามที่ระบุ
  // ใช้ count() == 0 แทน toBeHidden เพราะ row อาจไม่เคย mount เลย
  async expectRowNotVisible(name: string): Promise<void> {
    await expect(this.tableBody.getByText(name, { exact: true })).toHaveCount(0);
  }

  // ==========================================================================
  // Assertion helpers — Drawer field values & permission counts
  // ==========================================================================

  // อ่านค่าทั้งหมดจาก Edit drawer ที่กำลังเปิดอยู่ — ใช้สำหรับ verify ว่าข้อมูลที่
  // pre-fill ตรงกับที่กรอกตอน Create
  async getDrawerSnapshot(): Promise<DrawerSnapshot> {
    const name = (await this.groupNameInput.inputValue()).trim();
    const homepage = (await this.homepageInput.innerText()).trim();
    const description = (await this.descriptionInput.inputValue()).trim();
    const isActive = await this.drawerActiveToggle.isChecked();

    // อ่าน permission counts ของทุก category — ดึงจาก section header
    // UI render เป็น: <h6>Alert</h6> ... <span>10/10</span> ภายใน same row
    const permissionCounts: Record<string, string> = {};
    const headings = this.page.getByRole('heading', { level: 6 });
    const count = await headings.count();
    for (let i = 0; i < count; i++) {
      const h = headings.nth(i);
      const text = (await h.innerText()).trim();
      if (!text) continue;
      // ดึง row ของ accordion header (ancestor div[2]) เพื่อหา count badge
      // count badge อยู่ขวาสุด pattern "X/Y"
      const row = h.locator('xpath=ancestor::div[2]');
      const rowText = await row.innerText().catch(() => '');
      const match = rowText.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        permissionCounts[text] = `${match[1]}/${match[2]}`;
      }
    }

    return { name, homepage, description, isActive, permissionCounts };
  }

  // อ่าน permission count ของ category เดียว เช่น "Alert" -> "10/10"
  async getPermissionCount(category: string): Promise<string> {
    const heading = this.page.getByRole('heading', { level: 6, name: category, exact: true });
    const row = heading.first().locator('xpath=ancestor::div[2]');
    const rowText = await row.innerText();
    const match = rowText.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) {
      throw new Error(`Permission count not found for category: ${category}`);
    }
    return `${match[1]}/${match[2]}`;
  }

  // Verify ว่า checkbox ของ label ใน category นั้นถูกติ๊กตามที่คาดหวัง
  // - expand category section ก่อนเช็ค
  async expectPermissionChecked(
    category: string,
    label: string,
    shouldBeChecked: boolean,
  ): Promise<void> {
    const heading = this.page.getByRole('heading', { level: 6, name: category, exact: true });
    await heading.first().scrollIntoViewIfNeeded();
    // expand section ถ้ายังไม่ expand (เช็คจาก visibility ของ first label)
    const section = heading.first().locator('xpath=ancestor::div[3]');
    const firstLabel = section.locator('label.MuiFormControlLabel-root').first();
    if (!(await firstLabel.isVisible().catch(() => false))) {
      await heading.first().click();
      await this.page.waitForTimeout(300);
    }

    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const targetLabel = section.locator('label.MuiFormControlLabel-root').filter({
      hasText: new RegExp(`^\\s*${escaped}\\s*$`),
    });
    const input = targetLabel.locator('input[type="checkbox"]');
    if (shouldBeChecked) {
      await expect(input).toBeChecked();
    } else {
      await expect(input).not.toBeChecked();
    }
  }
}