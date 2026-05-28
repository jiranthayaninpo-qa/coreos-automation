export type SupportedLang = 'en' | 'th';

export interface Translations {
  // ======================== Login screen ========================
  username: string;
  password: string;
  loginBtn: string;
  dropdownSelect: string;
  continueBtn: string;
  // ค่า default ของ Location / Security Group ที่ใช้ใน LocationSecurityPage
  defaultLocation: string;
  defaultSecurityGroup: string;

  // ======================== Registration landing ========================
  patientsHeading: string;
  addNewPatientBtn: string;

  // ======================== Sidebar Setup -> User management ========================
  setupMenu: string;
  userMgmtSubMenu: string;
  securityGroupCard: string;

  // ======================== Security Group list page ========================
  createBtn: string;
  searchPlaceholder: string;
  searchLabel: string;          // label "Search" ที่หัวช่องค้นหา
  statusLabel: string;          // label "Status" ที่หัว dropdown
  activeOpt: string;
  inactiveOpt: string;
  allOpt: string;
  resetTooltip: string;         // tooltip ของปุ่ม Reset (🔄)
  searchTooltip: string;        // tooltip ของปุ่ม Search (🔍 ที่กดเพื่อ submit)
  exportDataBtn: string;
  importDataBtn: string;
  historyLogBtn: string;
  // empty state เมื่อ filter/search ไม่เจอข้อมูล
  emptyStateHeading: string;
  emptyStateSubtext: string;
  // Toast notifications หลังสร้าง/แก้ไข
  createSuccessToastHeading: string;   // "Created Successfully"
  createSuccessToastBody: string;      // "A new record has been added."
  updateSuccessToastHeading: string;   // "Updated Successfully"
  updateSuccessToastBody: string;      // "Your changes have been saved."
  createSuccessSnackbar: string;       // "Security Group created successfully!"
  updateSuccessSnackbar: string;       // "Security Group updated successfully!"
  // Table headers
  tableColNo: string;
  tableColName: string;
  tableColUser: string;
  tableColAccessProfile: string;
  tableColStatus: string;
  tableColAction: string;

  // ======================== Create/Edit drawer ========================
  createDrawerTitle: string;            // "Security Group" (header ตอน Create)
  editDrawerTitle: string;              // "Edit Security Group" (header ตอน Edit)
  activeToggleLabel: string;            // "Active" ข้าง toggle switch หัว drawer
  // Section headers ใน drawer
  informationSection: string;
  permissionsSection: string;
  privilegeSection: string;
  accessProfileSection: string;
  // Form fields
  groupNameLabel: string;               // "Security Group Name *"
  groupNamePlaceholder: string;
  homepageLabel: string;
  homepagePlaceholder: string;
  descriptionLabel: string;             // "Description (optional)"
  descriptionPlaceholder: string;
  permissionSearchPlaceholder: string;  // "Search Permission"
  accessProfileSearchPlaceholder: string; // "Search Access Profile"
  addAccessProfileBtn: string;          // "+ Add"
  // Action buttons ใน drawer
  submitGroupBtn: string;               // "Create"
  updateBtn: string;                    // "Update"
  cancelBtn: string;                    // "Cancel"
  // Kebab menu items ใน row
  editMenuItem: string;
  viewUsersMenuItem: string;
  copyMenuItem: string;

  // ======================== Homepage dropdown options ========================
  homepageSearchPatient: string;
  homepageOPDNurseWorklist: string;
  homepageOPDDoctorWorklist: string;
  homepageAppointmentCalendar: string;

  // ======================== Permission category names ========================
  // (h6 headings ใน Permissions section — ภาษาขึ้นกับ APP_LANG)
  catAlert: string;
  catAppointment: string;
  catBillingCashier: string;
  catConfiguration: string;
  catCPOE: string;
  catEMR: string;
  catLaboratory: string;
  catOPDSSOClaim: string;
  catOPD: string;
  catPharmacy: string;
  catRegistration: string;
  catReport: string;
  catSetup: string;
}

