const CACHE_NAME = 'xoai-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS = [
  '/',
  OFFLINE_URL,
  '/chat.js',
];

// Install: cache asset penting termasuk offline.html
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama yang tidak cocok
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first untuk navigasi, fallback ke cache & offline.html
self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Simpan cache response terbaru
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          // Kalau jaringan gagal, cari di cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          // Kalau tidak ada di cache, tampilkan offline.html
          return caches.match(OFFLINE_URL);
        })
    );
  }
  else {
    // Untuk request selain navigasi, coba respon cache dulu baru jaringan
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        return cachedResponse || fetch(request);
      })
    );
  }
});
