import { Page, Route } from '@playwright/test';

export const CHAT_API = '**/api/chat*';

/**
 * Schema-tolerant fake reply: carries the text under every field name chat backends commonly use, so
 * the same mock works whichever one the UI reads. Real LLM calls are never made from the test suite
 * (the host pays for them, and model output is non-deterministic).
 */
export const fakeReply = (text: string) => ({
  reply: text, content: text, message: text, text, output: text, response: text, answer: text,
  choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
});

export async function mockChat(page: Page, handler: (route: Route, callNo: number) => Promise<void> | void) {
  const seen: string[] = [];
  let n = 0;
  await page.route(CHAT_API, (route) => {
    n++;
    seen.push(route.request().postData() ?? '');
    return handler(route, n);
  });
  return { requests: seen, calls: () => n };
}
