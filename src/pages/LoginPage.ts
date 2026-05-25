import { Page, Locator } from '@playwright/test';
import { getTranslations } from '../data/localization';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const t = getTranslations();

    this.usernameInput = page.getByPlaceholder(t.username);
    this.passwordInput = page.getByPlaceholder(t.password);
    this.signInButton = page.getByRole('button', { name: t.loginBtn });
  }

  async goto(): Promise<void> {
    await this.page.goto(process.env.BASE_URL!);
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
