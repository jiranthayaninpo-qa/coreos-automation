export type SupportedLang = 'en' | 'th';

export interface Translations {
  username: string;
  password: string;
  loginBtn: string;
  dropdownSelect: string;
  continueBtn: string;
}

export const translations: Record<SupportedLang, Translations> = {
  en: {
    username: 'Enter username',
    password: 'Enter password',
    loginBtn: 'Log in',
    dropdownSelect: 'Please select',
    continueBtn: 'Continue',
  },
  th: {
    username: 'กรอกชื่อผู้ใช้',
    password: 'กรอกรหัสผ่าน',
    loginBtn: 'เข้าสู่ระบบ',
    dropdownSelect: 'กรุณาเลือก',
    continueBtn: 'ดำเนินการต่อ',
  },
};

export function getTranslations(): Translations {
  const lang = (process.env.APP_LANG as SupportedLang) || 'en';
  return translations[lang] ?? translations.en;
}
