const CACHE_NAME = 'xoai-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS = [
  '/',                 // halaman utama
  '/offline.html',
  // '/styles.css',       // tambahkan asset penting
  '/chat.js'
];

// install: simpan asset dasar
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();        // paksa aktif
});

// activate: hapus cache lama jika ada
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME)
                      .map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch: network-first → fallback cache → offline.html
self.addEventListener('fetch', event => {
  const { request } = event;

  // hanya tangani permintaan navigasi dokumen
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)                 // coba jaringan dulu
        .then(res => {
          // simpan halaman baru ke cache (optional)
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request)      // ada di cache?
            .then(res => res || caches.match(OFFLINE_URL))
        )
    );
  }
});
