const CACHE = 'quotronex-v1';
const OFFLINE_URL = '/offline';

const PRECACHE = [
  '/',
  '/app',
  '/offline',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Skip Supabase, API, and auth requests — always network
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(r => r ?? caches.match(OFFLINE_URL))
    )
  );
});
