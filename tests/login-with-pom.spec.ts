import * as path from 'path';
import { test, expect } from '@playwright/test';
import { testEnv } from '../config/env';
import { MailLoginPage } from '../pages/mailLoginPage';

test.describe('Login with POM', () => {
  test('logs in to a local demo page using UI locators', async ({ page }) => {
    const fixturePath = path.resolve(__dirname, 'fixtures', 'login-page.html');
    const loginPage = new MailLoginPage(page);

    await loginPage.open(`file://${fixturePath}`);

    await loginPage.enterEmail(testEnv.email);
    await loginPage.enterPassword(testEnv.password);
    await loginPage.clickSignIn();

    await expect(page.locator('#success')).toBeVisible();
    await expect(page.locator('#success')).toContainText('Login successful');
  });
});
