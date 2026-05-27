import { Page, Locator } from '@playwright/test';
import { getTranslations } from '../data/localization';

// Page Object สำหรับ flow สร้าง Security Group
// Sidebar -> Setup -> User management -> Security Group card -> + Create -> กรอก drawer -> Create
// รองรับทั้งภาษา en / th ผ่าน dictionary ใน localization.ts
export class SecurityGroupPage {
  readonly page: Page;
  readonly setupMenu: Locator;
  readonly userMgmtSubMenu: Locator;
  readonly securityGroupCard: Locator;
  readonly createButton: Locator;
  readonly groupNameInput: Locator;
  readonly homepageInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;
  readonly searchInput: Locator;
  readonly updateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const t = getTranslations();

    // Sidebar items render เป็น <button> ที่มี aria-label ตามชื่อเมนู แม้ตอน sidebar collapse
    // (text span ภายในจะถูกซ่อนตอน collapsed แต่ accessible name ของ button ยังคงอยู่)
    // ใช้ role=button + name เพื่อให้ทำงานได้ทั้งสถานะ collapsed / expanded
    this.setupMenu = page.getByRole('button', { name: t.setupMenu, exact: true });
    this.userMgmtSubMenu = page.getByRole('button', { name: t.userMgmtSubMenu, exact: true });

    // การ์ดในหน้า User management — มีหลายการ์ด ใช้ exact text match
    this.securityGroupCard = page.getByText(t.securityGroupCard, { exact: true });

    // ปุ่ม + Create / + สร้าง บนหน้า list ของ Security Group
    this.createButton = page.getByRole('button', { name: t.createBtn });

    // ช่องในฟอร์ม drawer — placeholder ตามภาษา
    this.groupNameInput = page.getByPlaceholder(t.groupNamePlaceholder);
    // Homepage เป็น MUI Select (combobox) ไม่ใช่ input — match จาก text ที่แสดงบน trigger
    // ใช้ role=combobox + filter ด้วย hasText เพื่อกันชนกับ combobox อื่นใน drawer (Status, paging)
    this.homepageInput = page
      .getByRole('combobox')
      .filter({ hasText: t.homepagePlaceholder });
    this.descriptionInput = page.getByPlaceholder(t.descriptionPlaceholder);

    // ปุ่ม Create / สร้าง ปุ่มสุดท้ายใน drawer (submit form)
    this.submitButton = page.getByRole('button', { name: t.submitGroupBtn, exact: true });

