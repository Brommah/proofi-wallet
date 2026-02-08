const CACHE_NAME = 'proofi-v5';
const APP_SHELL = [
  '/',
  '/app',
  '/app/index.html',
  '/app/assets/index-CIXpEU_L.js',
  '/app/assets/index-KB8AsM1G.css',
  '/app/assets/icon.svg',
  '/app/manifest.json'
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for API calls
  if (url.pathname.startsWith('/api') || url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback for navigation requests
      if (event.request.mode === 'navigate') {
        return new Response(
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Proofi - Offline</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;color:#fff;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}.offline{max-width:400px}.offline svg{width:80px;height:80px;margin-bottom:1.5rem}.offline h1{font-size:1.5rem;margin-bottom:.75rem;color:#00ff88}.offline p{color:#888;line-height:1.6;margin-bottom:1.5rem}.offline button{background:#00ff88;color:#000;border:none;padding:.75rem 2rem;border-radius:8px;font-weight:600;cursor:pointer;font-size:1rem}.offline button:hover{background:#00cc6a}</style></head><body><div class="offline"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><circle cx="256" cy="256" r="256" fill="#111"/><path d="M256 72L400 136V280Q400 380 256 448 112 380 112 280V136Z" fill="#00ff88" opacity=".3"/><text x="256" y="310" font-family="Arial" font-size="220" font-weight="bold" fill="#00ff88" text-anchor="middle" dominant-baseline="central" opacity=".5">P</text></svg><h1>You are offline</h1><p>Proofi Wallet needs an internet connection. Please check your connection and try again.</p><button onclick="location.reload()">Retry</button></div></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
    })
  );
});
