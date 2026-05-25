import { Page, Locator } from '@playwright/test';
import { getTranslations } from '../data/localization';

export class LocationSecurityPage {
  readonly page: Page;
  readonly locationDropdown: Locator;
  readonly securityGroupDropdown: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const t = getTranslations();

    // Both dropdowns share the same placeholder ("Please select" / "กรุณาเลือก").
    // Disambiguate by order: Location first, Security Group second.
    // Replace with data-testid selectors once the UI exposes them.
    const dropdowns = page.getByPlaceholder(t.dropdownSelect);
    this.locationDropdown = dropdowns.nth(0);
    this.securityGroupDropdown = dropdowns.nth(1);
    this.continueButton = page.getByRole('button', { name: t.continueBtn });
  }

  async selectContext(locationName: string, securityGroupName: string): Promise<void> {
    await this.locationDropdown.click();
    await this.page.getByRole('option', { name: locationName }).click();

    await this.securityGroupDropdown.click();
    await this.page.getByRole('option', { name: securityGroupName }).click();

    await this.continueButton.click();
  }
}
