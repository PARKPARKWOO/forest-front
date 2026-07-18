import { expect } from '@playwright/test';

export function watchPageQuality(page) {
  const errors = [];
  const allowedConsoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push({ type: 'console', text: message.text(), url: message.location().url });
    }
  });
  page.on('pageerror', (error) => errors.push({ type: 'pageerror', text: error.message }));
  page.on('requestfailed', (request) => errors.push({ type: 'requestfailed', text: request.url() }));
  return {
    allowConsoleError(textPattern, urlPattern) {
      if (!(textPattern instanceof RegExp)) throw new TypeError('console allowlist text must be a RegExp');
      if (urlPattern !== undefined && !(urlPattern instanceof RegExp)) {
        throw new TypeError('console allowlist URL must be a RegExp');
      }
      allowedConsoleErrors.push({ textPattern, urlPattern });
    },
    assertClean() {
      const remainingAllowances = allowedConsoleErrors.map((allowance) => ({
        ...allowance,
        remaining: 1,
      }));
      const unexpected = errors.filter(({ type, text, url }) => {
        if (type !== 'console') return true;
        const allowance = remainingAllowances.find(({ textPattern, urlPattern, remaining }) => (
          remaining > 0
          && textPattern.test(text)
          && (urlPattern === undefined || urlPattern.test(url))
        ));
        if (!allowance) return true;
        allowance.remaining -= 1;
        return false;
      });
      expect(
        unexpected,
        unexpected.map(({ type, text, url }) => `${type}: ${text}${url ? ` (${url})` : ''}`).join('\n'),
      ).toEqual([]);
    },
  };
}
