import { test as base } from '@playwright/test';

/**
 * Each test gets its own client address so the per-IP rate limits (which protect the free
 * Gemini quota) do not throttle a fast test run. Vercel and Cloud Run set this header
 * themselves in production, so clients cannot spoof it there.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': ip });
    await provide(page);
  },
});

export { expect } from '@playwright/test';
