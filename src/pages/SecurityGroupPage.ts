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

    // 3) คลิก submenu User management (รอ submenu render เสร็จก่อน)
    await this.userMgmtSubMenu.waitFor({ state: 'visible' });
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
    await this.groupNameInput.fill(name);                                  // กรอกชื่อกลุ่ม
    await this.homepageInput.click();                                      // เปิด dropdown Homepage
    await this.page.getByRole('option', { name: homepage }).click();       // เลือก option ตามชื่อ
    if (description) {
      await this.descriptionInput.fill(description);                       // กรอก description ถ้ามี
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

  // คลิกปุ่ม Create/สร้าง
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }
}
