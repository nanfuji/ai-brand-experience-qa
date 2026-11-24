import { test, expect } from './support/base';
import { ChatPage } from './pages/ChatPage';

/**
 * Target: "TTA Chat" AI sandbox. These tests cover the page's static contract: structure, accessibility,
 * safe defaults and theming, without sending a single prompt to the host's LLM proxy.
 */
test.describe('Chat UI · structure, accessibility & safe defaults', () => {
  let chat: ChatPage;
  test.beforeEach(async ({ page }) => {
    chat = new ChatPage(page);
    await chat.goto();
  });

  test('CH-01 loads with the expected title, heading and language', async ({ page }) => {
    await expect(page).toHaveTitle(/TTA Chat/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Talk to the TTA AI model');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('CH-02 the skip link is the first tab stop and moves focus to the composer', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Tab-stop rules differ by browser; asserted on Chromium');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to composer' });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(chat.input).toBeFocused();
  });

  test('CH-03 the message box has an accessible name and a helpful placeholder', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Your message' })).toBeVisible();
    await expect(chat.input).toHaveAttribute('placeholder', /Send a message/);
  });

  test('CH-04 the model picker offers exactly the two documented models', async () => {
    const options = await chat.model.locator('option').evaluateAll((els) => els.map((e) => ({ value: (e as HTMLOptionElement).value, label: e.textContent?.trim() })));
    expect(options).toEqual([
      { value: 'deepseek-chat', label: 'TTA AI Standard' },
      { value: 'deepseek-reasoner', label: 'TTA AI Reasoner' },
    ]);
    await expect(chat.model).toHaveValue('deepseek-chat');
  });

  test('CH-05 three suggestion prompts are offered and their data matches their label', async () => {
    await expect(chat.chips).toHaveCount(3);
    for (const chip of await chat.chips.all()) {
      expect(await chip.getAttribute('data-suggestion')).toBe((await chip.textContent())?.trim());
    }
    await expect(chat.chips.first()).toHaveText('Give me three Playwright locator tips.');
  });

  test('CH-06 the settings drawer starts closed and is wired to its toggle', async () => {
    await expect(chat.settingsDrawer).toBeHidden();
    await expect(chat.settingsDrawer).toHaveAttribute('aria-hidden', 'true');
    await expect(chat.settingsToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(chat.settingsToggle).toHaveAttribute('aria-controls', 'settings-drawer');
  });

  test('CH-07 model settings default to safe, documented values', async () => {
    await expect(chat.systemPrompt).toHaveValue('You are a helpful QA testing assistant for The Testing Academy.');
    await expect(chat.temperature).toHaveValue('0.7');
    await expect(chat.temperatureValue).toHaveText('0.7');
    await expect(chat.keepHistory).toBeChecked();
  });

  test('CH-08 the bring-your-own-key field is masked and not autofilled', async () => {
    await expect(chat.byoKey).toHaveAttribute('type', 'password');
    await expect(chat.byoKey).toHaveAttribute('autocomplete', 'off');
    await expect(chat.byoKey).toHaveAttribute('spellcheck', 'false');
    await expect(chat.byoStatus).toHaveText('No key saved. Using the server-side TTA key.');
  });

  test('CH-09 a visible disclaimer warns users not to paste production API keys', async () => {
    await expect(chat.disclaimer).toHaveAttribute('role', 'status');
    await expect(chat.disclaimer).toContainText('production API keys');
  });

  test('CH-10 on first load there are no messages, no spinner and no error', async () => {
    await expect(chat.emptyState).toBeVisible();
    await expect(chat.messageList).toBeEmpty();
    await expect(chat.status).toBeHidden();
    await expect(chat.errorBanner).toBeHidden();
  });

  test('CH-11 Send submits the composer form; Reset is a plain button', async () => {
    await expect(chat.send).toHaveAttribute('type', 'submit');
    await expect(chat.reset).toHaveAttribute('type', 'button');
    await expect(chat.page.getByTestId('composer').getByRole('button', { name: 'Send' })).toBeVisible();
  });

  test('CH-12 icon-only buttons expose accessible names', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Toggle light or dark theme' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible();
  });

  test('CH-13 external links open safely (rel=noopener)', async ({ page }) => {
    for (const link of await page.locator('a[href^="https://"]').all()) {
      expect(await link.getAttribute('rel')).toContain('noopener');
    }
  });
});

test.describe('Chat UI · theming', () => {
  test('CH-14 the initial theme follows the OS preference (dark)', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, colorScheme: 'dark' });
    const page = await ctx.newPage();
    await new ChatPage(page).goto();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await ctx.close();
  });

  test('CH-15 the initial theme follows the OS preference (light)', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, colorScheme: 'light' });
    const page = await ctx.newPage();
    await new ChatPage(page).goto();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await ctx.close();
  });

  test('CH-16 a saved theme choice beats the OS preference', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, colorScheme: 'dark' });
    await ctx.addInitScript(() => window.localStorage.setItem('tta-theme', 'light'));
    const page = await ctx.newPage();
    await new ChatPage(page).goto();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await ctx.close();
  });
});
