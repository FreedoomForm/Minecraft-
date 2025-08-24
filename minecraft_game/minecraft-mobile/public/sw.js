// Service Worker для PWA Minecraft Mobile
const CACHE_NAME = 'minecraft-mobile-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/data/blocks/block_catalog.json',
  '/data/items/item_catalog.json',
  '/data/recipes/recipe_catalog.json',
  '/data/mechanics/game_mechanics.json',
  '/data/systems/crafting_system.json',
  '/data/systems/inventory_system.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Кэширование ресурсов');
        return cache.addAll(urlsToCache.filter(url => url !== '/' || location.pathname === '/'));
      })
      .catch((error) => {
        console.warn('SW: Ошибка кэширования:', error);
      })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  // Пропускаем non-GET запросы
  if (event.request.method !== 'GET') {
    return;
  }

  // Пропускаем Chrome extension запросы
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кэшированный ресурс если он есть
        if (response) {
          return response;
        }

        // Иначе загружаем из сети
        return fetch(event.request).then((response) => {
          // Проверяем что ответ валиден
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Клонируем ответ так как он stream
          const responseToCache = response.clone();

          // Кэшируем ресурсы для будущего использования
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.warn('SW: Ошибка кэширования:', error);
            });

          return response;
        });
      })
      .catch(() => {
        // Если сеть недоступна, возвращаем офлайн-страницу
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
        
        // Для остальных ресурсов возвращаем 404
        return new Response('', {
          status: 404,
          statusText: 'Not Found'
        });
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const { urls } = event.data;
    caches.open(CACHE_NAME).then(cache => {
      cache.addAll(urls);
    });
  }
});

// Обработка push-уведомлений (опционально)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Новое обновление Minecraft Mobile!',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: data,
      actions: [
        {
          action: 'open',
          title: 'Открыть игру',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Закрыть'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Minecraft Mobile', options)
    );
  }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});