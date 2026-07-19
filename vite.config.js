import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveOrganizationWritesEnabled } from './build/organizationWritePolicy.js';
import { draftApiPlugin } from './tests/draft/draftApiPlugin.js';

export default defineConfig(({ mode }) => {
  const usesDraftApi = mode === 'draft' || mode === 'organization-e2e';
  const writesEnabled = resolveOrganizationWritesEnabled({ mode, vercelEnv: process.env.VERCEL_ENV });
  return {
    plugins: [react(), ...(usesDraftApi ? [draftApiPlugin()] : [])],
    server: {
      port: 3000,
      strictPort: true,
      proxy: usesDraftApi ? undefined : {
        '/api': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
      },
    },
    define: {
      global: 'globalThis',
      __FOREST_ORGANIZATION_WRITES_ENABLED__: JSON.stringify(writesEnabled),
    },
    resolve: { alias: { crypto: 'crypto-browserify' } },
  };
});
