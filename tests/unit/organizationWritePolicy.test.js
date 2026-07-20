import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isForestMutationMethod,
  resolveForestMutationsEnabled,
  resolveOrganizationWritesEnabled,
} from '../../build/organizationWritePolicy.js';

test('Vercel Preview and local draft compile writes off', () => {
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'production', vercelEnv: 'preview' }), false);
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'organization-e2e', vercelEnv: 'preview' }), false);
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'draft', vercelEnv: undefined }), false);
});

test('production enables writes and only explicit organization E2E enables local mocked writes', () => {
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'production', vercelEnv: 'production' }), true);
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'organization-e2e', vercelEnv: undefined }), true);
});

test('the global mutation policy matches the existing organization deployment matrix', () => {
  assert.equal(resolveForestMutationsEnabled({ mode: 'production', vercelEnv: 'preview' }), false);
  assert.equal(resolveForestMutationsEnabled({ mode: 'draft', vercelEnv: undefined }), false);
  assert.equal(resolveForestMutationsEnabled({ mode: 'production', vercelEnv: 'production' }), true);
  assert.equal(resolveForestMutationsEnabled({ mode: 'organization-e2e', vercelEnv: undefined }), true);
});

test('GET, HEAD, and OPTIONS are read-only while every other Axios method is a mutation', () => {
  for (const method of [undefined, 'get', 'GET', 'head', 'HEAD', 'options', 'OPTIONS']) {
    assert.equal(isForestMutationMethod(method), false, `${method ?? 'default'} should be read-only`);
  }
  for (const method of ['post', 'PUT', 'patch', 'delete']) {
    assert.equal(isForestMutationMethod(method), true, `${method} should be a mutation`);
  }
});
