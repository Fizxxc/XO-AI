// @ts-check

/* ------------ Konstanta ------------ */
const CACHE_NAME   = 'xoai-v1';
const OFFLINE_URL  = '/offline.html';
const CORE_ASSETS  = [
  '/',               // halaman utama
  OFFLINE_URL,
  '/chat.js'
];

/* ---------- INSTALL: seed cache ---------- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS))
  );
  self.skipWaiting();     // langsung aktif
});

/* ---------- ACTIVATE: bersih-bersih ---------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ---------- FETCH: network-first ---------- */
self.addEventListener('fetch', event => {
  // Hanya tangani permintaan dokumen (HTML)
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request)
      .then(res => {
        // Simpan salinan halaman terbaru
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      })
      .catch(() =>
        // offline → coba cache → fallback offline.html
        caches.match(event.request).then(res => res || caches.match(OFFLINE_URL))
      )
  );
});
