import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tokenFile = new URL('../tokens/tokens.css', import.meta.url);
const indexFile = new URL('../../index.css', import.meta.url);

const readTokenValue = (css, name) => {
  const match = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  return match?.[1]?.trim() ?? null;
};

const hexToRgb = (hex) => {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const relativeLuminance = (hex) => {
  const channels = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (left, right) => {
  const [light, dark] = [relativeLuminance(left), relativeLuminance(right)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};

test('canonical tokens contain the required Forest semantics', async () => {
  const css = await readFile(tokenFile, 'utf8');
  const required = [
    '--forest-color-brand-primary', '--forest-color-brand-strong', '--forest-color-brand-surface', '--forest-color-accent',
    '--forest-color-text-primary', '--forest-color-text-muted', '--forest-color-text-inverse', '--forest-color-surface-page',
    '--forest-color-surface-card', '--forest-color-surface-raised', '--forest-color-surface-inverse-hover', '--forest-color-surface-scrim',
    '--forest-color-border-subtle', '--forest-color-border-strong', '--forest-color-focus-ring', '--forest-color-success-surface',
    '--forest-color-success-border', '--forest-color-success-text', '--forest-color-warning-surface', '--forest-color-warning-border',
    '--forest-color-warning-text', '--forest-color-danger-surface', '--forest-color-danger-border', '--forest-color-danger-text',
    '--forest-color-info-surface', '--forest-color-info-border', '--forest-color-info-text', '--forest-font-body-size',
    '--forest-font-admin-size', '--forest-font-label-size', '--forest-font-supporting-size', '--forest-font-heading-1-size',
    '--forest-font-heading-2-size', '--forest-font-heading-3-size', '--forest-line-height-body', '--forest-line-height-heading',
    '--forest-control-min-height', '--forest-icon-control-size', '--forest-space-1', '--forest-space-2', '--forest-space-3',
    '--forest-space-4', '--forest-space-6', '--forest-space-8', '--forest-radius-control', '--forest-radius-card', '--forest-radius-dialog',
    '--forest-panel-padding',
  ];

  for (const name of required) assert.ok(readTokenValue(css, name), `${name} is missing`);
  assert.equal(readTokenValue(css, '--forest-color-brand-primary'), '#166534');
  assert.equal(readTokenValue(css, '--forest-control-min-height'), '3rem');
  assert.equal(readTokenValue(css, '--forest-icon-control-size'), '3rem');
});

test('index.css imports tokens instead of redefining them', async () => {
  const css = await readFile(indexFile, 'utf8');
  assert.match(css, /^@import "\.\/design-system\/tokens\/tokens\.css";/);
  assert.doesNotMatch(css, /--forest-color-brand-primary\s*:/);
});

test('Tailwind Forest aliases reference CSS variables', async () => {
  const config = (await import('../../../tailwind.config.cjs')).default;
  const forest = config.theme.extend.colors.forest;
  assert.equal(forest.primary, 'var(--forest-color-brand-primary)');
  assert.equal(forest.strong, 'var(--forest-color-brand-strong)');
  assert.equal(forest.surface.card, 'var(--forest-color-surface-card)');
  assert.equal(forest.surface['inverse-hover'], 'var(--forest-color-surface-inverse-hover)');
  assert.equal(forest.surface.scrim, 'var(--forest-color-surface-scrim)');
  assert.equal(forest.focus, 'var(--forest-color-focus-ring)');
  assert.equal(config.theme.extend.minHeight['forest-control'], 'var(--forest-control-min-height)');
  assert.equal(config.theme.extend.minWidth['forest-control'], 'var(--forest-icon-control-size)');
  assert.equal(config.theme.extend.width['forest-icon-control'], 'var(--forest-icon-control-size)');
  assert.equal(config.theme.extend.height['forest-icon-control'], 'var(--forest-icon-control-size)');
  assert.equal(config.theme.extend.borderRadius['forest-card'], 'var(--forest-radius-card)');
  assert.equal(config.theme.extend.spacing['forest-panel'], 'var(--forest-panel-padding)');
});

test('canonical text and surface pairs meet WCAG AA contrast', async () => {
  const css = await readFile(tokenFile, 'utf8');
  const pairs = [
    ['--forest-color-text-primary', '--forest-color-surface-page'], ['--forest-color-text-muted', '--forest-color-surface-card'],
    ['--forest-color-text-inverse', '--forest-color-brand-primary'], ['--forest-color-success-text', '--forest-color-success-surface'],
    ['--forest-color-warning-text', '--forest-color-warning-surface'], ['--forest-color-danger-text', '--forest-color-danger-surface'],
    ['--forest-color-info-text', '--forest-color-info-surface'],
  ];

  for (const [foreground, background] of pairs) {
    const ratio = contrastRatio(readTokenValue(css, foreground), readTokenValue(css, background));
    assert.ok(ratio >= 4.5, `${foreground} on ${background} has contrast ${ratio.toFixed(2)}:1`);
  }
});