export const translations: Record<SupportedLang, Translations> = {
  en: {
    // Login
    username: 'Enter username',
    password: 'Enter password',
    loginBtn: 'Log in',
    dropdownSelect: 'Please select',
    continueBtn: 'Continue',
    defaultLocation: '1001 | MED',
    defaultSecurityGroup: 'Super Admin',
    // Registration landing
    patientsHeading: 'Patients',
    addNewPatientBtn: 'Add New',
    // Sidebar
    setupMenu: 'Setup',
    userMgmtSubMenu: 'User management',
    securityGroupCard: 'Security Group',
    // Security Group list
    createBtn: '+ Create',
    searchPlaceholder: 'Search by Name',
    searchLabel: 'Search',
    statusLabel: 'Status',
    activeOpt: 'Active',
    inactiveOpt: 'Inactive',
    allOpt: 'All',
    resetTooltip: 'Reset',
    searchTooltip: 'Search',
    exportDataBtn: 'Export Data',
    importDataBtn: 'Import Data',
    historyLogBtn: 'History Log',
    emptyStateHeading: 'Data not found',
    emptyStateSubtext: 'Try adjusting your search or filters',
    // Toasts
    createSuccessToastHeading: 'Created Successfully',
    createSuccessToastBody: 'A new record has been added.',
    updateSuccessToastHeading: 'Updated Successfully',
    updateSuccessToastBody: 'Your changes have been saved.',
    createSuccessSnackbar: 'Security Group created successfully!',
    updateSuccessSnackbar: 'Security Group updated successfully!',
    // Table
    tableColNo: 'No.',
    tableColName: 'Name',
    tableColUser: 'User',
    tableColAccessProfile: 'Access Profile',
    tableColStatus: 'Status',
    tableColAction: 'Action',
    // Drawer
    createDrawerTitle: 'Security Group',
    editDrawerTitle: 'Edit Security Group',
    activeToggleLabel: 'Active',
    informationSection: 'Information',
    permissionsSection: 'Permissions',
    privilegeSection: 'Privilege',
    accessProfileSection: 'Access Profile',
    groupNameLabel: 'Security Group Name',
    groupNamePlaceholder: 'Enter Security Group Name',
    homepageLabel: 'Homepage',
    homepagePlaceholder: 'Select Homepage',
    descriptionLabel: 'Description (optional)',
    descriptionPlaceholder: 'Enter Description',
    permissionSearchPlaceholder: 'Search Permission',
    accessProfileSearchPlaceholder: 'Search Access Profile',
    addAccessProfileBtn: '+ Add',
    submitGroupBtn: 'Create',
    updateBtn: 'Update',
    cancelBtn: 'Cancel',
    editMenuItem: 'Edit',
    viewUsersMenuItem: 'View Users',
    copyMenuItem: 'Copy',
    // Homepage options
    homepageSearchPatient: 'Search Patient',
    homepageOPDNurseWorklist: 'OPD Nurse Worklist',
    homepageOPDDoctorWorklist: 'OPD Doctor Worklist',
    homepageAppointmentCalendar: 'Appointment Calendar',
    // Permission categories
    catAlert: 'Alert',
    catAppointment: 'Appointment',
    catBillingCashier: 'Billing & Cashier',
    catConfiguration: 'Configuration',
    catCPOE: 'CPOE',
    catEMR: 'EMR',
    catLaboratory: 'Laboratory',
    catOPDSSOClaim: 'OPD SSO Claim',
    catOPD: 'OPD',
    catPharmacy: 'Pharmacy',
    catRegistration: 'Registration',
    catReport: 'Report',
    catSetup: 'Setup',
  },
  th: {
    // Login
    username: 'กรอกชื่อผู้ใช้',
    password: 'กรอกรหัสผ่าน',
    loginBtn: 'เข้าสู่ระบบ',
    dropdownSelect: 'กรุณาเลือก',
    continueBtn: 'ดำเนินการต่อ',
    defaultLocation: '1001 | อายุรกรรม',
    defaultSecurityGroup: 'Super Admin',
    // Registration landing
    patientsHeading: 'ผู้ป่วย',
    addNewPatientBtn: 'เพิ่มผู้ป่วยใหม่',
    // Sidebar
    setupMenu: 'Setup',
    userMgmtSubMenu: 'User management',
    securityGroupCard: 'Security Group',
    // Security Group list
    createBtn: '+ สร้าง',
    searchPlaceholder: 'ค้นหาตามชื่อ',
    searchLabel: 'ค้นหา',
    statusLabel: 'สถานะ',
    activeOpt: 'ใช้งาน',
    inactiveOpt: 'ไม่ใช้งาน',
    allOpt: 'ทั้งหมด',
    resetTooltip: 'รีเซ็ต',
    searchTooltip: 'ค้นหา',
    exportDataBtn: 'ส่งออกข้อมูล',
    importDataBtn: 'นำเข้าข้อมูล',
    historyLogBtn: 'ประวัติ',
    emptyStateHeading: 'ไม่พบข้อมูล',
    emptyStateSubtext: 'ลองปรับการค้นหาหรือการกรองข้อมูล',
    // Toasts
    createSuccessToastHeading: 'สร้างสำเร็จ',
    createSuccessToastBody: 'เพิ่มรายการใหม่เรียบร้อย',
    updateSuccessToastHeading: 'อัปเดตสำเร็จ',
    updateSuccessToastBody: 'บันทึกการเปลี่ยนแปลงเรียบร้อย',
    createSuccessSnackbar: 'สร้าง Security Group สำเร็จ!',
    updateSuccessSnackbar: 'อัปเดต Security Group สำเร็จ!',
    // Table
    tableColNo: 'ลำดับ',
    tableColName: 'ชื่อ',
    tableColUser: 'ผู้ใช้',
    tableColAccessProfile: 'Access Profile',
    tableColStatus: 'สถานะ',
    tableColAction: 'การจัดการ',
    // Drawer
    createDrawerTitle: 'Security Group',
    editDrawerTitle: 'แก้ไข Security Group',
    activeToggleLabel: 'ใช้งาน',
    informationSection: 'ข้อมูล',
    permissionsSection: 'สิทธิ์',
    privilegeSection: 'สิทธิพิเศษ',
    accessProfileSection: 'Access Profile',
    groupNameLabel: 'ชื่อสิทธิ์การเข้าถึง',
    groupNamePlaceholder: 'กรอกชื่อสิทธิ์การเข้าถึง',
    homepageLabel: 'หน้าแรก',
    homepagePlaceholder: 'เลือกหน้าแรก',
    descriptionLabel: 'คำอธิบาย (ไม่บังคับ)',
    descriptionPlaceholder: 'กรอกคำอธิบาย',
    permissionSearchPlaceholder: 'ค้นหาสิทธิ์',
    accessProfileSearchPlaceholder: 'ค้นหา Access Profile',
    addAccessProfileBtn: '+ เพิ่ม',
    submitGroupBtn: 'สร้าง',
    updateBtn: 'อัปเดต',
    cancelBtn: 'ยกเลิก',
    editMenuItem: 'แก้ไข',
    viewUsersMenuItem: 'ดูผู้ใช้',
    copyMenuItem: 'คัดลอก',
    // Homepage options
    homepageSearchPatient: 'ค้นหาผู้ป่วย',
    homepageOPDNurseWorklist: 'เวิร์กลิสต์พยาบาลผู้ป่วยนอก',
    homepageOPDDoctorWorklist: 'เวิร์กลิสต์แพทย์ผู้ป่วยนอก',
    homepageAppointmentCalendar: 'ปฏิทินนัดหมาย',
    // Permission categories
    catAlert: 'การแจ้งเตือน',
    catAppointment: 'นัดหมาย',
    catBillingCashier: 'การเงิน',
    catConfiguration: 'การกำหนดค่า',
    catCPOE: 'CPOE',
    catEMR: 'EMR',
    catLaboratory: 'ห้องปฏิบัติการ',
    catOPDSSOClaim: 'OPD SSO Claim',
    catOPD: 'OPD',
    catPharmacy: 'เภสัชกรรม',
    catRegistration: 'ทะเบียนผู้ป่วย',
    catReport: 'รายงาน',
    catSetup: 'ตั้งค่า',
  },
};

export function getTranslations(): Translations {
  const lang = (process.env.APP_LANG as SupportedLang) || 'en';
  return translations[lang] ?? translations.en;
}