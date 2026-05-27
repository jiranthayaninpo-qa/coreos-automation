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
  // คำในหน้า Registration landing (หน้าหลัง Continue) — ใช้ assert ว่าเข้าสู่ระบบสำเร็จ
  patientsHeading: string;
  addNewPatientBtn: string;
  // คำใน flow Setup -> User management -> Security Group
  setupMenu: string;
  userMgmtSubMenu: string;
  securityGroupCard: string;
  createBtn: string;
  groupNamePlaceholder: string;
  homepagePlaceholder: string;
  descriptionPlaceholder: string;
  submitGroupBtn: string;
  // หน้า list ของ Security Group: ช่อง search, dropdown Status, ปุ่ม Update ใน drawer edit
  searchPlaceholder: string;
  statusLabel: string;
  activeOpt: string;
  inactiveOpt: string;
  allOpt: string;
  updateBtn: string;
  // เมนูตัวเลือกของ Action button ใน row (กดแล้วเปิด popover menu)
  editMenuItem: string;
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
    patientsHeading: 'Patients',
    addNewPatientBtn: 'Add New',
    setupMenu: 'Setup',
    userMgmtSubMenu: 'User management',
    securityGroupCard: 'Security Group',
    createBtn: '+ Create',
    // placeholders / dropdown trigger text ตาม UI จริงของ create drawer
    groupNamePlaceholder: 'Enter Security Group Name',
    homepagePlaceholder: 'Select Homepage',
    descriptionPlaceholder: 'Enter Description',
    submitGroupBtn: 'Create',
    searchPlaceholder: 'Search by Name',
    statusLabel: 'Status',
    activeOpt: 'Active',
    inactiveOpt: 'Inactive',
    allOpt: 'All',
    updateBtn: 'Update',
    editMenuItem: 'Edit',
  },
  th: {
    username: 'กรอกชื่อผู้ใช้',
    password: 'กรอกรหัสผ่าน',
    loginBtn: 'เข้าสู่ระบบ',
    dropdownSelect: 'กรุณาเลือก',
    continueBtn: 'ดำเนินการต่อ',
    defaultLocation: '1001 | อายุรกรรม',
    defaultSecurityGroup: 'Super Admin',
    patientsHeading: 'ผู้ป่วย',
    addNewPatientBtn: 'เพิ่มผู้ป่วยใหม่',
    setupMenu: 'Setup',
    userMgmtSubMenu: 'User management',
    securityGroupCard: 'Security Group',
    createBtn: '+ สร้าง',
    // placeholders / dropdown trigger text ภาษาไทย (verify จาก UI จริงด้วย diag)
    groupNamePlaceholder: 'กรอกชื่อสิทธิ์การเข้าถึง',
    homepagePlaceholder: 'เลือกหน้าแรก',
    descriptionPlaceholder: 'กรอกคำอธิบาย',
    submitGroupBtn: 'สร้าง',
    searchPlaceholder: 'ค้นหาตามชื่อ',
    statusLabel: 'สถานะ',
    activeOpt: 'ใช้งาน',
    inactiveOpt: 'ไม่ใช้งาน',
    allOpt: 'ทั้งหมด',
    updateBtn: 'อัปเดต',
    editMenuItem: 'แก้ไข',
  },
};

export function getTranslations(): Translations {
  const lang = (process.env.APP_LANG as SupportedLang) || 'en';
  return translations[lang] ?? translations.en;
}
