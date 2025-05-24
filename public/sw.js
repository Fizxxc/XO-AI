var urlsToPrefetch = [
  '/',
  '/offline.html',
  '/chat.js',
  '/favicon.ico',
  '/manifest.json'
];

var version = '1.0.1';

self.addEventListener("install", function(event) {
  console.log('SW: install event in progress.');
  event.waitUntil(
    caches
      .open(version + '-cache')
      .then(cache => cache.addAll(urlsToPrefetch))
      .then(() => console.log('SW: install completed'))
  );
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        const fetched = fetch(event.request)
          .then(response => {
            const responseClone = response.clone();
            caches.open(version + '-cache')
              .then(cache => cache.put(event.request, responseClone));
            return response;
          })
          .catch(() => {
            return caches.match('/offline.html');
          });

        return cached || fetched;
      })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => !k.startsWith(version))
            .map(k => caches.delete(k))
      );
    })
  );
});
