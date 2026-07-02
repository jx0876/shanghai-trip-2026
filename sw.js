const APP_CACHE = 'shanghai-trip-app-v1';
const TILE_CACHE = 'shanghai-trip-tiles-v1';
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './app-icon.svg',
  './offline-tile.svg',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './fonts/chinese-traditional-400-normal.woff2',
  './fonts/chinese-traditional-700-normal.woff2',
  './fonts/latin-400-normal.woff2',
  './fonts/latin-700-normal.woff2',
  './img/ferry.jpg',
  './img/haidilao.jpg',
  './img/jianbing.jpg',
  './img/nanjing_road.jpg',
  './img/shengjian.jpg',
  './img/starbucks.jpg',
  './img/suancaiyu.jpg',
  './img/the_bund.jpg',
  './img/wukang_bldg.jpg',
  './img/xiaolongbao.jpg',
  './img/yuyuan.jpg',
  './img/zhujiajiao.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => ![APP_CACHE, TILE_CACHE].includes(key))
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if(event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);

  if(url.hostname === 'tile.openstreetmap.org'){
    event.respondWith(cacheFirst(request, TILE_CACHE, 350));
    return;
  }

  if(url.origin === location.origin){
    event.respondWith(networkFirst(request, APP_CACHE));
  }
});

async function networkFirst(request, cacheName){
  const cache = await caches.open(cacheName);
  try{
    const fresh = await fetch(request);
    if(fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  }catch(error){
    return (await cache.match(request)) || cache.match('./index.html');
  }
}

async function cacheFirst(request, cacheName, limit){
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if(cached) return cached;
  try{
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    trimCache(cacheName, limit);
    return fresh;
  }catch(error){
    return caches.match('./offline-tile.svg');
  }
}

async function trimCache(cacheName, limit){
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if(keys.length <= limit) return;
  await cache.delete(keys[0]);
  trimCache(cacheName, limit);
}
