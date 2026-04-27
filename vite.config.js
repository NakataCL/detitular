import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const gitSha = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() }
  catch { return 'dev' }
})()
const buildTime = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  base: '/detitular/',
  define: {
    __APP_VERSION__: JSON.stringify(gitSha),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  server: {
    port: 5174,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Academia de Fútbol',
        short_name: 'FutbolAcademy',
        description: 'Aplicación oficial de la Academia de Fútbol - Gestión de eventos, inscripciones y experiencias',
        theme_color: '#991b1b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/detitular/',
        start_url: '/detitular/',
        icons: [
          {
            src: '/icons/icon-72x72.svg',
            sizes: '72x72',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-96x96.svg',
            sizes: '96x96',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-128x128.svg',
            sizes: '128x128',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-144x144.svg',
            sizes: '144x144',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-152x152.svg',
            sizes: '152x152',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-384x384.svg',
            sizes: '384x384',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        navigateFallback: '/detitular/index.html',
        navigateFallbackDenylist: [/^\/detitular\/__/],
        // Estrategias de cache
        runtimeCaching: [
          {
            // Shell HTML: NetworkFirst para tomar versiones nuevas en cuanto haya red
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' ||
              url.pathname.endsWith('.html') ||
              url.pathname === '/detitular/' ||
              url.pathname === '/detitular',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-shell',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            // version.json: NetworkFirst con TTL muy corto, fuente de verdad para detección
            urlPattern: /\/detitular\/version\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'version-check',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 1, maxAgeSeconds: 60 }
            }
          },
          {
            // Cache para imágenes
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              }
            }
          },
          {
            // Cache para fuentes
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              }
            }
          },
          {
            // Network first para API de Firebase
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 día
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache para Firebase Storage
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 días
              }
            }
          }
        ],
        // Precache de archivos estáticos (sin html: el shell va por NetworkFirst)
        globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}']
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})
