import { Locator, Page } from '@playwright/test';

export const CHAT_PATH = '/playwright/ai-chat/index.html';

/** Page Object: "TTA Chat" sandbox. Uses the site's documented data-test hooks (testIdAttribute = data-test). */
export class ChatPage {
  readonly input: Locator;
  readonly send: Locator;
  readonly reset: Locator;
  readonly model: Locator;
  readonly messageList: Locator;
  readonly userMessages: Locator;
  readonly assistantMessages: Locator;
  readonly status: Locator;
  readonly errorBanner: Locator;
  readonly errorText: Locator;
  readonly errorDismiss: Locator;
  readonly emptyState: Locator;
  readonly chips: Locator;
  readonly settingsToggle: Locator;
  readonly settingsDrawer: Locator;
  readonly settingsClose: Locator;
  readonly themeToggle: Locator;
  readonly disclaimer: Locator;
  readonly byoKey: Locator;
  readonly byoStatus: Locator;
  readonly systemPrompt: Locator;
  readonly temperature: Locator;
  readonly temperatureValue: Locator;
  readonly keepHistory: Locator;

  constructor(readonly page: Page) {
    this.input = page.getByTestId('chat-input');
    this.send = page.getByTestId('send-button');
    this.reset = page.getByTestId('reset-button');
    this.model = page.getByTestId('model-select');
    this.messageList = page.getByTestId('message-list');
    this.userMessages = page.getByTestId('message-user');
    this.assistantMessages = page.getByTestId('message-assistant');
    this.status = page.getByTestId('message-status');
    this.errorBanner = page.getByTestId('error-banner');
    this.errorText = page.getByTestId('error-text');
    this.errorDismiss = page.getByTestId('error-dismiss');
    this.emptyState = page.getByTestId('empty-state');
    this.chips = page.getByTestId('suggestion-chip');
    this.settingsToggle = page.getByTestId('settings-toggle');
    this.settingsDrawer = page.getByTestId('settings-drawer');
    this.settingsClose = page.getByTestId('settings-close');
    this.themeToggle = page.getByTestId('theme-toggle');
    this.disclaimer = page.getByTestId('disclaimer-banner');
    this.byoKey = page.getByTestId('byo-key-input');
    this.byoStatus = page.getByTestId('byo-key-status');
    this.systemPrompt = page.getByTestId('system-prompt');
    this.temperature = page.getByTestId('temperature');
    this.temperatureValue = page.getByTestId('temperature-value');
    this.keepHistory = page.getByTestId('keep-history-toggle');
  }

  async goto() { await this.page.goto(CHAT_PATH); }

  async ask(prompt: string) {
    await this.input.fill(prompt);
    await this.send.click();
  }
}
