import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import NotificationHeader from '~/components/notification/NotificationHeader.vue'
import { showDesktopNotification } from '~/utils/desktop-notification'
import { registerServiceWorker, shouldSkipServiceWorkerRegistration } from '~/plugins/sw.client'

const { mockNavigateTo } = vi.hoisted(() => ({ mockNavigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => mockNavigateTo)

interface SwEvent {
  waitUntil: (promise: Promise<unknown>) => void
  respondWith?: (promise: Promise<Response>) => void
  request?: { method: string; url: string }
  data?: { json: () => unknown; text: () => string } | null
  notification?: { close: () => void; data?: { url?: string } }
}

const swSource = fs.readFileSync(path.resolve(process.cwd(), 'public/sw.js'), 'utf-8')

function createSwHarness() {
  const listeners = new Map<string, (e: SwEvent) => void>()
  const cacheStore = { addAll: vi.fn().mockResolvedValue(undefined), match: vi.fn(), put: vi.fn() }
  const clientsApi = {
    claim: vi.fn().mockResolvedValue(undefined),
    matchAll: vi.fn(),
    openWindow: vi.fn(),
  }
  const reg = { showNotification: vi.fn().mockResolvedValue(undefined) }
  const cachesApi = { open: vi.fn().mockResolvedValue(cacheStore), keys: vi.fn(), delete: vi.fn() }
  const fetchMock = vi.fn()
  const skipWaiting = vi.fn().mockResolvedValue(undefined)
  const self = {
    location: { origin: 'https://shelfstack.atsiilaarya.me' },
    skipWaiting,
    clients: clientsApi,
    registration: reg,
    addEventListener: (t: string, h: (e: SwEvent) => void) => listeners.set(t, h),
  }
  vm.runInNewContext(swSource, {
    self,
    caches: cachesApi,
    clients: clientsApi,
    fetch: fetchMock,
    URL,
    Response,
    Request,
  })
  return { listeners, cacheStore, cachesApi, clientsApi, reg, fetchMock, skipWaiting }
}

async function dispatchWaitUntil(
  h: ((e: SwEvent) => void) | undefined,
  e: Omit<SwEvent, 'waitUntil'>,
) {
  let pending: Promise<unknown> | undefined
  h?.({ ...e, waitUntil: (p) => (pending = p) })
  await pending
}

function setGlobals(nav: unknown, notif: unknown) {
  Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true })
  Object.defineProperty(globalThis, 'Notification', { value: notif, configurable: true })
}

