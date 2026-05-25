import { Page, Locator } from '@playwright/test';
import { getTranslations, SupportedLang } from '../data/localization';

// Page Object ของหน้า Login (หน้าจอแรกของระบบ CoreOS)
// รองรับหลายภาษาผ่าน APP_LANG (en / th) โดยอ่าน placeholder จาก dictionary
export class LoginPage {
  readonly page: Page;
  readonly engBtn: Locator;
  readonly thaiBtn: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // ดึง dictionary ตามภาษา (default 'en' ถ้าไม่ได้ตั้งค่า APP_LANG)
    const t = getTranslations();

    // ปุ่มสลับภาษาที่หน้า Login — เป็น <div> ที่ไม่มี role=button จึงหาจาก text ตรง ๆ
    // ข้อความ 'Eng' / 'Thai' เป็นค่าคงที่
    this.engBtn = page.getByText('Eng');
    this.thaiBtn = page.getByText('Thai');

    // หา input ของ username จาก placeholder text ในภาษาปัจจุบัน
    this.usernameInput = page.getByPlaceholder(t.username);
    // หา input ของ password จาก placeholder text ในภาษาปัจจุบัน
    this.passwordInput = page.getByPlaceholder(t.password);
    // หาปุ่ม Login จาก role=button + ชื่อปุ่มในภาษาปัจจุบัน
    this.signInButton = page.getByRole('button', { name: t.loginBtn });
  }

  // เปิดหน้าจอ Login โดย navigate ไปที่ BASE_URL ที่ตั้งไว้ใน .env
  // เสร็จแล้วกดสลับภาษาทันทีตาม APP_LANG เพื่อให้ placeholder/ปุ่ม render เป็นภาษาที่ตรงกับ dictionary
  async goto(): Promise<void> {
    await this.page.goto(process.env.BASE_URL!);
    await this.selectLanguage();
  }

  // คลิกปุ่มสลับภาษาที่หัวหน้า Login
  // - ถ้าส่ง lang มาจะใช้ค่านั้น; ถ้าไม่ส่งจะอ่านจาก process.env.APP_LANG (default 'en')
  // - 'th' -> คลิกปุ่ม Thai, อย่างอื่นทั้งหมด -> คลิกปุ่ม Eng
  async selectLanguage(lang?: SupportedLang | string): Promise<void> {
    const target = (lang || process.env.APP_LANG || 'en').toString().toLowerCase();
    if (target === 'th') {
      await this.thaiBtn.click();   // สลับ UI เป็นภาษาไทย
    } else {
      await this.engBtn.click();    // สลับ UI เป็นภาษาอังกฤษ
    }
  }

  // กรอก username / password ลงในฟอร์มแล้วกดปุ่ม Login เพื่อ submit
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);   // กรอก username ลงในช่อง
    await this.passwordInput.click();          // คลิกที่ช่อง password เพื่อ focus ก่อน
    await this.passwordInput.fill(password);   // กรอก password ลงในช่อง
    await this.signInButton.click();           // คลิกปุ่ม Login เพื่อ submit form
  }
}
