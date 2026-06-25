// This is the service worker with the combined offline experience
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A dummy fetch listener is required to pass the PWA install criteria.
  // We are not caching anything here, just letting all requests pass through.
});
