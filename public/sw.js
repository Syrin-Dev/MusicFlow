
// Service Worker for Hievly PWA
// Helps with PWA recognition and keeping the app 'active'

self.addEventListener('install', (event) => {
    // Force this service worker to become the active service worker
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Claim any clients immediately, so they are controlled by this SW
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass-through fetch to keep the service worker active on network requests
    // This helps signal to the OS that the app is doing work
    event.respondWith(fetch(event.request));
});
