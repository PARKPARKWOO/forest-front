export function resolveOrganizationWritesEnabled({ mode, vercelEnv }) {
  if (vercelEnv === 'preview') return false;
  if (mode === 'organization-e2e') return true;
  return mode !== 'draft';
}
