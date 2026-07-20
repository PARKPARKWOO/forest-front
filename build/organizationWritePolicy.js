const READ_ONLY_HTTP_METHODS = new Set(['get', 'head', 'options']);

export function resolveForestMutationsEnabled({ mode, vercelEnv }) {
  if (vercelEnv === 'preview') return false;
  if (mode === 'organization-e2e') return true;
  return mode !== 'draft';
}

export function resolveOrganizationWritesEnabled(environment) {
  return resolveForestMutationsEnabled(environment);
}

export function isForestMutationMethod(method = 'get') {
  return !READ_ONLY_HTTP_METHODS.has(String(method).toLowerCase());
}
