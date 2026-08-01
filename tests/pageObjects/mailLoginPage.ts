import { Locator, Page } from '@playwright/test';

export class MailLoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nextButton: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator(
      'input[name="identifier"], input[type="email"], input[name="username"], input[autocomplete="username"], input[autocomplete="email"], input[id*="email"], input[id*="user"]'
    ).first();
    this.passwordInput = page.locator(
      'input[type="password"][name="Passwd"], input[type="password"][name="password"], input[type="password"][autocomplete="current-password"], input[type="password"][id*="password"]'
    ).filter({ hasNot: page.locator('[aria-hidden="true"]') }).first();
    this.nextButton = page.getByRole('button', { name: /next|continue/i }).first();
    this.signInButton = page.getByRole('button', { name: /next|sign in|login/i }).first();
  }

  async open(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async enterEmail(email: string) {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
  }

  async clickNext() {
    await this.nextButton.waitFor({ state: 'visible' });
    await this.nextButton.click();
  }

  async enterPassword(password: string) {
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.passwordInput.fill(password);
  }

  async clickSignIn() {
    await this.signInButton.waitFor({ state: 'visible' });
    await this.signInButton.click();
  }

  async login(email: string, password: string) {
    await this.enterEmail(email);
    await this.clickNext();
    await this.enterPassword(password);
    await this.clickSignIn();
  }
}