describe('PWA Service Worker & Browser Notification Suite', () => {
  const origNav = globalThis.navigator
  const origNotif = globalThis.Notification
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => setGlobals(origNav, origNotif))

  describe('public/sw.js lifecycle, bypass rules, push and click', () => {
    it('precaches safe shell assets on install and purges old caches on activate', async () => {
      const sw = createSwHarness()
      await dispatchWaitUntil(sw.listeners.get('install'), {})
      expect(sw.cachesApi.open).toHaveBeenCalledWith('shelfstack-static-v2')
      const shellAssets =
        '/site.webmanifest /favicon.svg /favicon-32x32.png /apple-touch-icon.png /logo.svg'.split(
          ' ',
        )
      expect(sw.cacheStore.addAll).toHaveBeenCalledWith(shellAssets)
      expect(sw.skipWaiting).toHaveBeenCalledTimes(1)

      sw.cachesApi.keys.mockResolvedValueOnce(
        'shelfstack-static-v1 shelfstack-static-v2 other'.split(' '),
      )
      await dispatchWaitUntil(sw.listeners.get('activate'), {})
      expect(sw.cachesApi.delete).toHaveBeenCalledTimes(1)
      expect(sw.cachesApi.delete).toHaveBeenCalledWith('shelfstack-static-v1')
      expect(sw.clientsApi.claim).toHaveBeenCalledTimes(1)
    })

    it('bypasses non-GET, sensitive routes, dynamic HTML, and third-party origins', () => {
      const sw = createSwHarness()
      const fetchHandler = sw.listeners.get('fetch')
      const paths =
        '/api/products /auth/callback /admin/orders /checkout /orders/ORD-100 /account/profile / /sw.js'.split(
          ' ',
        )
      const bypassed: Array<[string, string]> = [
        ['POST', 'https://shelfstack.atsiilaarya.me/images/auth-showcase.jpg'],
        ['DELETE', 'https://shelfstack.atsiilaarya.me/api/orders/1'],
        ...paths.map((p): [string, string] => ['GET', `https://shelfstack.atsiilaarya.me${p}`]),
        ['GET', 'https://demo.supabase.co/storage/v1/object/public/images/a.png'],
        ['GET', 'https://app.midtrans.com/snap/snap.js'],
      ]
      for (const [method, url] of bypassed) {
        const respondWith = vi.fn()
        fetchHandler?.({ waitUntil: vi.fn(), respondWith, request: { method, url } })
        expect(respondWith, `Expected bypass for ${method} ${url}`).not.toHaveBeenCalled()
      }
    })

    it('serves cached shell cache-first, revalidates /images/ in background, and caches misses', async () => {
      const sw = createSwHarness()
      const fetchHandler = sw.listeners.get('fetch')
      const invoke = (url: string) => {
        let resP: Promise<Response> | undefined
        let bgP: Promise<unknown> | undefined
        fetchHandler?.({
          waitUntil: (p) => (bgP = p),
          respondWith: (p) => (resP = p),
          request: { method: 'GET', url },
        })
        return { resP, getBg: () => bgP }
      }

      const hit = new Response('svg', { status: 200 })
      sw.cacheStore.match.mockResolvedValueOnce(hit)
      expect(await invoke('https://shelfstack.atsiilaarya.me/favicon.svg').resP).toBe(hit)
      expect(sw.fetchMock).not.toHaveBeenCalled()

      sw.cacheStore.match.mockResolvedValueOnce(hit)
      sw.fetchMock.mockResolvedValueOnce(new Response('fresh-img', { status: 200 }))
      const imgCall = invoke('https://shelfstack.atsiilaarya.me/images/products/kettle.jpg')
      expect(await imgCall.resP).toBe(hit)
      await imgCall.getBg()
      expect(sw.fetchMock).toHaveBeenCalledWith(expect.anything(), { cache: 'no-cache' })
      expect(sw.cacheStore.put).toHaveBeenCalledTimes(1)

      sw.cacheStore.match.mockResolvedValueOnce(undefined)
      sw.fetchMock.mockResolvedValueOnce(new Response('img', { status: 200 }))
      expect(
        (await invoke('https://shelfstack.atsiilaarya.me/images/auth-showcase.jpg').resP)?.status,
      ).toBe(200)
      expect(sw.cacheStore.put).toHaveBeenCalledTimes(2)
    })

    it('parses push payloads, falls back safely, and sanitizes external notification URLs', async () => {
      const sw = createSwHarness()
      const pushHandler = sw.listeners.get('push')
      await dispatchWaitUntil(pushHandler, {
        data: {
          json: () => ({ title: 'Order Lunas', body: 'Siap dikirim', url: '//evil.com' }),
          text: () => '',
        },
      })
      expect(sw.reg.showNotification).toHaveBeenLastCalledWith(
        'Order Lunas',
        expect.objectContaining({ body: 'Siap dikirim', data: { url: '/' } }),
      )

      await dispatchWaitUntil(pushHandler, {
        data: { json: () => JSON.parse('{'), text: () => 'Pesan teks biasa' },
      })
      expect(sw.reg.showNotification).toHaveBeenLastCalledWith(
        'ShelfStack',
        expect.objectContaining({ body: 'Pesan teks biasa', data: { url: '/' } }),
      )
    })

    it('focuses same-origin client or opens safe window on notificationclick', async () => {
      const sw = createSwHarness()
      const clickHandler = sw.listeners.get('notificationclick')
      const closeMock = vi.fn()
      const focusMock = vi.fn().mockResolvedValue(undefined)
      const navigateMock = vi.fn().mockResolvedValue(undefined)
      sw.clientsApi.matchAll.mockResolvedValueOnce([
        {
          url: 'https://shelfstack.atsiilaarya.me/katalog',
          focus: focusMock,
          navigate: navigateMock,
        },
      ])
      await dispatchWaitUntil(clickHandler, {
        notification: { close: closeMock, data: { url: '/orders/ORD-77' } },
      })
      expect(closeMock).toHaveBeenCalledTimes(1)
      expect(navigateMock).toHaveBeenCalledWith('https://shelfstack.atsiilaarya.me/orders/ORD-77')
      expect(focusMock).toHaveBeenCalledTimes(1)

      sw.clientsApi.matchAll.mockResolvedValueOnce([])
      await dispatchWaitUntil(clickHandler, {
        notification: { close: closeMock, data: { url: 'https://evil.com' } },
      })
      expect(sw.clientsApi.openWindow).toHaveBeenCalledWith('https://shelfstack.atsiilaarya.me/')
    })
  })

  describe('progressive notification, header UI, SW registration & CSP', () => {
    it('prefers SW showNotification when registered/ready and falls back without hanging', async () => {
      const showNotification = vi.fn().mockResolvedValue(undefined)
      const instances: Array<{ onclick?: () => void }> = []
      class MockNotification {
        static permission = 'granted'
        onclick?: () => void
        constructor() {
          instances.push(this)
        }
      }
      const focusSpy = vi.spyOn(window, 'focus').mockImplementation(() => {})
      const getReg = vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ active: {}, showNotification })
      setGlobals(
        {
          serviceWorker: {
            controller: {},
            getRegistration: getReg,
            ready: Promise.resolve({ active: {}, showNotification }),
          },
        },
        MockNotification,
      )
      await showDesktopNotification('Status', 'Dikirim', '/orders/ORD-1', 'ord-1')
      await showDesktopNotification('Lunas', 'OK', '/orders/ORD-2', 'ord-2')
      expect(showNotification).toHaveBeenCalledTimes(2)
      expect(instances).toHaveLength(0)

      setGlobals(
        {
          serviceWorker: {
            controller: null,
            getRegistration: vi.fn().mockResolvedValue(undefined),
            ready: new Promise(() => {}),
          },
        },
        MockNotification,
      )
      await showDesktopNotification('Promo', 'Diskon', '/promos', 'promo-1')
      expect(instances).toHaveLength(1)
      instances[0]?.onclick?.()
      expect(focusSpy).toHaveBeenCalledTimes(1)
      expect(mockNavigateTo).toHaveBeenCalledWith('/promos')
    })

    it('skips SW registration in test runtime, registers when bypassed, and updates header', async () => {
      expect(shouldSkipServiceWorkerRegistration()).toBe(true)
      const registerMock = vi.fn().mockResolvedValue({ scope: '/' })
      const nav = { serviceWorker: { register: registerMock } } as unknown as Navigator
      expect(await registerServiceWorker({ navigatorRef: nav })).toBeNull()
      expect(registerMock).not.toHaveBeenCalled()
      await registerServiceWorker({ bypassTestGuard: true, navigatorRef: nav })
      expect(registerMock).toHaveBeenCalledWith('/sw.js', { scope: '/' })
      const badNav = {
        serviceWorker: { register: vi.fn().mockRejectedValue(new Error('SecurityError')) },
      } as unknown as Navigator
      expect(
        await registerServiceWorker({ bypassTestGuard: true, navigatorRef: badNav }),
      ).toBeNull()

      const w1 = mount(NotificationHeader, {
        props: { unreadCount: 1, totalCount: 3, desktopPermission: 'default', activeTab: 'all' },
      })
      expect(w1.text()).toContain('Aktifkan Notifikasi Browser')
      const w2 = mount(NotificationHeader, {
        props: { unreadCount: 0, totalCount: 3, desktopPermission: 'granted', activeTab: 'all' },
      })
      expect(w2.text()).toContain('Notifikasi Browser Aktif')
    })

    it('configures CSP worker-src self, sw.js no-cache, dev skip, and size limits', () => {
      const files =
        'public/sw.js app/plugins/sw.client.ts app/utils/desktop-notification.ts app/components/notification/NotificationHeader.vue nuxt.config.ts eslint.config.mjs tests/unit/pwa-service-worker.spec.ts'.split(
          ' ',
        )
      for (const rel of files) {
        const src = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf-8')
        expect(src.split('\n').length, `${rel} > 300 lines`).toBeLessThanOrEqual(300)
        expect(src, `${rel} has em dash`).not.toContain('\u2014')
        expect(src, `${rel} has any`).not.toMatch(/:\s*any\b|\bas\s+any\b/)
        if (rel === 'nuxt.config.ts') {
          expect(src).toContain("'worker-src': [\"'self'\"]")
          expect(src).toContain("'/sw.js'")
          expect(src).toContain('no-cache, no-store, must-revalidate')
        }
        if (rel === 'app/plugins/sw.client.ts') expect(src).toContain('import.meta.dev')
      }
    })
  })
})