    // ช่องค้นหาในหน้า list ของ Security Group — ใช้ placeholder text ตามภาษา
    this.searchInput = page.getByPlaceholder(t.searchPlaceholder);
    // ปุ่ม Update / บันทึก ใน drawer edit (คนละปุ่มกับ submitButton ของ create)
    this.updateButton = page.getByRole('button', { name: t.updateBtn, exact: true });
  }

  // นำทางจาก Register Landing -> หน้า list ของ Security Group
  // Sidebar ถูก collapse แบบ rail (เห็นแค่ icon) ตอน default — text 'Setup' ถูกซ่อน
  // แต่ button มี accessible name อยู่ จึงสามารถคลิกได้แม้ยัง collapsed
  // ถึงยังงั้น เปิด drawer ด้วยปุ่ม 'open drawer' ก่อนเพื่อให้ submenu/labels visible สำหรับ user mgmt
  async MapsToSecurityGroup(): Promise<void> {
    // 1) คลิกปุ่ม hamburger 'open drawer' ใน header banner เพื่อกาง sidebar
    const openDrawerBtn = this.page.getByRole('button', { name: 'open drawer' });
    if (await openDrawerBtn.isVisible().catch(() => false)) {
      await openDrawerBtn.click();
      // รอ animation expand เสร็จก่อนค่อย interact
      await this.page.waitForTimeout(500);
    }

    // 2) คลิกเมนู Setup (button มี accessible name แม้ตอน collapsed)
    await this.setupMenu.click();

    // 3) คลิก submenu User management
    //    รอ animation expand ของ MUI Collapse (~225ms) ให้เสร็จก่อนค่อยคลิก
    //    มิเช่นนั้น React จะยัง re-render submenu อยู่ตอนคลิก ทำให้ดูเหมือนคลิกหลายครั้ง
    await this.userMgmtSubMenu.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(300);
    await this.userMgmtSubMenu.click();

    // 4) คลิกการ์ด Security Group เพื่อเข้าหน้า list (รอหน้า card render เสร็จก่อน)
    // หลังคลิก User management หน้า list ของ Security Group จะมีหัวข้อ 'Security Group' อยู่หลายที่
    // (breadcrumb / main heading) — รอจน element แรกที่ตรงปรากฏก่อนค่อยคลิกการ์ด
    await this.securityGroupCard.first().waitFor({ state: 'visible' });
    await this.securityGroupCard.first().click();
  }

  // คลิกปุ่ม + Create / + สร้าง เพื่อเปิด drawer สร้าง group ใหม่
  async clickCreateNewGroup(): Promise<void> {
    await this.createButton.click();
    // รอ drawer mount + animation เสร็จ ก่อนค่อยให้ caller เริ่มกรอกฟอร์ม
    await this.groupNameInput.waitFor({ state: 'visible' });
  }

  // กรอกข้อมูลใน drawer: ชื่อกลุ่ม, Homepage (dropdown), Description
  // - name: ชื่อ Security Group ที่จะตั้ง
  // - homepage: ชื่อ option ใน dropdown Homepage (ต้องตรงกับที่ render ในภาษาปัจจุบัน)
  // - description: ข้อความใน textarea (optional แต่ method นี้รับมาเสมอ — ถ้าไม่อยากกรอกส่ง '' ได้)
  async fillGroupDetails(name: string, homepage: string, description: string): Promise<void> {
    await this.groupNameInput.fill(name);                                  // กรอกชื่อกลุ่ม (fill เคลียร์ค่าเดิมก่อน)
    await this.selectHomepage(homepage);                                   // เลือก Homepage (รองรับทั้ง create / edit drawer)
    if (description) {
      await this.descriptionInput.fill(description);                       // กรอก description ถ้ามี
    }
  }

  // เลือก option ใน Homepage dropdown — ทำงานได้ทั้งใน create drawer (combobox แสดง placeholder)
  // และ edit drawer (combobox แสดงค่า homepage เดิมของ group)
  // วิธี: scope ไป drawer scope (drawer ที่มี groupNameInput) แล้วหา MuiSelect-select ตัวแรกใน drawer นั้น
  async selectHomepage(option: string): Promise<void> {
    const drawer = this.page
      .locator('.MuiDrawer-root, [role="dialog"]')
      .filter({ has: this.groupNameInput });
    await drawer.locator('.MuiSelect-select').first().click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
  }

  // เปิด/Toggle label ของ permission ในหมวด category ที่ระบุ
  // - category: ชื่อ h6 heading ของหมวด (เช่น 'Alert')
  // - labels: ชื่อ label ของ checkbox ที่จะ toggle (เช่น ['Manage Clinical', 'View Clinical'])
  // method นี้ idempotent ไม่ได้ — แค่คลิก label พลิกสถานะตามจังหวะปัจจุบัน
  //   ใช้สำหรับเทสที่ต้องการ "uncheck แล้ว revert ภายหลัง" คู่กัน
  async togglePermissionLabels(category: string, labels: string[]): Promise<void> {
    const heading = this.page.getByRole('heading', { level: 6, name: category, exact: true });
    await heading.first().scrollIntoViewIfNeeded();
    // คลิก h6 เพื่อ expand MuiCollapse (เริ่ม collapsed) แล้วรอ animation
    await heading.first().click();
    await this.page.waitForTimeout(300);

    const section = heading.first().locator('xpath=ancestor::div[3]');
    for (const labelText of labels) {
      // match label ที่ตัวมันเอง contain text — ระวังว่ามี label อื่นที่ contain เป็น substring เช่น
      // "Manage Notify All" อาจชนกับ "Manage Notify" — ใช้ exact match ผ่าน regex
      // อนุญาต whitespace ต้น/ท้าย (เพราะ UI บางตัวมี trailing space เช่น "Manage Clinical ")
      const escaped = labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const label = section.locator('label.MuiFormControlLabel-root').filter({
        hasText: new RegExp(`^\\s*${escaped}\\s*$`),
      });
      await label.first().click();
    }
  }

  // ติ๊ก permission ทุก checkbox ของแต่ละ category ที่ระบุ
  // - categories: ชื่อหัว section permission (เช่น ['Alert', 'Appointment', 'EMR'])
  //
  // UI จริงเป็น collapsible sections (ใช้ MuiCollapse — default collapse อยู่ ความสูง 0)
  // h6 heading ของแต่ละ category มี cursor:pointer และทำหน้าที่เป็นปุ่ม toggle
  // วิธี: คลิก h6 เพื่อขยาย -> รอ animation -> หา section container (ancestor div[3]) ->
  //       ติ๊ก checkbox ทุกตัว (Manage/View ของทุก permission ในหมวด)
  //
  // หมายเหตุเรื่อง MUI Checkbox: <input> ถูก style opacity:0 ทำให้ Playwright ไม่ยอม .click()
  //   เพราะ visibility heuristic — ต้องใช้ .check() บน input โดยตรง (Playwright รู้ว่าเป็น checkbox)
  //   หรือใช้ { force: true } ก็ได้ หลังจาก collapse ขยายแล้ว .check() จะผ่าน
  async selectPermissions(categories: string[]): Promise<void> {
    for (const category of categories) {
      // หา <h6> ที่มี text ตรงกับ category (ใช้ exact เพื่อกัน match "Appointment" ชน "Appointment Setup")
      const heading = this.page.getByRole('heading', { level: 6, name: category, exact: true });
      await heading.first().scrollIntoViewIfNeeded();

      // คลิก h6 เพื่อ toggle expand (default collapse อยู่)
      await heading.first().click();

      // section container = great-grandparent ของ h6 (มี ~10 checkboxes ต่อ category)
      const section = heading.first().locator('xpath=ancestor::div[3]');

      // รอจน MuiCollapse คลายจาก hidden state แล้ว label visible เพื่อคลิกได้
      const labels = section.locator('label.MuiFormControlLabel-root');
      await labels.first().waitFor({ state: 'visible' });

      // คลิกที่ <label> แทนการ force-click <input> โดยตรง
      // เหตุผล: input ของ MUI Checkbox มี opacity:0 — Playwright .check({force}) คลิกได้
      //   แต่บางครั้ง React controlled state ไม่ update (event ไม่ fire ถูก path)
      //   browser propagation จาก label -> input เป็น native + ทริก change event ของ MUI ครบ
      const labelCount = await labels.count();
      for (let i = 0; i < labelCount; i++) {
        const lbl = labels.nth(i);
        // เช็คว่า input ภายใน label นี้ checked อยู่หรือยัง — ถ้า checked อยู่แล้วการคลิกจะ uncheck
        const input = lbl.locator('input[type="checkbox"]');
        if (!(await input.isChecked())) {
          await lbl.click();
        }
      }
    }
  }

  // ติ๊ก permission ทุก checkbox ของทุก category ใน drawer (auto-discover ทุก h6)
  // ใช้สำหรับกรณีที่ต้องการให้ Security Group ใหม่ได้สิทธิ์ครบทั้งระบบ
  // วิธี filter: เก็บเฉพาะ h6 ที่ ancestor::div[3] เป็น "section container ของ category เดียว"
  //   เงื่อนไข: มี checkbox >= 1 ตัว AND มี h6 อยู่เพียง 1 ตัว (ตัวมันเอง)
  //   - ตัวที่ไม่ผ่าน เช่น h6 "Security Group" (title ของ drawer) ที่ ancestor::div[3]
  //     ครอบ scope ทั้ง drawer จะมีหลาย h6 ภายใน -> ตกออก
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
      if (cbCount > 0 && h6Count === 1) categories.push(name);
    }

    await this.selectPermissions(categories);
  }

  // คลิกปุ่ม Create/สร้าง — รอให้ drawer ปิดและ list refresh ก่อน return
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
    // รอให้ drawer ปิด (groupNameInput หาย) และ server บันทึก + list re-fetch
    await this.groupNameInput.waitFor({ state: 'hidden' }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  // ค้นหา group ในหน้า list — กรอกชื่อในช่อง Search แล้วกด Enter
  // เพิ่ม wait หลัง fill ก่อนกด Enter เพราะ UI debounce keystrokes
  // และรอ list update หลังกด Enter
  async searchGroup(name: string): Promise<void> {
    await this.searchInput.click();
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(300);
    await this.searchInput.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  // กรอง list ตามสถานะ Active/Inactive/All — คลิก dropdown Status แล้วเลือก option
  // UI render เป็น MUI Select (combobox) ที่แสดง text ของ option ปัจจุบัน
  // ใช้ regex filter จับ combobox ที่มี text เป็นหนึ่งในตัวเลือก เพื่อกันชนกับ combobox อื่น (Homepage, paging)
  async filterByStatus(status: 'Active' | 'Inactive' | 'All'): Promise<void> {
    const t = getTranslations();
    const optMap: Record<typeof status, string> = {
      Active: t.activeOpt,
      Inactive: t.inactiveOpt,
      All: t.allOpt,
    };
    // status combobox = combobox ที่ text ปัจจุบันเท่ากับ Active/Inactive/All ภาษาที่ตั้งไว้
    const statusCombo = this.page
      .getByRole('combobox')
      .filter({ hasText: new RegExp(`^(${t.activeOpt}|${t.inactiveOpt}|${t.allOpt})$`) })
      .first();
    await statusCombo.click();
    await this.page.getByRole('option', { name: optMap[status], exact: true }).click();
    // รอ list update ตาม filter ใหม่ก่อน return
    await this.page.waitForTimeout(500);
  }

  // เปิด drawer edit ของ row ที่มีชื่อ group ตามที่ระบุ
  // UI ของ app นี้: คลิก name cell ของ row เพื่อเปิด drawer edit ทันที
  //   (ปุ่ม action ใน column สุดท้ายเป็น kebab menu สำหรับ View Users / Copy เท่านั้น — ไม่มี Edit)
  async clickEditRow(groupName: string): Promise<void> {
    const row = this.page.locator('tr').filter({ hasText: groupName });
    // คลิก cell ลำดับที่ 2 (Name column) เพื่อเปิด edit drawer
    await row.locator('td').nth(1).click();
    // รอ drawer edit เปิดและ field ชื่อ visible (พร้อมให้ caller แก้ค่าได้)
    await this.groupNameInput.waitFor({ state: 'visible' });
  }

  // เปลี่ยนสถานะ active/inactive ของ group ผ่าน toggle switch ที่หัว drawer edit
  // MUI Switch render เป็น input[type=checkbox] role=switch โดยมี wrapper .MuiSwitch-root
  // - isActive=true  -> ให้ switch เป็น checked
  // - isActive=false -> ให้ switch เป็น unchecked
  async toggleGroupStatus(isActive: boolean): Promise<void> {
    // หา switch อันแรกใน drawer edit (status switch อยู่ที่หัว drawer ก่อนทุก permission)
    const statusSwitch = this.page.locator('input[type="checkbox"][role="switch"]').first();
    const current = await statusSwitch.isChecked();
    if (current !== isActive) {
      // คลิกผ่าน wrapper ของ MUI Switch เพราะ input มี opacity:0 (เหมือน checkbox)
      const wrapper = statusSwitch.locator('xpath=ancestor::span[contains(@class,"MuiSwitch-root")][1]');
      await wrapper.click();
    }
  }

  // คลิกปุ่ม Update/บันทึก ใน drawer edit เพื่อ save การแก้ไข
  async clickUpdate(): Promise<void> {
    await this.updateButton.click();
    // รอให้ drawer ปิดและ list refresh
    await this.groupNameInput.waitFor({ state: 'hidden' }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }
}
