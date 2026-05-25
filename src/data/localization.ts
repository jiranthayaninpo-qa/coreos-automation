export type SupportedLang = 'en' | 'th';

export interface Translations {
  username: string;
  password: string;
  loginBtn: string;
  dropdownSelect: string;
  continueBtn: string;
  // ค่า default ของ Location / Security Group ที่ใช้ใน LocationSecurityPage
  // UI จะ render ค่าเหล่านี้ตามภาษาที่เลือก (เช่น 'MED' ภาษาอังกฤษ -> 'อายุรกรรม' ภาษาไทย)
  defaultLocation: string;
  defaultSecurityGroup: string;
}

export const translations: Record<SupportedLang, Translations> = {
  en: {
    username: 'Enter username',
    password: 'Enter password',
    loginBtn: 'Log in',
    dropdownSelect: 'Please select',
    continueBtn: 'Continue',
    defaultLocation: '1001 | MED',
    defaultSecurityGroup: 'Super Admin',
  },
  th: {
    username: 'กรอกชื่อผู้ใช้',
    password: 'กรอกรหัสผ่าน',
    loginBtn: 'เข้าสู่ระบบ',
    dropdownSelect: 'กรุณาเลือก',
    continueBtn: 'ดำเนินการต่อ',
    defaultLocation: '1001 | อายุรกรรม',
    defaultSecurityGroup: 'Super Admin',
  },
};

export function getTranslations(): Translations {
  const lang = (process.env.APP_LANG as SupportedLang) || 'en';
  return translations[lang] ?? translations.en;
}
