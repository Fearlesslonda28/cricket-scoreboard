const CACHE_NAME = "cricket-scoreboard-v5";
const ASSETS = ["./", "./index.html", "./manifest.json"];

// Install Service Worker and cache core local assets safely
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Clean old cache generations
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Dynamic Network Fetching with Exception Gateways
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch dynamic external resources (like the CDN icon) on demand
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Cache valid runtime resources dynamically for offline use
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // If completely offline and asset isn't cached, swallow errors elegantly
            return new Response("Offline resource unavailable", {
              status: 503,
            });
          });
      })
      .catch(() => fetch(event.request)),
  );
});
