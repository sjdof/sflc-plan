/* 离线缓存：网络优先，断网时回落到缓存。
   健身房里信号差的时候，页面照样能打开。 */

const CACHE = 'sflc-v1';

const SHELL = [
  './',
  './index.html',
  './day1.html',
  './day2.html',
  './day3.html',
  './params.html',
  './assets/style.css',
  './assets/app.js',
  './icon.svg',
  './manifest.webmanifest'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isFont = FONT_HOSTS.includes(url.hostname);
  const isLocal = url.origin === self.location.origin;
  if (!isFont && !isLocal) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 不缓存失败响应，也不缓存 opaque 之外的非 200 本地资源
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
