import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveForestMutationsEnabled } from './build/organizationWritePolicy.js';
import { draftApiPlugin } from './tests/draft/draftApiPlugin.js';
import { seoOriginPlugin } from './build/seoOriginPlugin.js';
import { seoArtifactsPlugin } from './build/seoArtifactsPlugin.js';
import { SITE_ORIGIN } from './build/siteOrigin.js';

export default defineConfig(({ mode }) => {
  const usesDraftApi = mode === 'draft' || mode === 'organization-e2e';
  const mutationsEnabled = resolveForestMutationsEnabled({ mode, vercelEnv: process.env.VERCEL_ENV });
  return {
    // draft/e2e 모드는 목 API 를 쓰므로 SEO 자산을 생성하지 않는다. 목 데이터가 배포본에 섞이면
    // 존재하지 않는 URL 을 검색엔진에 제출하고 그 경로를 프리렌더까지 하게 된다.
    plugins: [
      react(),
      seoOriginPlugin(),
      ...(usesDraftApi ? [draftApiPlugin()] : [seoArtifactsPlugin()]),
    ],
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
