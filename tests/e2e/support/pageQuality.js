import { expect } from '@playwright/test';

export function watchPageQuality(page) {
  const errors = [];
  const allowedConsoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ type: 'console', text: message.text() });
  });
  page.on('pageerror', (error) => errors.push({ type: 'pageerror', text: error.message }));
  page.on('requestfailed', (request) => errors.push({ type: 'requestfailed', text: request.url() }));
  return {
    allowConsoleError(pattern) {
      if (!(pattern instanceof RegExp)) throw new TypeError('console allowlist entry must be a RegExp');
      allowedConsoleErrors.push(pattern);
    },
    assertClean() {
      const unexpected = errors.filter(({ type, text }) => (
        type !== 'console' || !allowedConsoleErrors.some((pattern) => pattern.test(text))
      ));
      expect(unexpected, unexpected.map(({ type, text }) => `${type}: ${text}`).join('\n')).toEqual([]);
    },
  };
}
