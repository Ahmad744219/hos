const CACHE = 'microapps-cache-v1';
const OFFLINE_URL = '/';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  // add any icon paths you put in /icons/
];

self.addEventListener('install', ev=>{
  ev.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', ev=>{
  ev.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', ev=>{
  const req = ev.request;
  // always try network first for HTML pages, fallback to cache
  if(req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'))){
    ev.respondWith(fetch(req).then(res => { caches.open(CACHE).then(c=>c.put(req, res.clone())); return res; }).catch(()=> caches.match(OFFLINE_URL)));
    return;
  }
  // for other requests, cache-first
  ev.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    // don't cache non-GET / external cross-origin by default
    if(req.method === 'GET' && req.url.startsWith(self.location.origin)) {
      caches.open(CACHE).then(c=>c.put(req, res.clone()));
    }
    return res;
  })));
});
