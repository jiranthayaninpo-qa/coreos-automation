import { Page, Locator } from '@playwright/test';

// Page Object ของหน้า Security Group — ใช้กำหนดสิทธิ์ (permissions) ให้แต่ละ role
export class SecurityGroupPage {
  readonly page: Page;
  readonly securityGroupNavLink: Locator;
  readonly roleSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    // TODO: replace with real CoreOS selectors
    this.securityGroupNavLink = page.getByRole('link', { name: 'Security Group' });   // ลิงก์เมนู Security Group
    this.roleSelector = page.getByLabel('Role');                                       // dropdown เลือก role ที่จะตั้งสิทธิ์
  }

  // คลิกเมนู Security Group เพื่อเข้าหน้ากำหนดสิทธิ์
  async navigateToSecurityGroup(): Promise<void> {
    await this.securityGroupNavLink.click();
  }

  // กำหนดสิทธิ์ให้กับ role ที่ระบุ โดยติ๊ก checkbox ของแต่ละ permission แล้วกดบันทึก
  async assignPermissions(role: string, permissions: string[]): Promise<void> {
    await this.roleSelector.selectOption(role);   // เลือก role ที่ต้องการกำหนดสิทธิ์
    for (const permission of permissions) {
      // ติ๊ก checkbox ของ permission ตามชื่อที่ส่งมา (เช่น 'view_patient')
      // TODO: confirm permission checkbox selector pattern in CoreOS UI
      await this.page.getByRole('checkbox', { name: permission }).check();
    }
    await this.page.getByRole('button', { name: 'Save' }).click();   // กดบันทึกการตั้งค่าสิทธิ์
  }
}
