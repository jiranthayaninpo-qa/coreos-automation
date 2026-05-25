import { Page, Locator } from '@playwright/test';

// Page Object ของหน้า User Management — ใช้สำหรับสร้างผู้ใช้ใหม่ในระบบ
// เข้าใช้งานได้เฉพาะผู้ใช้สิทธิ์ Superadmin
export class UserManagementPage {
  readonly page: Page;
  readonly userManagementNavLink: Locator;
  readonly createNewUserButton: Locator;
  readonly usernameInput: Locator;
  readonly roleDropdown: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // TODO: replace with real CoreOS selectors
    this.userManagementNavLink = page.getByRole('link', { name: 'User Management' });   // ลิงก์เมนู User Management
    this.createNewUserButton = page.getByRole('button', { name: 'Create New User' });    // ปุ่มสร้างผู้ใช้ใหม่
    this.usernameInput = page.getByLabel('Username');                                    // ช่องกรอก username ของผู้ใช้ใหม่
    this.roleDropdown = page.getByLabel('Role');                                         // dropdown เลือก role
    this.submitButton = page.getByRole('button', { name: 'Save' });                      // ปุ่มบันทึก
  }

  // คลิกเมนู User Management เพื่อเข้าหน้าจัดการผู้ใช้
  async navigateToUserManagement(): Promise<void> {
    await this.userManagementNavLink.click();
  }

  // กดปุ่ม Create New User เพื่อเปิดฟอร์มสร้างผู้ใช้
  async clickCreateNewUser(): Promise<void> {
    await this.createNewUserButton.click();
  }

  // กรอกข้อมูลผู้ใช้ใหม่ลงในฟอร์มแล้วบันทึก
  async fillUserDetails(username: string, role: string): Promise<void> {
    await this.usernameInput.fill(username);     // กรอก username
    await this.roleDropdown.selectOption(role);  // เลือก role จาก dropdown
    await this.submitButton.click();             // กด Save เพื่อสร้าง user
  }
}
