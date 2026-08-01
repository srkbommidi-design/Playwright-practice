import { test, expect } from '@playwright/test';

async function showVisibleNote(page: import('@playwright/test').Page, message: string) {
  await page.evaluate((noteText) => {
    const existing = document.getElementById('playwright-gmail-note');
    if (existing) {
      existing.remove();
    }

    const banner = document.createElement('div');
    banner.id = 'playwright-gmail-note';
    banner.textContent = noteText;
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.zIndex = '2147483647';
    banner.style.background = '#fff3cd';
    banner.style.color = '#664d03';
    banner.style.border = '1px solid #ffecb5';
    banner.style.padding = '10px 14px';
    banner.style.fontFamily = 'Arial, sans-serif';
    banner.style.fontSize = '14px';
    banner.style.fontWeight = '700';
    banner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    banner.style.textAlign = 'center';
    banner.style.pointerEvents = 'none';
    document.body.appendChild(banner);
  }, message);
}

test.use({
  screenshot: 'on',
  video: 'on',
  trace: 'on-first-retry',
  actionTimeout: 20_000,
  navigationTimeout: 30_000,
});

test.describe('Gmail login capture', () => {
  test('enters email, opens password page, and clicks Forgot password', async ({ page }, testInfo) => {
    const gmailEmail = process.env.GMAIL_EMAIL;

    test.skip(!gmailEmail, 'Set GMAIL_EMAIL in environment before running this test.');

    await page.goto('https://mail.google.com', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/google\.com/i);

    const gmailNote = `Connecting to Gmail and entering email id: ${gmailEmail}`;
    await test.step(gmailNote, async () => {
      await showVisibleNote(page, gmailNote);

      await testInfo.attach('gmail-connection-note', {
        body: gmailNote,
        contentType: 'text/plain',
      });

      const landingShot = testInfo.outputPath('gmail-landing.png');
      await page.screenshot({ path: landingShot, fullPage: true });
      await testInfo.attach('gmail-landing', {
        path: landingShot,
        contentType: 'image/png',
      });

      const emailInput = page
        .locator(
          'input[name="identifier"], input[autocomplete="username"], input[aria-label="Email or phone"], input[type="email"], input[type="text"]'
        )
        .first();
      await expect(emailInput).toBeVisible({ timeout: 30_000 });
      await emailInput.fill(gmailEmail as string);

      const nextButton = page.getByRole('button', { name: /next/i }).first();
      await expect(nextButton).toBeVisible();
      await nextButton.click();
    });

    const blockedHeading = page.getByRole('heading', { name: /couldn'?t sign you in/i });
    const blockedMessage = page.getByText(/this browser or app may not be secure/i);
    const passwordInput = page
      .locator('input[type="password"]:not([aria-hidden="true"]):not([tabindex="-1"])')
      .first();

    const start = Date.now();
    const timeoutMs = 30_000;
    let currentStep: 'loading' | 'blocked' | 'password' = 'loading';

    while (Date.now() - start < timeoutMs) {
      if (await blockedHeading.isVisible().catch(() => false)) {
        currentStep = 'blocked';
        break;
      }
      if (await blockedMessage.isVisible().catch(() => false)) {
        currentStep = 'blocked';
        break;
      }
      if (await passwordInput.isVisible().catch(() => false)) {
        currentStep = 'password';
        break;
      }
      await page.waitForTimeout(500);
    }

    expect(currentStep, 'Waiting for Gmail password page or Google security block page').not.toBe('loading');

    if (currentStep === 'blocked') {
      const blockedShot = testInfo.outputPath('gmail-blocked-page.png');
      await page.screenshot({ path: blockedShot, fullPage: true });
      await testInfo.attach('gmail-blocked-page', {
        path: blockedShot,
        contentType: 'image/png',
      });
      test.skip(true, 'Google blocked automated login: This browser or app may not be secure.');
      return;
    }

    await expect(passwordInput).toBeVisible({ timeout: 30_000 });

    const passwordStepShot = testInfo.outputPath('gmail-password-step.png');
    await page.screenshot({ path: passwordStepShot, fullPage: true });
    await testInfo.attach('gmail-password-step', {
      path: passwordStepShot,
      contentType: 'image/png',
    });

    const forgotPasswordControl = page
      .locator('button:has-text("Forgot password"), a:has-text("Forgot password")')
      .first();
    await expect(forgotPasswordControl).toBeVisible({ timeout: 30_000 });

    const beforeForgotPasswordUrl = page.url();
    await forgotPasswordControl.click();

    await expect.poll(() => page.url(), {
      timeout: 30_000,
      message: 'Expected navigation after clicking Forgot password',
    }).not.toBe(beforeForgotPasswordUrl);

    const forgotPasswordShot = testInfo.outputPath('gmail-forgot-password.png');
    await page.screenshot({ path: forgotPasswordShot, fullPage: true });
    await testInfo.attach('gmail-forgot-password', {
      path: forgotPasswordShot,
      contentType: 'image/png',
    });
  });
});
