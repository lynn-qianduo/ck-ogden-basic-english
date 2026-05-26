// sw.js - Basic English 850 离线缓存
const CACHE_NAME = 'basic850-v1.0.1';
const OFFLINE_URL = '/offline.html';

// 需要缓存的文件列表
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/style.css',
  '/js/storage.js',
  '/js/utils.js',
  '/js/core.js',
  '/js/search.js',
  '/modules/words.js',
  '/modules/quiz.js',
  '/modules/stats.js',
  '/modules/ai.js',
  '/modules/plan.js',
  '/modules/sentenceDatabase.js',
  '/data/words.csv',
];

// 安装 Service Worker - 缓存文件
self.addEventListener('install', event => {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 缓存文件');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] 缓存失败', err);
      })
  );
  self.skipWaiting();
});

// 激活 Service Worker - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] 激活中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // API 请求 - 网络优先
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // 静态资源 - 缓存优先
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then(response => {
            // 缓存新请求
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // 离线时返回离线页面
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// 后台同步（可选）
self.addEventListener('sync', event => {
  console.log('[SW] 后台同步', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // 这里可以实现离线数据的同步逻辑
  console.log('[SW] 同步数据');
}