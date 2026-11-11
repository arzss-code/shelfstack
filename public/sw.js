const CACHE_PREFIX = 'shelfstack-static-'
const CACHE_NAME = `${CACHE_PREFIX}v1`

const PRECACHE_URLS = [
  '/site.webmanifest',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/logo.svg',
]

const STATIC_ASSET_PATHS = new Set([
  '/site.webmanifest',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/logo.svg',
])

const BYPASS_PATH_PREFIXES = ['/api', '/auth', '/admin', '/checkout', '/orders', '/account']

const BLOCKED_THIRD_PARTY_HOSTS = ['supabase.co', 'midtrans.com']

function isBypassedPath(pathname) {
  return BYPASS_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function isBlockedThirdPartyHost(hostname) {
  const normalized = hostname.toLowerCase()
  return BLOCKED_THIRD_PARTY_HOSTS.some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`),
  )
}

function isCacheableStaticAsset(pathname) {
  if (isBypassedPath(pathname)) {
    return false
  }
  if (STATIC_ASSET_PATHS.has(pathname)) {
    return true
  }
  if (pathname.startsWith('/favicon')) {
    return /\.(svg|png|ico)$/i.test(pathname)
  }
  if (pathname.startsWith('/images/')) {
    return /\.(png|jpe?g|webp|avif|svg|gif|ico)$/i.test(pathname)
  }
  return false
}

function sanitizeNotificationUrl(rawUrl) {
  if (typeof rawUrl !== 'string') {
    return '/'
  }
  const trimmed = rawUrl.trim()
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('\r') ||
    trimmed.includes('\n') ||
    trimmed.includes('\0')
  ) {
    return '/'
  }

  try {
    const origin = self.location?.origin || 'https://shelfstack.id'
    const parsed = new URL(trimmed, origin)
    if (parsed.origin !== origin || parsed.pathname.startsWith('//')) {
      return '/'
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/'
  }
}

function parsePushPayload(data) {
  const defaults = {
    title: 'ShelfStack',
    body: 'Ada pembaruan terbaru pada akun atau pesanan Anda.',
    url: '/',
    tag: 'shelfstack-notification',
    icon: '/apple-touch-icon.png',
    badge: '/favicon-32x32.png',
  }

  if (!data) {
    return defaults
  }

  try {
    const parsed = data.json()
    if (parsed && typeof parsed === 'object') {
      const title =
        typeof parsed.title === 'string' && parsed.title.trim()
          ? parsed.title.trim()
          : defaults.title
      const bodyCandidate =
        typeof parsed.body === 'string' && parsed.body.trim()
          ? parsed.body.trim()
          : typeof parsed.message === 'string' && parsed.message.trim()
            ? parsed.message.trim()
            : defaults.body
      const tag =
        typeof parsed.tag === 'string' && parsed.tag.trim() ? parsed.tag.trim() : defaults.tag

      return {
        title,
        body: bodyCandidate,
        url: sanitizeNotificationUrl(parsed.url ?? parsed.reference_url),
        tag,
        icon: defaults.icon,
        badge: defaults.badge,
      }
    }
  } catch {
    // Fallback to plain text payload when JSON parsing fails
  }

  try {
    const text = data.text()
    if (typeof text === 'string' && text.trim()) {
      return {
        ...defaults,
        body: text.trim(),
      }
    }
  } catch {
    // Ignore unreadable push payload and return defaults
  }

  return defaults
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (!request || request.method !== 'GET') {
    return
  }

  let parsedUrl
  try {
    parsedUrl = new URL(request.url)
  } catch {
    return
  }

  const origin = self.location?.origin
  if (!origin || parsedUrl.origin !== origin || isBlockedThirdPartyHost(parsedUrl.hostname)) {
    return
  }

  if (!isCacheableStaticAsset(parsedUrl.pathname)) {
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request)
      if (cachedResponse) {
        return cachedResponse
      }

      try {
        const networkResponse = await fetch(request)
        if (
          networkResponse &&
          networkResponse.ok &&
          networkResponse.type !== 'opaque' &&
          networkResponse.type !== 'error'
        ) {
          await cache.put(request, networkResponse.clone())
        }
        return networkResponse
      } catch {
        return new Response('Static asset unavailable offline', {
          status: 503,
          statusText: 'Service Unavailable',
        })
      }
    }),
  )
})

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event.data)
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: {
        url: payload.url,
      },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification?.close()
  const targetPath = sanitizeNotificationUrl(event.notification?.data?.url)
  const origin = self.location?.origin || ''
  const targetUrl = origin ? `${origin}${targetPath}` : targetPath
  const swClients = self.clients || clients

  event.waitUntil(
    swClients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (!client || typeof client.focus !== 'function') {
          continue
        }
        if (typeof client.url === 'string' && (!origin || client.url.startsWith(origin))) {
          if (typeof client.navigate === 'function' && client.url !== targetUrl) {
            try {
              await client.navigate(targetUrl)
            } catch {
              // Ignore navigation failure and focus existing client window
            }
          }
          return client.focus()
        }
      }

      if (typeof swClients.openWindow === 'function') {
        return swClients.openWindow(targetUrl)
      }
      return undefined
    }),
  )
})
