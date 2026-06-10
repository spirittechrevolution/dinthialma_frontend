import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Dinthialma',
        short_name: 'Dinthialma',
        description: 'Gérez vos tontines en toute sérénité',
        theme_color: '#16a34a',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        icons: [
          { src: '/icons/pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/icons/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cache API calls pour offline graceful
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /\/v1\/tontines/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-tontines', networkTimeoutSeconds: 5, expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 } },
          },
          {
            urlPattern: /\/v1\/notifications/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-notifications', networkTimeoutSeconds: 5, expiration: { maxEntries: 20, maxAgeSeconds: 60 * 2 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    port: 4200,
  },
})
