import { Page, Locator } from '@playwright/test';

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
    this.userManagementNavLink = page.getByRole('link', { name: 'User Management' });
    this.createNewUserButton = page.getByRole('button', { name: 'Create New User' });
    this.usernameInput = page.getByLabel('Username');
    this.roleDropdown = page.getByLabel('Role');
    this.submitButton = page.getByRole('button', { name: 'Save' });
  }

  async navigateToUserManagement(): Promise<void> {
    await this.userManagementNavLink.click();
  }

  async clickCreateNewUser(): Promise<void> {
    await this.createNewUserButton.click();
  }

  async fillUserDetails(username: string, role: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.roleDropdown.selectOption(role);
    await this.submitButton.click();
  }
}
