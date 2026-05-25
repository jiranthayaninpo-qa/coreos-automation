import { Page, Locator } from '@playwright/test';
import { getTranslations } from '../data/localization';

// Page Object ของหน้าจอที่ 2 หลัง Login
// ผู้ใช้ต้องเลือก Location และ Security Group ก่อนถึงจะเข้าใช้งานระบบได้
// รองรับทั้ง 2 สถานะ:
//   - first-time: dropdown ยังว่าง ต้องคลิกเลือก
//   - returning user: ระบบ pre-fill ค่าล่าสุดให้แล้ว ถ้าตรงกับที่ต้องการก็ข้ามได้เลย
export class LocationSecurityPage {
  readonly page: Page;
  readonly locationCombobox: Locator;
  readonly securityGroupCombobox: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // ดึง dictionary ตามภาษา (default 'en' ถ้าไม่ได้ตั้งค่า APP_LANG)
    const t = getTranslations();

    // ใช้ DOM id ของ MUI Select เป็น locator — id คงที่ทั้งใน first-time/pre-filled
    this.locationCombobox = page.locator('#location');
    this.securityGroupCombobox = page.locator('#security-group');

    // ปุ่ม Continue ยังคงอิงจาก dictionary ตามภาษาปัจจุบัน
    this.continueButton = page.getByRole('button', { name: t.continueBtn });
  }

  // เช็คว่า combobox มีค่าที่เลือกอยู่แล้วตรงกับค่าที่ต้องการหรือไม่
  // MUI Select เก็บข้อความที่แสดงไว้ใน innerText ของ <div role="combobox">
  private async isAlreadySelected(combobox: Locator, expected: string): Promise<boolean> {
    const current = (await combobox.innerText()).trim();
    return current === expected;
  }

  // เปิด dropdown แล้วคลิกเลือก option ตามชื่อที่ส่งมา
  // MUI render options ผ่าน portal (#portal-root) แต่ getByRole('option') หาเจอทั่วทั้ง page
  private async pickOption(combobox: Locator, optionName: string): Promise<void> {
    await combobox.click();                                              // เปิด dropdown
    await this.page.getByRole('option', { name: optionName }).click();   // เลือก option ตามชื่อ
  }

  // เลือก Location และ Security Group แล้วกด Continue เพื่อเข้าสู่ระบบ
  // ถ้าค่าที่ระบบ pre-fill ไว้ตรงกับที่ต้องการอยู่แล้ว จะข้ามขั้นตอนการเลือกไปเลย
  // (ตามที่ตกลง: returning user ที่ context ตรง = กด Continue เลย ไม่ต้องเปิด dropdown ใหม่)
  // ถ้าไม่ส่ง argument จะใช้ค่า default จาก dictionary ตาม APP_LANG ปัจจุบัน
  // เช่น APP_LANG=en -> '1001 | MED', APP_LANG=th -> '1001 | อายุรกรรม'
  async selectContext(
    locationName?: string,
    securityGroupName?: string,
  ): Promise<void> {
    // ดึง default ตามภาษาปัจจุบันถ้าผู้เรียกไม่ได้ระบุค่ามาเอง
    const t = getTranslations();
    const loc = locationName ?? t.defaultLocation;
    const sg = securityGroupName ?? t.defaultSecurityGroup;

    // Location: เลือกใหม่เฉพาะเมื่อค่าปัจจุบันไม่ตรงกับที่ต้องการ
    if (!(await this.isAlreadySelected(this.locationCombobox, loc))) {
      await this.pickOption(this.locationCombobox, loc);
    }

    // Security Group: เลือกใหม่เฉพาะเมื่อค่าปัจจุบันไม่ตรงกับที่ต้องการ
    if (!(await this.isAlreadySelected(this.securityGroupCombobox, sg))) {
      await this.pickOption(this.securityGroupCombobox, sg);
    }

    await this.continueButton.click();   // กด Continue เพื่อยืนยัน context
  }
}
