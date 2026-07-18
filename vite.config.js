import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { draftApiPlugin } from './tests/draft/draftApiPlugin.js';

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'draft' ? [draftApiPlugin()] : [])],
  server: {
    port: 3000,
    strictPort: true,
    proxy: mode === 'draft' ? undefined : {
      '/api': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
    },
  },
  define: { global: 'globalThis' },
  resolve: { alias: { crypto: 'crypto-browserify' } },
}));
