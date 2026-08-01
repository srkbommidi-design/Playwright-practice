import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('UI locators demo', () => {
  test('fills the sample form with explicit locators', async ({ page }) => {
    const fixturePath = path.resolve(__dirname, '..', 'fixtures', 'ui-locators-page.html');
    await page.goto(`file://${fixturePath}`);

    await expect(page.getByRole('heading', { name: 'UI Locators Demo' })).toBeVisible();

    await page.getByLabel('Full name').fill('Ranjini Kumar');
    await page.getByLabel('Email').fill('srkbommidi@example.com');
    await page.getByRole('button', { name: /submit/i }).click();

    await expect(page.locator('#confirmation')).toContainText('Thanks, Ranjini Kumar');
  });
});
