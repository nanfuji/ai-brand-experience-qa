# AI Brand Experience QA · Playwright + TypeScript

Automated QA for an **AI chat assistant** embedded in a brand experience: structure and accessibility, safe defaults for secrets, theming, and (in the pending set) conversation behaviour with a mocked model.

**Target (public practice site):** [TTA Chat](https://app.thetestingacademy.com/playwright/ai-chat/index.html), a Playwright-testable AI sandbox by The Testing Academy.

## Scope · 26 test cases

| Area | Spec | Highlights |
|---|---|---|
| Structure & accessibility | `chat-ui.spec.ts` (CH-01…13) | Skip link, accessible names, ARIA wiring of the settings drawer, model options, safe API-key field (masked, no autocomplete), disclaimer, external-link hygiene |
| Theming | `chat-ui.spec.ts` (CH-14…16) | OS preference vs saved choice, using emulated colour schemes |
| **Pending** behaviour | `tests/pending/chat-behaviour.spec.ts` (CB-01…10) | Mocked-LLM conversations: reply rendering, request contract (prompt + model), thinking state, 500 and offline handling, reset, **XSS-safe rendering of model output** |

## About the pending set

These depend on the chat app's own script (`ai-chat.js`), which was not available when the tests were written. They use the site's documented `data-test` hooks and a schema-tolerant fake reply, and were checked against a stand-in script. They are excluded from the default run so the suite stays green. Run them once against the live site:

```bash
INCLUDE_PENDING=1 npx playwright test tests/pending
```

When they pass, move the file up to `tests/` and delete the `testIgnore` line in `playwright.config.ts`.

## What I did not test, and why

Prompt-injection refusal and answer quality need the real model; they are non-deterministic, cost the host money, and should be checked with property-based assertions (no secrets, refusal present, latency budget) on an environment you own. **No test sends a prompt to the host's AI backend.**

## Test strategy

Treat the model as an untrusted dependency: assert on structure, contracts, failure handling and safe rendering, never on exact wording. Full case list: `QA-Test-Cases.xlsx`.

## Run it

```bash
npm install
npx playwright install
npm test                 # all projects (desktop Chromium, Pixel 7, iPhone 14 / WebKit)
npm run test:chromium    # quickest: Chromium desktop + Android emulation
npm run test:ui          # Playwright UI mode (time-travel debugger)
npm run report           # open the HTML report
```

**In VS Code:** install the *Playwright Test for VS Code* extension, open this folder, then use the Testing panel (beaker icon) to run, debug and record tests.

Point the suite somewhere else with `BASE_URL=https://your-host npm test`.

## CI & report

`.github/workflows/playwright.yml` runs the suite on every push and PR, **weekly on a schedule** (to catch the third-party site changing under the tests), and on demand. The HTML report is published to GitHub Pages: enable *Settings → Pages → Source: GitHub Actions*; the report appears at `https://nanfuji.github.io/<repo>/`.

## Being a good guest

The target is a free, public practice site run by a third party. The suite keeps parallelism low, blocks the site's analytics beacons, never sends load, and **never calls the site's AI backend**: model traffic is mocked at the network layer.

## How these tests were verified

The build environment had no internet access, so each spec was run on desktop Chromium and Pixel 7 emulation against a local replica made from saved copies of the real pages (served at the same URL paths). Every suite also passed 3 consecutive repeat runs with no flakes, and `tsc --noEmit` is clean. **They have not yet been run against the live host or in WebKit**: run `npm test` once and check the report.
