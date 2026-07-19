import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOrganizationWritesEnabled } from '../../build/organizationWritePolicy.js';

test('Vercel Preview and local draft compile writes off', () => {
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'production', vercelEnv: 'preview' }), false);
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'organization-e2e', vercelEnv: 'preview' }), false);
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'draft', vercelEnv: undefined }), false);
});

test('production enables writes and only explicit organization E2E enables local mocked writes', () => {
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'production', vercelEnv: 'production' }), true);
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'organization-e2e', vercelEnv: undefined }), true);
});
