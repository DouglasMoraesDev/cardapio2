import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'robots.txt', 'frontend/icons/icon-192.svg', 'frontend/icons/icon-512.svg'],
          manifest: {
            name: 'GastroManager',
            short_name: 'Gastro',
            description: 'App do restaurante — cardápio e gestão',
            start_url: '/',
            display: 'fullscreen',
            background_color: '#06120c',
            theme_color: '#06120c',
            icons: [
              { src: '/frontend/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
              { src: '/frontend/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
            ]
          },
          devOptions: {
            enabled: true
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
