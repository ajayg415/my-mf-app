import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update service worker when new build is deployed
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'MyMF Portfolio',
        short_name: 'MyMF',
        description: 'Local-first Mutual Fund Tracker',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // IMPORTANT: This removes the browser URL bar
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png', // You need to add this file to /public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // You need to add this file to /public
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // 'maskable' ensures it looks good on Android rounded icons
          }
        ]
      },
      workbox: {
        // Advanced Caching: Cache API calls to MFAPI.in
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://api.mfapi.in',
            handler: 'NetworkFirst', // Try network; if offline, use cache
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 Day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
});