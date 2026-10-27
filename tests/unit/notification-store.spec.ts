import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationStore } from '../../app/features/notifications/stores/notifications'
import type { NotificationItem } from '../../shared/schemas/notification'

// Gunakan vi.hoisted agar mockFetch aman saat vi.mock di-hoist
const { mockFetch } = vi.hoisted(() => {
  const mockFn: any = vi.fn().mockResolvedValue({ success: true, data: {} })
  mockFn.create = () => mockFn
  mockFn.raw = vi.fn()
  return { mockFetch: mockFn }
})

vi.mock('ofetch', () => {
  return {
    $fetch: mockFetch,
    ofetch: mockFetch,
    createFetch: () => mockFetch,
  }
})

// Mock useUiToast
vi.mock('~/composables/useUiToast', () => ({
  useUiToast: () => ({
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    danger: vi.fn(),
  }),
}))

const mockNotifA: NotificationItem = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  title: 'Pesanan Dibuat',
  message: 'Pesanan ORD-001 telah berhasil dibuat.',
  type: 'order_created',
  reference_id: 'ORD-001',
  reference_url: '/orders/ORD-001',
  is_read: false,
  read_at: null,
  created_at: '2026-10-27T10:00:00.000Z',
}

const mockNotifB: NotificationItem = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  title: 'Pembayaran Dikonfirmasi',
  message: 'Pembayaran pesanan ORD-001 telah kami terima.',
  type: 'payment_success',
  reference_id: 'ORD-001',
  reference_url: '/orders/ORD-001',
  is_read: false,
  read_at: null,
  created_at: '2026-10-27T10:05:00.000Z',
}

describe('useNotificationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      success: true,
      data: {
        notifications: [mockNotifA, mockNotifB],
        unread_count: 2,
      },
    })
    vi.stubGlobal('$fetch', mockFetch)
  })

  it('menginisialisasi store dalam keadaan kosong secara default', () => {
    const store = useNotificationStore()

    expect(store.items).toEqual([])
    expect(store.unreadCount).toBe(0)
    expect(store.isLoading).toBe(false)
    expect(store.isOpen).toBe(false)
  })

  it('mengendalikan status buka/tutup popover dropdown (toggle & close)', () => {
    const store = useNotificationStore()

    expect(store.isOpen).toBe(false)
    store.toggleDropdown()
    expect(store.isOpen).toBe(true)

    store.closeDropdown()
    expect(store.isOpen).toBe(false)
  })

  it('menandai satu notifikasi sebagai telah dibaca dan mengurangi unreadCount', async () => {
    const store = useNotificationStore()
    store.items = [JSON.parse(JSON.stringify(mockNotifA)), JSON.parse(JSON.stringify(mockNotifB))]
    store.unreadCount = 2

    await store.markAsRead(mockNotifA.id)

    expect(store.items[0]?.is_read).toBe(true)
    expect(store.items[0]?.read_at).toBeDefined()
    expect(store.items[1]?.is_read).toBe(false)
    expect(store.unreadCount).toBe(1)
  })

  it('tidak mengurangi unreadCount jika notifikasi sudah pernah dibaca sebelumnya', async () => {
    const store = useNotificationStore()
    const alreadyRead = { ...mockNotifA, is_read: true, read_at: '2026-10-27T10:02:00.000Z' }
    store.items = [alreadyRead]
    store.unreadCount = 0

    await store.markAsRead(alreadyRead.id)
    expect(store.unreadCount).toBe(0)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('menandai semua notifikasi telah dibaca secara serempak saat markAllAsRead dipanggil', async () => {
    const store = useNotificationStore()
    store.items = [JSON.parse(JSON.stringify(mockNotifA)), JSON.parse(JSON.stringify(mockNotifB))]
    store.unreadCount = 2

    await store.markAllAsRead()

    expect(store.unreadCount).toBe(0)
    expect(store.items.every((item) => item.is_read)).toBe(true)
  })

  it('mengabaikan pemanggilan markAllAsRead jika tidak ada notifikasi yang belum dibaca', async () => {
    const store = useNotificationStore()
    store.items = [{ ...mockNotifA, is_read: true }]
    store.unreadCount = 0

    await store.markAllAsRead()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('memuat notifikasi dan mengisi state cursor pagination', async () => {
    const store = useNotificationStore()
    mockFetch.mockResolvedValueOnce({
      success: true,
      data: {
        notifications: [mockNotifA],
        unread_count: 1,
        has_more: true,
        next_cursor: mockNotifA.created_at,
      },
    })

    await store.fetchNotifications()

    expect(store.items.length).toBe(1)
    expect(store.hasMore).toBe(true)
    expect(store.nextCursor).toBe(mockNotifA.created_at)
  })

  it('memuat halaman berikutnya via loadMore dan menambahkan item baru tanpa duplikasi', async () => {
    const store = useNotificationStore()
    store.items = [JSON.parse(JSON.stringify(mockNotifA))]
    store.hasMore = true
    store.nextCursor = mockNotifA.created_at

    mockFetch.mockResolvedValueOnce({
      success: true,
      data: {
        notifications: [mockNotifB],
        unread_count: 1,
        has_more: false,
        next_cursor: null,
      },
    })

    await store.loadMore()

    expect(store.items.length).toBe(2)
    expect(store.hasMore).toBe(false)
    expect(store.nextCursor).toBeNull()
  })

  it('mengelola izin notifikasi desktop browser via requestDesktopPermission', async () => {
    const store = useNotificationStore()
    const originalNotification = (globalThis as any).Notification
    const mockRequestPermission = vi.fn().mockResolvedValue('granted')
    ;(globalThis as any).Notification = {
      permission: 'default',
      requestPermission: mockRequestPermission,
    }

    const permission = await store.requestDesktopPermission()
    expect(permission).toBe('granted')
    expect(store.desktopPermission).toBe('granted')

    ;(globalThis as any).Notification = originalNotification
  })
})
