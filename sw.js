// Service Worker for VocaFlash PWA

const CACHE_NAME = 'vocaflash-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './js/cloud.js',
  './js/srs.js',
  './js/utils/helpers.js',
  './js/utils/speech.js',
  './js/utils/chart.js',
  './js/views/dashboard.js',
  './js/views/deckDetail.js',
  './js/views/study.js',
  './js/views/settings.js',
  './js/views/stats.js',
  './js/modes/flashcard.js',
  './js/modes/srsReview.js',
  './js/modes/quiz.js',
  './js/modes/typing.js',
  './js/modes/matching.js',
  './js/modes/listening.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network first, fallback to cache for static assets
  if (e.request.method !== 'GET') return;
  
  // Exclude API requests from SW cache
  if (e.request.url.includes('dictionaryapi.dev') || e.request.url.includes('firebaseio.com') || e.request.url.includes('translated.net') || e.request.url.includes('wikimedia.org')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
