import { test, expect } from '../support/base';
import { ChatPage } from '../pages/ChatPage';
import { fakeReply, mockChat, CHAT_API } from '../support/llm';

/**
 * PENDING: behaviour that lives in the chat app's own script (ai-chat.js), which was not available when
 * these tests were written. They follow the documented hooks (message-assistant, error-banner, ...) and
 * use a schema-tolerant mock, but have not been proven against the real script yet.
 * Run with:  INCLUDE_PENDING=1 npx playwright test tests/pending
 * Once green against the live site, move this file up to tests/ so it joins the default run.
 */
test.describe('Chat behaviour (mocked LLM)', () => {
  let chat: ChatPage;
  test.beforeEach(async ({ page }) => {
    chat = new ChatPage(page);
    await chat.goto();
  });

  test('CB-01 the theme toggle flips the theme', async ({ page }) => {
    const before = await page.locator('html').getAttribute('data-theme');
    await chat.themeToggle.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', before ?? '');
  });

  test('CB-02 the settings drawer opens and closes', async () => {
    await chat.settingsToggle.click();
    await expect(chat.settingsDrawer).toBeVisible();
    await expect(chat.settingsToggle).toHaveAttribute('aria-expanded', 'true');
    await chat.settingsClose.click();
    await expect(chat.settingsDrawer).toBeHidden();
  });

  test('CB-03 a prompt shows the user message and the assistant reply', async ({ page }) => {
    await mockChat(page, (route) => route.fulfill({ json: fakeReply('Use getByRole first.') }));
    await chat.ask('Give me one locator tip.');
    await expect(chat.userMessages.last()).toContainText('Give me one locator tip.');
    await expect(chat.assistantMessages.last()).toContainText('Use getByRole first.');
  });

  test('CB-04 the request carries the prompt and the selected model', async ({ page }) => {
    const wire = await mockChat(page, (route) => route.fulfill({ json: fakeReply('ok') }));
    await chat.ask('Explain test isolation.');
    await expect(chat.assistantMessages.last()).toBeVisible();
    expect(wire.requests[0]).toContain('Explain test isolation.');
    expect(wire.requests[0]).toContain('deepseek-chat');

    await chat.model.selectOption('deepseek-reasoner');
    await chat.ask('Second prompt');
    await expect.poll(() => wire.calls()).toBe(2);
    expect(wire.requests[1]).toContain('deepseek-reasoner');
  });

  test('CB-05 a thinking indicator shows while the reply is pending', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    await mockChat(page, async (route) => { await gate; await route.fulfill({ json: fakeReply('done') }); });
    await chat.ask('Slow one');
    await expect(chat.status).toBeVisible();
    release();
    await expect(chat.assistantMessages.last()).toContainText('done');
    await expect(chat.status).toBeHidden();
  });

  test('CB-06 a server error shows a dismissible error banner', async ({ page }) => {
    await mockChat(page, (route) => route.fulfill({ status: 500, json: { error: 'upstream failed' } }));
    await chat.ask('Will this fail?');
    await expect(chat.errorBanner).toBeVisible();
    await expect(chat.errorText).not.toBeEmpty();
    await chat.errorDismiss.click();
    await expect(chat.errorBanner).toBeHidden();
  });

  test('CB-07 a dropped connection is reported and the composer stays usable', async ({ page }) => {
    await page.route(CHAT_API, (route) => route.abort('internetdisconnected'));
    await chat.ask('Offline prompt');
    await expect(chat.errorBanner).toBeVisible();
    await expect(chat.send).toBeEnabled();
  });

  test('CB-08 Reset clears the conversation and brings back the empty state', async ({ page }) => {
    await mockChat(page, (route) => route.fulfill({ json: fakeReply('hello') }));
    await chat.ask('Hi');
    await expect(chat.assistantMessages.last()).toBeVisible();
    await chat.reset.click();
    await expect(chat.messageList).toBeEmpty();
    await expect(chat.emptyState).toBeVisible();
  });

  test('CB-09 an empty prompt sends nothing', async ({ page }) => {
    const wire = await mockChat(page, (route) => route.fulfill({ json: fakeReply('x') }));
    await chat.input.fill('   ');
    await chat.send.click();
    expect(wire.calls()).toBe(0);
  });

  test('CB-10 hostile markup in a reply is rendered as inert text', async ({ page }) => {
    await mockChat(page, (route) => route.fulfill({ json: fakeReply('<img src=x onerror="window.__xss=1">') }));
    await chat.ask('Say something risky');
    await expect(chat.assistantMessages.last()).toBeVisible();
    await expect(chat.messageList.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});
