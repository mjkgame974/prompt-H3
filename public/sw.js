/**
 * MiniMax H3 Assistant — Service Worker
 * Strategy: pre-cache critical shell + stale-while-revalidate for runtime assets.
 * Activated only in production (Vite injects the env check from main.tsx).
 */

/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'minimax-h3-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Critical assets that must be available offline (the app shell).
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests — never cache POST/PUT/DELETE etc.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept cross-origin requests (e.g. Gemini, Unsplash, Google Fonts).
  if (url.origin !== self.location.origin) return;

  // Never intercept API calls — they must always hit the network.
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests (HTML) — network-first, fallback to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (err) {
          const cached = await caches.match('/index.html');
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) — stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkPromise;
    })()
  );
});
