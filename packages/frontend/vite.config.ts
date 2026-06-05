import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Auto version based on build datetime — format: YYYY.MM.DD.HHmm
const now = new Date();
const autoVersion = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0'),
].join('.');

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(autoVersion),
    __BUILD_DATE__: JSON.stringify(now.toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      includeAssets: ['icons/icon-512.png', 'icons/icon-maskable-512.png'],
      manifest: {
        name: 'Clasp',
        short_name: 'Clasp',
        description: 'Borrow theirs, Lend yours',
        theme_color: '#1A3A2E',
        background_color: '#F5ECD7',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        categories: ['lifestyle', 'shopping'],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
