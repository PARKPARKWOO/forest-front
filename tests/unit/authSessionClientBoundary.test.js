import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const srcDirectory = fileURLToPath(new URL('../../src/', import.meta.url));

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listJavaScriptFiles(path);
    return /\.(?:js|jsx)$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

test('the auth session client has credentials but no content or navigation interceptors', async () => {
  const source = await readFile(join(srcDirectory, 'authSessionClient.js'), 'utf8');
  assert.match(source, /baseURL:\s*API_BASE_URL/);
  assert.match(source, /withCredentials:\s*true/);
  assert.doesNotMatch(source, /interceptors\./);
  assert.doesNotMatch(source, /Authorization|accessToken|refreshToken|reissue/i);
});

test('only userService imports the dedicated auth session client', async () => {
  const importPattern = /from\s+['\"][^'\"]*authSessionClient(?:\.js)?['\"]/;
  const importers = [];

  for (const path of await listJavaScriptFiles(srcDirectory)) {
    const source = await readFile(path, 'utf8');
    if (importPattern.test(source)) importers.push(relative(srcDirectory, path));
  }

  assert.deepEqual(importers.sort(), ['services/userService.js']);
});

test('revokeToken posts through the session client without a deployment guard or body parser', async () => {
  const source = await readFile(join(srcDirectory, 'services/userService.js'), 'utf8');
  assert.match(source, /await authSessionClient\.post\(['\"]\/auth\/token\/revoke['\"]\)/);
  assert.doesNotMatch(source, /FOREST_MUTATIONS_ENABLED|response\.json\(|\bfetch\s*\(/);
});
