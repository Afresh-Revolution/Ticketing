import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Show "Update available" so user can refresh and get latest
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-512-maskable.png',
      ],
      manifest: {
        name: 'GateWav',
        short_name: 'GateWav',
        description: 'GateWav Ticketing',
        theme_color: '#1A122E',
        background_color: '#1A122E',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192.png?v=gw-gateway-2026-05',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png?v=gw-gateway-2026-05',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512-maskable.png?v=gw-gateway-2026-05',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: true,
      },
    }),
  ],
  server: {
    hmr: { host: 'localhost', port: 5173 },
  },
})
