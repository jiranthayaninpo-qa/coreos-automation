import { Page, Locator } from '@playwright/test';

export class SecurityGroupPage {
  readonly page: Page;
  readonly securityGroupNavLink: Locator;
  readonly roleSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    // TODO: replace with real CoreOS selectors
    this.securityGroupNavLink = page.getByRole('link', { name: 'Security Group' });
    this.roleSelector = page.getByLabel('Role');
  }

  async navigateToSecurityGroup(): Promise<void> {
    await this.securityGroupNavLink.click();
  }

  async assignPermissions(role: string, permissions: string[]): Promise<void> {
    await this.roleSelector.selectOption(role);
    for (const permission of permissions) {
      // TODO: confirm permission checkbox selector pattern in CoreOS UI
      await this.page.getByRole('checkbox', { name: permission }).check();
    }
    await this.page.getByRole('button', { name: 'Save' }).click();
  }
}
