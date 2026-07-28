import { Locator, Page } from '@playwright/test';

export class MailLoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.signInButton = page.getByRole('button', { name: /sign in/i });
  }

  async open(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async enterEmail(email: string) {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
  }

  async enterPassword(password: string) {
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.passwordInput.fill(password);
  }

  async clickSignIn() {
    await this.signInButton.waitFor({ state: 'visible' });
    await this.signInButton.click();
  }
}
