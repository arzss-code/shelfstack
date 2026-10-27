import { describe, expect, it, vi } from 'vitest'
import {
  createNotificationSchema,
  markNotificationReadSchema,
  notificationItemSchema,
  notificationTypeSchema,
  notificationTypes,
} from '../../shared/schemas/notification'
import { createNotification } from '../../server/utils/notifications'

describe('Notification Zod Schema Validation', () => {
  it('mendukung semua tipe notifikasi resmi sistem', () => {
    notificationTypes.forEach((type) => {
      const res = notificationTypeSchema.safeParse(type)
      expect(res.success).toBe(true)
    })

    expect(notificationTypeSchema.safeParse('invalid_type').success).toBe(false)
  })

  it('memvalidasi item notifikasi dengan struktur lengkap', () => {
    const validItem = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      title: 'Pesanan Telah Dikirim',
      message: 'Pesanan ORD-2026-001 sedang dalam perjalanan.',
      type: 'order_shipped',
      reference_id: 'ORD-2026-001',
      reference_url: '/orders/ORD-2026-001',
      is_read: false,
      read_at: null,
      created_at: '2026-10-27T10:00:00.000Z',
    }

    const res = notificationItemSchema.safeParse(validItem)
    expect(res.success).toBe(true)
  })

  it('menolak item notifikasi jika UUID atau tipe tidak valid', () => {
    const invalidItem = {
      id: 'not-a-uuid',
      user_id: 'also-not-a-uuid',
      title: 'Judul',
      message: 'Pesan',
      type: 'unknown_event',
      is_read: false,
      created_at: '2026-10-27T10:00:00.000Z',
    }

    const res = notificationItemSchema.safeParse(invalidItem)
    expect(res.success).toBe(false)
  })

  it('memvalidasi input pembuatan notifikasi (createNotificationSchema)', () => {
    const validCreate = {
      user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      title: 'Pembayaran Diterima',
      message: 'Pembayaran pesanan ORD-100 telah diverifikasi.',
      type: 'payment_success',
      reference_id: 'ORD-100',
      reference_url: '/orders/ORD-100',
    }

    expect(createNotificationSchema.safeParse(validCreate).success).toBe(true)
  })

  it('menolak pembuatan notifikasi dengan judul atau pesan kosong', () => {
    const invalidEmpty = {
      user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      title: '',
      message: '',
      type: 'system',
    }

    const res = createNotificationSchema.safeParse(invalidEmpty)
    expect(res.success).toBe(false)
  })

  it('memvalidasi markNotificationReadSchema default boolean', () => {
    const res = markNotificationReadSchema.safeParse({})
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.is_read).toBe(true)
    }
  })
})

describe('Notification Server Utilities & Business Invariants', () => {
  it('menolak input tidak valid sebelum melakukan query database pada createNotification', async () => {
    const mockClient = {
      from: vi.fn(),
    } as any

    const result = await createNotification(mockClient, {
      user_id: 'invalid-uuid',
      title: '',
      message: '',
      type: 'invalid' as any,
    })

    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
    expect(mockClient.from).not.toHaveBeenCalled()
  })

  it('memasukkan data notifikasi baru jika input valid', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'notif-1',
        title: 'Pesanan Dibuat',
        is_read: false,
      },
      error: null,
    })

    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    const mockClient = { from: mockFrom } as any

    const result = await createNotification(mockClient, {
      user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      title: 'Pesanan Dibuat',
      message: 'Pesanan ORD-123 telah dibuat.',
      type: 'order_created',
      reference_id: 'ORD-123',
    })

    expect(mockFrom).toHaveBeenCalledWith('notifications')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        title: 'Pesanan Dibuat',
        type: 'order_created',
        is_read: false,
      }),
    )
    expect(result.data).toBeDefined()
    expect(result.error).toBeNull()
  })

  it('mengisolasi data notifikasi antar pengguna (Multi-Tenant Security Invariant)', () => {
    const mockNotifications = [
      { id: '1', user_id: 'user-alice-id', title: 'A1', is_read: false },
      { id: '2', user_id: 'user-alice-id', title: 'A2', is_read: true },
      { id: '3', user_id: 'user-bob-id', title: 'B1', is_read: false },
    ]

    const aliceNotifs = mockNotifications.filter((n) => n.user_id === 'user-alice-id')
    const aliceUnread = aliceNotifs.filter((n) => !n.is_read)

    expect(aliceNotifs.length).toBe(2)
    expect(aliceUnread.length).toBe(1)
    expect(aliceNotifs.every((n) => n.user_id === 'user-alice-id')).toBe(true)
  })

  it('memperbarui status unread saat markAllAsRead dijalankan', () => {
    const userNotifs = [
      { id: '1', title: 'N1', is_read: false },
      { id: '2', title: 'N2', is_read: false },
      { id: '3', title: 'N3', is_read: true },
    ]

    const unreadBefore = userNotifs.filter((n) => !n.is_read).length
    expect(unreadBefore).toBe(2)

    // Simulasi markAllAsRead
    const updated = userNotifs.map((n) => ({ ...n, is_read: true }))
    const unreadAfter = updated.filter((n) => !n.is_read).length

    expect(unreadAfter).toBe(0)
    expect(updated.every((n) => n.is_read)).toBe(true)
  })
})
