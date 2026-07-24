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

const colorUtilityPrefix = String.raw`(?:accent|bg|text|border(?:-[trblxyse])?|divide|placeholder|ring(?:-offset)?|outline|fill|stroke|decoration|from|via|to|shadow|caret)`;
const standardTailwindPalette = String.raw`(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)`;
const paletteShade = String.raw`(?:50|100|200|300|400|500|600|700|800|900|950)`;
const forbiddenPalette = new RegExp(String.raw`\b${colorUtilityPrefix}-(?:(?:${standardTailwindPalette})-${paletteShade}|(?:white|black)(?:\/\d+)?)\b`);
const arbitraryColorUtility = new RegExp(String.raw`\b${colorUtilityPrefix}-\[([^\]\s]+)\]`, 'g');
const directArbitraryColorValue = /^(?:color:)?(?:--[\w-]+|(?:var|env)\(.+\)|[a-z]+)$/i;
const embeddedArbitraryColorSyntax = /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\da-f])|(?:^|[^a-z\d-])(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|device-cmyk)\(/i;
const forbiddenRuntimeLiteral = /\b(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|min-h-12|h-12|w-12|rounded-(?:lg|xl|2xl)|p-(?:5|6))\b/;
const forbiddenPilotTypography = /\btext-xs\b/;
const undersizedControlUtility = /\b(?:(?:min-)?h|size)-(?:0|px|[1-9]|1[01])\b/;
const jsxTagStart = /<\/?([A-Za-z][\w.:]*)(?=[\s/>])/g;
const pilotControlNames = new Set(['button', 'input', 'select', 'textarea', 'a', 'Button', 'IconButton', 'ActionLink']);
const voidElementNames = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const staticClassName = /\bclassName\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*"([^"]*)"\s*\}|\{\s*'([^']*)'\s*\}|\{\s*`([\s\S]*?)`\s*\})/;
const compactInputIndicator = /\btype\s*=\s*(?:"(?:checkbox|radio)"|'(?:checkbox|radio)')/;
const staticImport = /^[\t ]*import(?!\s*\()(?:(?:[\s\S]*?)\bfrom\s*)?(['"])([^'"]+)\1/gm;
const catalogModule = /^\.\/design-system\/catalog\/DesignSystemCatalog(?:\.jsx)?$/;
const guardedCatalogCondition = /import\.meta\.env\.DEV\s*&&\s*import\.meta\.env\.VITE_DRAFT_MODE\s*===\s*(['"])true\1/;
const lazyCatalogImport = /lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*(['"])\.\/design-system\/catalog\/DesignSystemCatalog(?:\.jsx)?\1\s*\)\s*\)/;

const withoutCssUrls = (value) => {
  let result = '';
  let index = 0;
  while (index < value.length) {
    const urlStart = value.slice(index, index + 4).toLowerCase() === 'url('
      && (index === 0 || !/[\w-]/.test(value[index - 1]));
    if (!urlStart) {
      result += value[index];
      index += 1;
      continue;
    }

    let depth = 1;
    let quote = null;
    index += 4;
    while (index < value.length && depth > 0) {
      const character = value[index];
      const escaped = value[index - 1] === '\\';
      if (quote) {
        if (character === quote && !escaped) quote = null;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '(' && !escaped) {
        depth += 1;
      } else if (character === ')' && !escaped) {
        depth -= 1;
      }
      index += 1;
    }
  }
  return result;
};

const isArbitraryColorValue = (value) => {
  const valueOutsideUrls = withoutCssUrls(value);
  return directArbitraryColorValue.test(valueOutsideUrls)
    || embeddedArbitraryColorSyntax.test(valueOutsideUrls);
};

const containsRawPaletteUtility = (source) => (
  forbiddenPalette.test(source)
  || [...source.matchAll(arbitraryColorUtility)].some(([, value]) => isArbitraryColorValue(value))
);

const jsxTagEnd = (source, start) => {
  let braceDepth = 0;
  let quote = null;
  for (let index = start; index < source.length; index += 1) {
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
      return index;
    }
  }
  return -1;
};

const getPilotControls = (source) => {
  const controls = [];
  const ancestors = [];
  for (const match of source.matchAll(jsxTagStart)) {
    const name = match[1];
    const end = jsxTagEnd(source, match.index);
    if (end === -1) continue;

    if (source[match.index + 1] === '/') {
      const ancestorIndex = ancestors.map((ancestor) => ancestor.name).lastIndexOf(name);
      if (ancestorIndex !== -1) ancestors.splice(ancestorIndex);
      continue;
    }

    const openingTag = source.slice(match.index, end + 1);
    const element = { name, openingTag };
    if (pilotControlNames.has(name)) {
      controls.push({ ...element, ancestors: [...ancestors] });
    }
    if (!/\/\s*>$/.test(openingTag) && !voidElementNames.has(name)) {
      ancestors.push(element);
    }
  }
  return controls;
};

const staticClassNameFor = (openingTag) => {
  const match = openingTag.match(staticClassName);
  return match?.slice(1).find((value) => value !== undefined) ?? '';
};

const hasStaticClass = (openingTag, utility) => (
  staticClassNameFor(openingTag).split(/\s+/).includes(utility)
);

const containsUndersizedPilotControl = (source) => (
  forbiddenPilotTypography.test(source)
  || getPilotControls(source).some(({ openingTag, ancestors }) => {
    if (compactInputIndicator.test(openingTag)) {
      return !ancestors.some(({ name, openingTag: ancestorTag }) => (
        name === 'label' && hasStaticClass(ancestorTag, 'min-h-forest-control')
      ));
    }
    return undersizedControlUtility.test(staticClassNameFor(openingTag));
  })
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

for (const utility of [
  'bg-teal-50',
  'shadow-green-500',
  'caret-red-500',
  'bg-[#03C75A]',
  'text-[rgb(3_199_90)]',
  'border-[color:var(--brand-color)]',
  'shadow-[0_1px_2px_rgb(0_0_0/0.1)]',
  'bg-[linear-gradient(90deg,#fff,#000)]',
]) {
  test(`raw palette policy rejects ${utility}`, () => {
    assert.equal(containsRawPaletteUtility(`<div className="${utility}" />`), true, `${utility} bypassed the palette policy`);
  });
}

test('raw palette policy rejects every standard Tailwind palette family', () => {
  for (const family of [
    'slate', 'gray', 'zinc', 'neutral', 'stone',
    'red', 'orange', 'amber', 'yellow', 'lime',
    'green', 'emerald', 'teal', 'cyan', 'sky',
    'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  ]) {
    const utility = `bg-${family}-500`;
    assert.equal(containsRawPaletteUtility(`<div className="${utility}" />`), true, `${utility} bypassed the palette policy`);
  }
});

test('raw palette policy permits Forest tokens and non-color arbitrary values', () => {
  for (const utility of [
    'bg-forest-surface',
    'text-forest-text-primary',
    'border-forest-border-subtle',
    'bg-[url(/images/forest.jpg)]',
    'bg-[url(/icons.svg#forest)]',
    'text-[length:var(--label-size)]',
    'border-[3px]',
  ]) {
    assert.equal(containsRawPaletteUtility(`<div className="${utility}" />`), false, `${utility} was rejected by the palette policy`);
  }
});

test('pilot accessibility policy rejects undersized controls', () => {
  for (const [element, utility] of [
    ['button', 'h-10'],
    ['input', 'min-h-9'],
    ['select', 'h-8'],
    ['button', 'size-10'],
  ]) {
    assert.equal(
      containsUndersizedPilotControl(`<${element} className="${utility}" />`),
      true,
      `${utility} bypassed the control-size policy`,
    );
  }
});

for (const type of ['checkbox', 'radio']) {
  test(`pilot accessibility policy rejects an unwrapped compact ${type}`, () => {
    assert.equal(
      containsUndersizedPilotControl(`<input type="${type}" className="h-5 w-5" />`),
      true,
    );
  });
}

test('pilot accessibility policy rejects a compact input when the accessible label is only a sibling', () => {
  const source = `
    <label className="min-h-forest-control" htmlFor="enabled">Enabled</label>
    <input id="enabled" type="checkbox" className="h-5 w-5" />
  `;
  assert.equal(containsUndersizedPilotControl(source), true);
});

test('pilot accessibility policy rejects a compact input whose enclosing label lacks the control height', () => {
  const source = `
    <label className="flex items-center">
      <input type="checkbox" className="h-5 w-5" />
      Enabled
    </label>
  `;
  assert.equal(containsUndersizedPilotControl(source), true);
});

test('pilot accessibility policy permits a compact input nested in a control-height label', () => {
  const source = `
    <label className="flex min-h-forest-control items-center">
      <span>Enabled</span>
      <input type="checkbox" className="h-5 w-5" />
    </label>
  `;
  assert.equal(containsUndersizedPilotControl(source), false);
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
