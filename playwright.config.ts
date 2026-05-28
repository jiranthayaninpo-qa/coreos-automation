import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src/tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global per-test timeout = 120s — งบรวมของ test 1 ตัว ห้าม override per-test
     (action/expect ที่ 10s ต้องการ test budget เหลือพอ — 120s รองรับ flow ที่ยาวสุด:
      CRUD + revert ของ Security Group ที่ทำ selectAllPermissions = ~156 checkbox × 2 + navigation
      ก่อนหน้านี้ใช้ ~60s ติด boundary และ flake บ่อย) */
  timeout: 120000,
  /* expect() default timeout = 10s ต่อ assertion */
  expect: { timeout: 10000 },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Per-action / navigation timeout = 10s */
    actionTimeout: 10000,
    navigationTimeout: 10000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* ตอนนี้รันแค่ Chrome (chromium) — viewport override เป็น 1920x1080
   * (ทุก spec จะรันใน project เดียวกัน, parallel ตาม fullyParallel:true ด้านบน) */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },

    // ⚠️ ปิดไว้ก่อน: setup project แบบ sequential ด้วย dependencies
    //    กลับมาเปิดเมื่อต้องการบังคับลำดับ login → seed:
    // {
    //   name: '1-login',
    //   testMatch: /login-coreos\.spec\.ts$/,
    //   use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    // },
    // {
    //   name: '2-seed-security-group',
    //   testMatch: /seed-test-security-group\.spec\.ts$/,
    //   dependencies: ['1-login'],
    //   use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    // },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], viewport: { width: 1920, height: 1080 } },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], viewport: { width: 1920, height: 1080 } },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
