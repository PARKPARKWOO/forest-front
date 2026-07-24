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

const forbiddenPalette = /\b(?:accent|bg|text|border|ring|outline|fill|stroke|decoration|from|via|to)-(?:(?:green|emerald|blue|red|amber|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)|(?:white|black)(?:\/\d+)?)\b/;
const forbiddenRuntimeLiteral = /\b(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|min-h-12|h-12|w-12|rounded-(?:lg|xl|2xl)|p-(?:5|6))\b/;
const forbiddenPilotAccessibility = /\btext-xs\b|\bmin-h-1[01]\b/;

test('design-system runtime and organization pilot use semantic tokens', async () => {
  for (const relativePath of designSystemRuntimeFiles) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    assert.doesNotMatch(source, forbiddenPalette, `${relativePath} contains a raw palette utility`);
    assert.doesNotMatch(source, forbiddenRuntimeLiteral, `${relativePath} bypasses a typography, size, or radius token`);
  }
  for (const relativePath of pilotFiles) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    assert.doesNotMatch(source, forbiddenPalette, `${relativePath} contains a raw palette utility`);
    assert.doesNotMatch(source, forbiddenPilotAccessibility, `${relativePath} contains an undersized accessibility utility`);
  }
});

test('production routes do not statically import the catalog', async () => {
  const source = await readFile(new URL('../../routes.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^import DesignSystemCatalog/m);
  assert.match(source, /import\.meta\.env\.DEV && import\.meta\.env\.VITE_DRAFT_MODE === 'true'/);
  assert.match(source, /lazy\(\(\) => import\('\.\/design-system\/catalog\/DesignSystemCatalog'\)\)/);
});
