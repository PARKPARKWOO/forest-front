import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveForestMutationsEnabled } from './build/organizationWritePolicy.js';
import { draftApiPlugin } from './tests/draft/draftApiPlugin.js';
import { seoOriginPlugin } from './build/seoOriginPlugin.js';
import { SITE_ORIGIN } from './build/siteOrigin.js';

export default defineConfig(({ mode }) => {
  const usesDraftApi = mode === 'draft' || mode === 'organization-e2e';
  const mutationsEnabled = resolveForestMutationsEnabled({ mode, vercelEnv: process.env.VERCEL_ENV });
  return {
    plugins: [react(), seoOriginPlugin(), ...(usesDraftApi ? [draftApiPlugin()] : [])],
    server: {
      port: 3000,
      strictPort: true,
      proxy: usesDraftApi ? undefined : {
        '/api': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
      },
    },
    define: {
      global: 'globalThis',
      __FOREST_MUTATIONS_ENABLED__: JSON.stringify(mutationsEnabled),
      __FOREST_ORGANIZATION_WRITES_ENABLED__: JSON.stringify(mutationsEnabled),
      __FOREST_SITE_ORIGIN__: JSON.stringify(SITE_ORIGIN),
    },
    resolve: { alias: { crypto: 'crypto-browserify' } },
  };
});
