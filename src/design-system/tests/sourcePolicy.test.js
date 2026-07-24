import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const designSystemRuntimeFiles = [
  '../primitives/actionControlStyles.js',
  '../primitives/Button.jsx',
  '../primitives/ActionLink.jsx',
  '../primitives/IconButton.jsx',
  '../primitives/FormField.jsx',
  '../primitives/StatusBadge.jsx',
  '../primitives/AsyncState.jsx',
  '../primitives/AccessibleDialog.jsx',
  '../patterns/Surface.jsx',
  '../patterns/SectionHeading.jsx',
  '../catalog/DesignSystemCatalog.jsx',
];

const pilotFiles = [
  '../../components/admin/organization/OrganizationDirectoryPreview.jsx',
  '../../components/admin/organization/OrganizationSaveConfirmation.jsx',
  '../../components/admin/organization/OrganizationGroupForm.jsx',
  '../../components/admin/organization/OrganizationGroupTree.jsx',
  '../../components/organization/OrganizationDirectory.jsx',
  '../../components/organization/OrganizationMemberList.jsx',
];

const forbiddenPalette = /\b(?:accent|bg|text|border(?:-[trblxyse])?|divide|placeholder|ring(?:-offset)?|outline|fill|stroke|decoration|from|via|to)-(?:(?:green|emerald|blue|red|amber|gray|slate)-(?:50|100|200|300|400|500|600|700|800|900|950)|(?:white|black)(?:\/\d+)?)\b/;
const forbiddenRuntimeLiteral = /\b(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|min-h-12|h-12|w-12|rounded-(?:lg|xl|2xl)|p-(?:5|6))\b/;
const forbiddenPilotTypography = /\btext-xs\b/;
const undersizedControlUtility = /\b(?:min-)?h-(?:0|px|[1-9]|1[01])\b/;
const pilotControlStart = /<(?:button|input|select|textarea|a|Button|IconButton|ActionLink)(?=[\s/>])/g;
const staticClassName = /\bclassName\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*"([^"]*)"\s*\}|\{\s*'([^']*)'\s*\}|\{\s*`([\s\S]*?)`\s*\})/;
const compactInputIndicator = /\btype\s*=\s*(?:"(?:checkbox|radio)"|'(?:checkbox|radio)')/;
const staticImport = /^[\t ]*import(?!\s*\()(?:(?:[\s\S]*?)\bfrom\s*)?(['"])([^'"]+)\1/gm;
const catalogModule = /^\.\/design-system\/catalog\/DesignSystemCatalog(?:\.jsx)?$/;
const guardedCatalogCondition = /import\.meta\.env\.DEV\s*&&\s*import\.meta\.env\.VITE_DRAFT_MODE\s*===\s*(['"])true\1/;
const lazyCatalogImport = /lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*(['"])\.\/design-system\/catalog\/DesignSystemCatalog(?:\.jsx)?\1\s*\)\s*\)/;

const containsRawPaletteUtility = (source) => forbiddenPalette.test(source);

const getPilotControlOpeningTags = (source) => {
  const tags = [];
  for (const match of source.matchAll(pilotControlStart)) {
    let braceDepth = 0;
    let quote = null;
    for (let index = match.index; index < source.length; index += 1) {
      const character = source[index];
      const escaped = source[index - 1] === '\\';
      if (quote) {
        if (character === quote && !escaped) quote = null;
      } else if (character === '"' || character === "'" || character === '`') {
        quote = character;
      } else if (character === '{') {
        braceDepth += 1;
      } else if (character === '}') {
        braceDepth = Math.max(0, braceDepth - 1);
      } else if (character === '>' && braceDepth === 0) {
        tags.push(source.slice(match.index, index + 1));
        break;
      }
    }
  }
  return tags;
};

const staticClassNameFor = (openingTag) => {
  const match = openingTag.match(staticClassName);
  return match?.slice(1).find((value) => value !== undefined) ?? '';
};

const containsUndersizedPilotControl = (source) => (
  forbiddenPilotTypography.test(source)
  || getPilotControlOpeningTags(source).some((openingTag) => (
    // Checkbox and radio glyphs may be compact when their surrounding label supplies the 48px target.
    !compactInputIndicator.test(openingTag)
    && undersizedControlUtility.test(staticClassNameFor(openingTag))
  ))
);

const hasStaticCatalogImport = (source) => (
  [...source.matchAll(staticImport)].some(([, , moduleSpecifier]) => catalogModule.test(moduleSpecifier))
);
const hasGuardedLazyCatalogImport = (source) => (
  guardedCatalogCondition.test(source) && lazyCatalogImport.test(source)
);

test('raw palette policy rejects representative utility bypasses', () => {
  for (const utility of [
    'border-l-green-700',
    'divide-gray-200',
    'placeholder-gray-600',
    'ring-offset-white',
    'bg-slate-50',
  ]) {
    assert.equal(containsRawPaletteUtility(`<div className="${utility}" />`), true, `${utility} bypassed the palette policy`);
  }
});

test('pilot accessibility policy rejects undersized controls', () => {
  for (const [element, utility] of [
    ['button', 'h-10'],
    ['input', 'min-h-9'],
    ['select', 'h-8'],
  ]) {
    assert.equal(
      containsUndersizedPilotControl(`<${element} className="${utility}" />`),
      true,
      `${utility} bypassed the control-size policy`,
    );
  }
});

test('pilot accessibility policy permits dimensions on non-control icons', () => {
  assert.equal(containsUndersizedPilotControl('<svg className="h-8 w-8" aria-hidden="true" />'), false);
});

test('catalog import policy rejects whitespace, aliased default, and named static imports', () => {
  for (const source of [
    "  import DesignSystemCatalog from './design-system/catalog/DesignSystemCatalog';",
    "import Catalog from './design-system/catalog/DesignSystemCatalog';",
    "import { DesignSystemCatalog } from './design-system/catalog/DesignSystemCatalog';",
  ]) {
    assert.equal(hasStaticCatalogImport(source), true, `${source} bypassed the static import policy`);
  }
});

test('catalog import policy permits the guarded lazy dynamic import', () => {
  const source = `
    const DesignSystemCatalog = import.meta.env.DEV && import.meta.env.VITE_DRAFT_MODE === 'true'
      ? lazy(() => import('./design-system/catalog/DesignSystemCatalog'))
      : null;
  `;
  assert.equal(hasStaticCatalogImport(source), false);
  assert.equal(hasGuardedLazyCatalogImport(source), true);
});

test('design-system runtime and organization pilot use semantic tokens', async () => {
  for (const relativePath of designSystemRuntimeFiles) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    assert.equal(containsRawPaletteUtility(source), false, `${relativePath} contains a raw palette utility`);
    assert.doesNotMatch(source, forbiddenRuntimeLiteral, `${relativePath} bypasses a typography, size, or radius token`);
  }
  for (const relativePath of pilotFiles) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    assert.equal(containsRawPaletteUtility(source), false, `${relativePath} contains a raw palette utility`);
    assert.equal(containsUndersizedPilotControl(source), false, `${relativePath} contains an undersized accessibility utility`);
  }
});

test('production routes do not statically import the catalog', async () => {
  const source = await readFile(new URL('../../routes.jsx', import.meta.url), 'utf8');
  assert.equal(hasStaticCatalogImport(source), false);
  assert.equal(hasGuardedLazyCatalogImport(source), true);
});
