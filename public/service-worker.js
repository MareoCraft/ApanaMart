const CACHE_NAME = 'apanamart-cache-v2'
const PRE_CACHE = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

function shouldCache(request, url) {
  if (request.method !== 'GET') return false
  if (url.origin !== self.location.origin) return false

  // Avoid caching Vite/dev internals and API-like endpoints if ever added.
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/__')) return false

  return true
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (!shouldCache(request, url)) return

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
        }
        return networkResponse
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request)
        if (cachedResponse) return cachedResponse

        if (request.mode === 'navigate') {
          return caches.match('/')
        }

        throw new Error('Network error and no cached response available.')
      }),
  )
})
