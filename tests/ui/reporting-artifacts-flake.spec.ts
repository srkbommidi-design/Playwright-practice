import { test, expect } from '@playwright/test';
import * as path from 'path';

test.use({
  screenshot: 'on',
  video: 'on',
  trace: 'on-first-retry',
  actionTimeout: 10_000,
  navigationTimeout: 15_000,
});

test.describe('Reporting artifacts and flake mitigation demo', () => {
  // Retries help absorb transient UI timing issues without hiding persistent failures.
  test.describe.configure({ retries: 2, timeout: 60_000 });

  test('captures screenshots, traces, videos, and structured logs', async ({ page }, testInfo) => {
    const consoleLogs: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    const fixturePath = path.resolve(__dirname, '..', 'fixtures', 'ui-locators-page.html');

    await test.step('Open local fixture page', async () => {
      await page.goto(`file://${fixturePath}`);
      await expect(page.getByRole('heading', { name: 'UI Locators Demo' })).toBeVisible();
    });

    await test.step('Submit form with resilient locators', async () => {
      const nameInput = page.getByLabel('Full name');
      const emailInput = page.getByLabel('Email');
      const submitButton = page.getByRole('button', { name: /submit/i });

      await expect(nameInput).toBeEditable();
      await expect(emailInput).toBeEditable();
      await expect(submitButton).toBeEnabled();

      await nameInput.fill('Ranjini Kumar');
      await emailInput.fill('ranjini@example.com');
      await submitButton.click();
    });

    await test.step('Verify result using bounded polling', async () => {
      const confirmation = page.locator('#confirmation');
      await expect(confirmation).toBeVisible();

      await expect
        .poll(async () => (await confirmation.textContent())?.trim() ?? '', {
          timeout: 8_000,
          message: 'Confirmation text should stabilize after submit',
        })
        .toContain('Thanks, Ranjini Kumar');
    });

    await test.step('Attach explicit artifacts', async () => {
      const screenshotPath = testInfo.outputPath('final-state.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      await testInfo.attach('final-state-screenshot', {
        path: screenshotPath,
        contentType: 'image/png',
      });

      await testInfo.attach('console-log', {
        body: (consoleLogs.length ? consoleLogs : ['No console messages captured']).join('\n'),
        contentType: 'text/plain',
      });

      await testInfo.attach('page-errors', {
        body: (pageErrors.length ? pageErrors : ['No page errors captured']).join('\n'),
        contentType: 'text/plain',
      });

      await testInfo.attach('flake-mitigation-notes', {
        body: [
          'Applied retries at describe level (retries: 2).',
          'Used resilient locators (role/label).',
          'Used expect.poll with timeout instead of fixed sleeps.',
          'Configured action and navigation timeouts.',
        ].join('\n'),
        contentType: 'text/plain',
      });
    });
  });
});
