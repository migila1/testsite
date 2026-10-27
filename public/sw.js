const CACHE = 'mijn-uitgaven-shell-v2'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

function networkFirst(request) {
  return fetch(request)
    .then((res) => {
      if (res.ok) {
        caches.open(CACHE).then((cache) => cache.put(request, res.clone()))
      }
      return res
    })
    .catch(() => caches.open(CACHE).then((cache) => cache.match(request)))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(networkFirst(request))
    return
  }

  if (SHELL.includes(url.pathname)) {
    event.respondWith(networkFirst(request))
  }
})
